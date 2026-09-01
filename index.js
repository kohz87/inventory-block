import { EXTRA_KEY, PROMPT_KEY, SOURCE, VERSION } from './src/constants.js';
import {
    attachMessageRevision,
    commitManualState,
    createRevision,
    ensureRoot,
    getCurrentInventory,
    getInventoryAt,
    getRevision,
    inventoryEquals,
    lineageHashThrough,
    listRevisions,
    rememberBranchHead,
    resolveActiveRevision,
    restoreRevisionAsNew,
} from './src/state.js';
import {
    buildInventoryPrompt,
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    hasInventoryControl,
    stripReservedInventorySeed,
} from './src/protocol.js';
import { openInventoryEditor, openInventoryHistory, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount } from './src/megumin.js';

let pendingGeneration = null;
let processingMessages = new Set();
let initialized = false;
let eventsRegistered = false;
let menuRetry = null;

function context() {
    return globalThis.SillyTavern?.getContext?.() ?? null;
}

function chatIdOf(ctx) {
    try {
        return ctx?.getCurrentChatId?.() ?? ctx?.chatId ?? null;
    } catch {
        return ctx?.chatId ?? null;
    }
}

function hasActiveChat(ctx) {
    return Boolean(ctx && chatIdOf(ctx));
}

function notify(level, message) {
    globalThis.toastr?.[level]?.(message, 'Inventory Block');
}

function refreshPrompt(ctx = context(), revisionId = null) {
    if (!ctx?.setExtensionPrompt) return;
    if (!hasActiveChat(ctx)) {
        ctx.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 0);
        return;
    }
    try {
        const root = ensureRoot(ctx);
        const state = revisionId === null ? getCurrentInventory(ctx) : getInventoryAt(root, revisionId);
        ctx.setExtensionPrompt(PROMPT_KEY, buildInventoryPrompt(state), 1, 0, false, 0);
    } catch (error) {
        console.error('[Inventory Block] Could not refresh inventory prompt.', error);
        ctx.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 0);
    }
}

function renderCurrentPane(pane) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    renderInventoryPane(pane, getCurrentInventory(ctx), {
        uiKey: String(chatIdOf(ctx)),
        onEdit: openEditor,
        onCopy: copyInventoryBlock,
        onHistory: openHistory,
    });
}

function refreshAll(ctx = context()) {
    refreshPrompt(ctx);
    scheduleInventoryMount(30);
}

function persistChatSoon(ctx) {
    setTimeout(() => {
        try {
            const result = ctx?.saveChat?.();
            if (result?.catch) result.catch(error => console.warn('[Inventory Block] Deferred chat save failed.', error));
        } catch (error) {
            console.warn('[Inventory Block] Deferred chat save failed.', error);
        }
        ctx?.saveMetadataDebounced?.();
    }, 0);
}

function refreshRenderedMessageIfPresent(ctx, messageId, message) {
    const selector = `#chat .mes[mesid="${Number(messageId)}"]`;
    if (document.querySelector(selector)) ctx.updateMessageBlock?.(messageId, message);
}

async function saveMetadata(ctx) {
    try {
        await ctx.saveMetadata?.();
    } catch (error) {
        console.warn('[Inventory Block] Could not save chat metadata immediately.', error);
        ctx.saveMetadataDebounced?.();
    }
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

async function copyInventoryBlock() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before copying inventory.');
    try {
        await copyText(formatInventorySeedBlock(getCurrentInventory(ctx)));
        notify('success', 'Inventory block copied.');
    } catch (error) {
        console.error('[Inventory Block] Could not copy inventory block.', error);
        notify('error', 'Could not copy inventory block.');
    }
}

async function commitManual(state, options = {}) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before editing inventory.');
    ensureRoot(ctx);
    commitManualState(ctx, state, options);
    await saveMetadata(ctx);
    refreshAll(ctx);
}

async function openEditor() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before editing inventory.');
    await openInventoryEditor(ctx, getCurrentInventory(ctx), {
        onSave: async state => {
            await commitManual(state, { source: SOURCE.MANUAL, note: 'Manual inventory edit' });
            notify('success', 'Inventory saved.');
        },
    });
}

async function openHistory() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before viewing inventory history.');
    const root = ensureRoot(ctx);
    await openInventoryHistory(ctx, listRevisions(ctx), root.activeRevision, {
        onRestore: async revisionId => {
            restoreRevisionAsNew(ctx, revisionId);
            await saveMetadata(ctx);
            refreshAll(ctx);
        },
    });
}

function addExtensionMenuButton() {
    if (document.querySelector('#inventory_block_menu')) return true;
    const menu = document.querySelector('#extensionsMenu');
    if (!menu) return false;
    const item = document.createElement('div');
    item.id = 'inventory_block_menu';
    item.className = 'list-group-item flex-container flexGap5';
    item.title = `Inventory Block v${VERSION}`;
    item.innerHTML = '<div class="fa-solid fa-box-open extensionsMenuExtensionButton"></div><span>Inventory</span>';
    item.addEventListener('click', openEditor);
    menu.appendChild(item);
    return true;
}

function ensureMenuButton() {
    if (addExtensionMenuButton()) {
        if (menuRetry) clearTimeout(menuRetry);
        menuRetry = null;
        return;
    }
    if (!menuRetry) menuRetry = setTimeout(() => { menuRetry = null; ensureMenuButton(); }, 250);
}

function firstAssistantMessageId(ctx) {
    const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
    return chat.findIndex(message => message && !message.is_user && !message.is_system);
}

function latestAssistantMessageId(ctx) {
    const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
    for (let i = chat.length - 1; i >= 0; i--) {
        const message = chat[i];
        if (message && !message.is_user && !message.is_system) return i;
    }
    return -1;
}

function isFirstAssistantMessage(ctx, messageId) {
    return firstAssistantMessageId(ctx) === Number(messageId);
}

function activeMessageMeta(message) {
    return message?.extra?.[EXTRA_KEY] ?? null;
}

function generationBase(ctx) {
    const root = ensureRoot(ctx);
    if (pendingGeneration && pendingGeneration.chatId === chatIdOf(ctx) && getRevision(root, pendingGeneration.baseRevision)) {
        return pendingGeneration.baseRevision;
    }
    return resolveActiveRevision(ctx);
}

function currentMessageNeedsNewUid(message, type) {
    if (!activeMessageMeta(message)?.uid) return true;
    return ['swipe', 'regenerate', 'normal', 'group', 'first_message', 'seed'].includes(String(type ?? '').toLocaleLowerCase());
}

function acceptExistingMessageBase(message, type, fallbackBase) {
    const existing = activeMessageMeta(message);
    const lower = String(type ?? '').toLocaleLowerCase();
    if (existing && (lower === 'continue' || lower === 'updated' || lower === 'message_updated')) return existing.baseRevision;
    if (existing && pendingGeneration?.type === 'continue') return existing.baseRevision;
    return fallbackBase;
}

function reportWarnings(warnings) {
    if (!warnings.length) return;
    notify('warning', `Inventory update rejected: ${warnings.join(' ')}`);
    console.warn('[Inventory Block] Inventory control/seed rejected.', warnings);
}

async function processAssistantMessage(messageId, type = '') {
    const id = Number(messageId);
    if (!Number.isInteger(id) || processingMessages.has(id)) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return;

    processingMessages.add(id);
    try {
        const root = ensureRoot(ctx);
        const existingMeta = activeMessageMeta(message);
        const firstMessage = isFirstAssistantMessage(ctx, id);
        const hasSeed = /<Inventory\b/i.test(String(message.mes ?? ''));
        const pending = pendingGeneration?.chatId === chatIdOf(ctx) ? pendingGeneration : null;
        const currentLineageHash = lineageHashThrough(ctx, id);
        const seedAllowed = firstMessage && hasSeed && (
            (pending && ['swipe', 'regenerate'].includes(pending.type) && pending.baseRevision === 0) ||
            (ctx.chat.length <= id + 1 && (!existingMeta || existingMeta.lineageHash !== currentLineageHash))
        );
        const latestAssistant = latestAssistantMessageId(ctx) === id;
        if (!latestAssistant && !seedAllowed) {
            let cleaned = String(message.mes ?? '');
            const reserved = stripReservedInventorySeed(cleaned);
            cleaned = reserved.cleanedText;
            const stripped = consumeInventoryUpdates(cleaned, getCurrentInventory(ctx));
            cleaned = stripped.cleanedText;
            const hadMachineSyntax = reserved.found || stripped.hadControl;
            if (hadMachineSyntax) notify('warning', 'Historical inventory control text was stripped without changing inventory state.');
            message.mes = cleaned;
            refreshRenderedMessageIfPresent(ctx, id, message);
            persistChatSoon(ctx);
            setTimeout(() => void resolveBranchAndRefresh(), 0);
            return;
        }

        let baseRevision = seedAllowed ? 0 : generationBase(ctx);
        if (!getRevision(root, baseRevision)) baseRevision = resolveActiveRevision(ctx);
        const baseState = getInventoryAt(root, baseRevision);
        let workingText = String(message.mes ?? '');
        let workingState = baseState;
        let seeded = false;
        const warnings = [];

        if (seedAllowed) {
            const seed = consumeInventorySeed(workingText);
            warnings.push(...seed.errors);
            workingText = seed.cleanedText;
            if (seed.found && !seed.errors.length && seed.state) {
                workingState = seed.state;
                seeded = true;
            }
        } else {
            const reserved = stripReservedInventorySeed(workingText);
            if (reserved.found) {
                workingText = reserved.cleanedText;
                warnings.push(reserved.truncated
                    ? 'A later/truncated <Inventory> block was stripped. Starting inventory tags are first-message-only.'
                    : 'A later <Inventory> block was stripped. Starting inventory tags are first-message-only.');
            }
        }

        const result = consumeInventoryUpdates(workingText, workingState);
        warnings.push(...result.errors);
        const controlChangedState = result.changed && result.errors.length === 0;

        const concurrentConflict = Boolean(pending && root.mutationSerial !== pending.mutationSerial);
        if (concurrentConflict) warnings.push(controlChangedState
            ? 'Inventory changed while generation was running; the generated inventory write was discarded.'
            : 'Inventory changed while generation was running; the newer inventory state was preserved.');

        let acceptedState = result.state;
        let acceptedRevision = baseRevision;
        const source = seeded ? SOURCE.SEED : SOURCE.LLM;
        let note = seeded ? 'First-message inventory seed' : result.note;

        if (concurrentConflict) {
            acceptedRevision = root.activeRevision;
            acceptedState = getInventoryAt(root, acceptedRevision);
        } else {
            const changedFromBase = warnings.length === 0 && !inventoryEquals(baseState, acceptedState);
            if (changedFromBase) {
                if (seeded && result.changed) note = 'First-message inventory seed + LLM update';
                acceptedRevision = createRevision(ctx, acceptedState, { parent: baseRevision, source, note });
            } else {
                acceptedRevision = baseRevision;
                if (!getRevision(root, acceptedRevision)) acceptedRevision = baseRevision;
                root.activeRevision = acceptedRevision;
            }
        }

        message.mes = result.cleanedText;
        const messageBaseRevision = acceptExistingMessageBase(message, type, baseRevision);
        attachMessageRevision(ctx, id, {
            baseRevision: Number.isInteger(messageBaseRevision) ? messageBaseRevision : baseRevision,
            revision: acceptedRevision,
            newUid: currentMessageNeedsNewUid(message, type),
        });
        root.activeRevision = acceptedRevision;
        rememberBranchHead(ctx, acceptedRevision);

        refreshRenderedMessageIfPresent(ctx, id, message);
        persistChatSoon(ctx);
        reportWarnings(warnings);
        if (seeded && !warnings.length) notify('success', 'Starting inventory loaded.');
        refreshAll(ctx);
    } catch (error) {
        console.error('[Inventory Block] Failed to process assistant inventory state.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    } finally {
        if (pendingGeneration?.chatId === chatIdOf(ctx)) pendingGeneration = null;
        processingMessages.delete(id);
    }
}

async function seedFirstMessageIfNeeded(ctx) {
    const id = firstAssistantMessageId(ctx);
    if (id < 0) return false;
    const message = ctx.chat?.[id];
    if (!/<Inventory\b/i.test(String(message?.mes ?? ''))) return false;
    const meta = activeMessageMeta(message);
    if (meta && meta.lineageHash === lineageHashThrough(ctx, id)) return false;
    if (ctx.chat.length > id + 1) return false;
    await processAssistantMessage(id, 'seed');
    return true;
}

async function resolveBranchAndRefresh() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) {
        refreshPrompt(ctx);
        scheduleInventoryMount(20);
        return;
    }
    try {
        ensureRoot(ctx);
        await seedFirstMessageIfNeeded(ctx);
        resolveActiveRevision(ctx);
        rememberBranchHead(ctx);
        ctx.saveMetadataDebounced?.();
        refreshAll(ctx);
    } catch (error) {
        console.warn('[Inventory Block] Could not restore branch inventory.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    }
}

function onGenerationStarted(type = 'normal', _params = null, isDryRun = false) {
    if (isDryRun) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    try {
        const root = ensureRoot(ctx);
        const previousActiveRevision = resolveActiveRevision(ctx);
        const targetMessageId = latestAssistantMessageId(ctx);
        const targetMeta = targetMessageId >= 0 ? activeMessageMeta(ctx.chat?.[targetMessageId]) : null;
        const lower = String(type || 'normal').toLocaleLowerCase();
        let baseRevision = previousActiveRevision;
        if (['swipe', 'regenerate'].includes(lower) && Number.isInteger(targetMeta?.baseRevision) && getRevision(root, targetMeta.baseRevision)) {
            baseRevision = targetMeta.baseRevision;
        }
        pendingGeneration = {
            chatId: chatIdOf(ctx),
            type: lower,
            baseRevision,
            previousActiveRevision,
            mutationSerial: root.mutationSerial,
            targetMessageId,
            startedAt: Date.now(),
        };
        refreshPrompt(ctx, baseRevision);
    } catch (error) {
        console.warn('[Inventory Block] Could not prepare generation inventory state.', error);
    }
}

function onGenerationFinished() {
    const snapshot = pendingGeneration;
    if (!snapshot) return;
    setTimeout(() => {
        if (pendingGeneration !== snapshot) return;
        pendingGeneration = null;
        refreshAll(context());
    }, 250);
}

function onMessageUpdated(messageId, type = 'updated') {
    const ctx = context();
    const message = ctx?.chat?.[Number(messageId)];
    if (!message || message.is_user || message.is_system) return;
    const pending = pendingGeneration?.chatId === chatIdOf(ctx) ? pendingGeneration : null;
    const isPendingTarget = pending?.targetMessageId === Number(messageId);
    if (hasInventoryControl(message.mes) || isPendingTarget) {
        void processAssistantMessage(messageId, pending?.type ?? type);
    } else {
        setTimeout(() => void resolveBranchAndRefresh(), 0);
    }
}

function registerEvents() {
    if (eventsRegistered) return;
    const ctx = context();
    if (!ctx?.eventSource || !ctx?.eventTypes) return;
    eventsRegistered = true;
    const events = ctx.eventTypes;

    if (events.GENERATION_STARTED) ctx.eventSource.on(events.GENERATION_STARTED, onGenerationStarted);
    if (events.GENERATION_STOPPED) ctx.eventSource.on(events.GENERATION_STOPPED, onGenerationFinished);
    if (events.GENERATION_ENDED) ctx.eventSource.on(events.GENERATION_ENDED, onGenerationFinished);
    if (events.MESSAGE_RECEIVED) ctx.eventSource.on(events.MESSAGE_RECEIVED, processAssistantMessage);
    if (events.MESSAGE_UPDATED) ctx.eventSource.on(events.MESSAGE_UPDATED, onMessageUpdated);
    if (events.MESSAGE_EDITED) ctx.eventSource.on(events.MESSAGE_EDITED, onMessageUpdated);

    for (const event of [events.MESSAGE_SWIPED, events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED, events.CHARACTER_FIRST_MESSAGE_SELECTED]) {
        if (event) ctx.eventSource.on(event, () => setTimeout(() => void resolveBranchAndRefresh(), 20));
    }
    for (const event of [events.CHAT_CHANGED, events.CHAT_LOADED]) {
        if (event) ctx.eventSource.on(event, () => setTimeout(() => void resolveBranchAndRefresh(), 0));
    }
    for (const event of [events.APP_READY, events.APP_INITIALIZED, events.EXTENSIONS_FIRST_LOAD]) {
        if (event) ctx.eventSource.on(event, () => {
            ensureMenuButton();
            initializeMeguminBridge(renderCurrentPane);
            setTimeout(() => void resolveBranchAndRefresh(), 0);
        });
    }
    for (const event of [events.CHARACTER_MESSAGE_RENDERED, events.MORE_MESSAGES_LOADED]) {
        if (event) ctx.eventSource.on(event, () => scheduleInventoryMount(50));
    }
}

export async function init() {
    if (initialized) return;
    if (!globalThis.SillyTavern?.getContext) {
        setTimeout(() => void init(), 100);
        return;
    }
    initialized = true;
    ensureMenuButton();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();
    await resolveBranchAndRefresh();
    console.info(`[Inventory Block] v${VERSION} loaded.`);
}

void init();
