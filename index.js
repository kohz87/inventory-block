import { PROMPT_KEY, SOURCE, VERSION } from './src/constants.js';
import {
    attachMessageRevision,
    commitManualState,
    createRevision,
    ensureRoot,
    getBranchKey,
    getCurrentInventory,
    getInventoryAt,
    getRevision,
    inventoryEquals,
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
} from './src/protocol.js';
import { openInventoryEditor, openInventoryHistory, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount } from './src/megumin.js';

let pendingGeneration = null;
let processingMessage = false;
let initialized = false;

function context() {
    return globalThis.SillyTavern?.getContext?.() ?? null;
}

function hasActiveChat(ctx) {
    if (!ctx) return false;
    try {
        return Boolean(ctx.getCurrentChatId?.() ?? ctx.chatId);
    } catch {
        return Boolean(ctx.chatId);
    }
}

function notify(level, message) {
    globalThis.toastr?.[level]?.(message, 'Inventory Block');
}

function refreshPrompt(ctx = context()) {
    if (!ctx?.setExtensionPrompt) return;
    if (!hasActiveChat(ctx)) {
        ctx.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 0);
        return;
    }

    const inventory = getCurrentInventory(ctx);
    ctx.setExtensionPrompt(PROMPT_KEY, buildInventoryPrompt(inventory), 1, 0, false, 0);
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

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
    if (!ctx || !hasActiveChat(ctx)) {
        notify('warning', 'Open a chat before copying inventory.');
        return;
    }

    try {
        await copyText(formatInventorySeedBlock(getCurrentInventory(ctx)));
        notify('success', 'Inventory block copied.');
    } catch (error) {
        console.error('[Inventory Block] Could not copy inventory block.', error);
        notify('error', 'Could not copy inventory block.');
    }
}

function renderCurrentPane(pane) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    renderInventoryPane(pane, getCurrentInventory(ctx), {
        onEdit: openEditor,
        onCopy: copyInventoryBlock,
        onHistory: openHistory,
    });
}

function refreshAll(ctx = context()) {
    if (!ctx) return;
    refreshPrompt(ctx);
    scheduleInventoryMount(40);
}

async function saveMetadata(ctx) {
    try {
        await ctx.saveMetadata?.();
    } catch (error) {
        console.warn('[Inventory Block] Could not save chat metadata immediately.', error);
        ctx.saveMetadataDebounced?.();
    }
}

async function commitManual(state, options = {}) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) {
        notify('warning', 'Open a chat before editing inventory.');
        return;
    }
    ensureRoot(ctx);
    commitManualState(ctx, state, options);
    await saveMetadata(ctx);
    refreshAll(ctx);
}

async function openEditor() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) {
        notify('warning', 'Open a chat before editing inventory.');
        return;
    }

    await openInventoryEditor(ctx, getCurrentInventory(ctx), {
        onSave: async state => {
            await commitManual(state, { source: SOURCE.MANUAL, note: 'Manual inventory edit' });
            notify('success', 'Inventory saved.');
        },
    });
}

async function openHistory() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) {
        notify('warning', 'Open a chat before viewing inventory history.');
        return;
    }

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
    if (document.querySelector('#inventory_block_menu')) return;
    const menu = document.querySelector('#extensionsMenu');
    if (!menu) return;

    const item = document.createElement('div');
    item.id = 'inventory_block_menu';
    item.className = 'list-group-item flex-container flexGap5';
    item.title = `Inventory Block v${VERSION}`;
    item.innerHTML = `
        <div class="fa-solid fa-box-open extensionsMenuExtensionButton"></div>
        <span>Inventory</span>
    `;
    item.addEventListener('click', openEditor);
    menu.appendChild(item);
}

function generationBase(ctx) {
    const root = ensureRoot(ctx);
    const chatId = ctx.getCurrentChatId?.() ?? ctx.chatId ?? null;
    if (pendingGeneration && pendingGeneration.chatId === chatId && getRevision(root, pendingGeneration.baseRevision)) {
        return pendingGeneration.baseRevision;
    }
    return resolveActiveRevision(ctx);
}

function currentMessageNeedsNewUid(message, type) {
    if (!message?.extra?.inventoryBlockV2?.uid) return true;
    return type === 'swipe' || type === 'normal' || type === 'group' || type === 'first_message';
}

function firstAssistantMessageId(ctx) {
    const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
    for (let index = 0; index < chat.length; index++) {
        const message = chat[index];
        if (message && !message.is_user && !message.is_system) return index;
    }
    return -1;
}

function isFirstAssistantMessage(ctx, messageId) {
    return firstAssistantMessageId(ctx) === Number(messageId);
}

function isPristineRoot(root) {
    const initial = getRevision(root, 0);
    const revisionIds = Object.keys(root?.revisions ?? {});
    return root?.activeRevision === 0
        && root?.nextRevision === 1
        && revisionIds.length === 1
        && revisionIds[0] === '0'
        && Array.isArray(initial?.state?.categories)
        && initial.state.categories.length === 0;
}

function hasSeedTag(text) {
    return /<Inventory\b[^>]*>[\s\S]*?<\/Inventory\s*>/i.test(String(text ?? ''));
}

async function processAssistantMessage(messageId, type = '') {
    if (processingMessage) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    const message = ctx.chat?.[messageId];
    if (!message || message.is_user || message.is_system) return;

    processingMessage = true;
    try {
        const root = ensureRoot(ctx);
        const baseRevision = generationBase(ctx);
        const baseState = getInventoryAt(root, baseRevision);

        let workingText = String(message.mes ?? '');
        let workingState = baseState;
        let seeded = false;
        let seedErrors = [];

        if (isPristineRoot(root) && isFirstAssistantMessage(ctx, messageId) && hasSeedTag(workingText)) {
            const seed = consumeInventorySeed(workingText);
            seedErrors = seed.errors;
            if (seed.found && !seed.errors.length && seed.state) {
                workingText = seed.cleanedText;
                workingState = seed.state;
                seeded = true;
            }
        }

        const result = consumeInventoryUpdates(workingText, workingState);
        const warnings = [...seedErrors, ...result.errors];
        const textChanged = String(message.mes ?? '') !== result.cleanedText;
        if (textChanged) message.mes = result.cleanedText;

        let revision = baseRevision;
        const stateChanged = seedErrors.length === 0 && !inventoryEquals(baseState, result.state);
        if (stateChanged) {
            const note = seeded
                ? (result.changed ? 'First-message inventory seed + LLM update' : 'First-message inventory seed')
                : result.note;
            revision = createRevision(ctx, result.state, {
                parent: baseRevision,
                source: seeded ? SOURCE.SEED : SOURCE.LLM,
                note,
            });
        } else {
            root.activeRevision = baseRevision;
        }

        attachMessageRevision(ctx, messageId, {
            baseRevision,
            revision,
            newUid: currentMessageNeedsNewUid(message, type),
        });
        root.activeRevision = revision;
        rememberBranchHead(ctx, revision);

        if (textChanged) ctx.updateMessageBlock?.(messageId, message);
        await ctx.saveChat?.();
        ctx.saveMetadataDebounced?.();

        if (warnings.length) {
            notify('warning', `Inventory update rejected: ${warnings.join(' ')}`);
            console.warn('[Inventory Block] Rejected inventory control/seed record.', warnings);
        } else if (seeded) {
            notify('success', 'Starting inventory loaded.');
        }

        refreshAll(ctx);
    } catch (error) {
        console.error('[Inventory Block] Failed to process assistant inventory update.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    } finally {
        const chatId = ctx.getCurrentChatId?.() ?? ctx.chatId ?? null;
        if (pendingGeneration?.chatId === chatId) pendingGeneration = null;
        processingMessage = false;
    }
}

async function seedFirstMessageIfNeeded(ctx) {
    const root = ensureRoot(ctx);
    if (!isPristineRoot(root)) return false;

    const messageId = firstAssistantMessageId(ctx);
    if (messageId < 0) return false;
    const message = ctx.chat?.[messageId];
    if (!hasSeedTag(message?.mes)) return false;

    await processAssistantMessage(messageId, 'seed');
    return true;
}

async function resolveBranchAndRefresh() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    try {
        ensureRoot(ctx);
        await seedFirstMessageIfNeeded(ctx);
        resolveActiveRevision(ctx);
        rememberBranchHead(ctx);
        ctx.saveMetadataDebounced?.();
        refreshAll(ctx);
    } catch (error) {
        console.warn('[Inventory Block] Could not restore branch inventory.', error);
    }
}

function onGenerationStarted() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    const root = ensureRoot(ctx);
    resolveActiveRevision(ctx);
    pendingGeneration = {
        chatId: ctx.getCurrentChatId?.() ?? ctx.chatId ?? null,
        baseRevision: root.activeRevision,
        branchKey: getBranchKey(ctx),
    };
}

function onGenerationStopped() {
    setTimeout(() => { pendingGeneration = null; }, 0);
}

function registerEvents() {
    const ctx = context();
    if (!ctx?.eventSource || !ctx?.eventTypes) return;
    const events = ctx.eventTypes;

    ctx.eventSource.on(events.GENERATION_STARTED, onGenerationStarted);
    ctx.eventSource.on(events.GENERATION_STOPPED, onGenerationStopped);
    ctx.eventSource.on(events.MESSAGE_RECEIVED, processAssistantMessage);

    for (const event of [events.MESSAGE_SWIPED, events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED]) {
        if (event) ctx.eventSource.on(event, () => setTimeout(() => void resolveBranchAndRefresh(), 30));
    }

    if (events.CHAT_CHANGED) ctx.eventSource.on(events.CHAT_CHANGED, () => setTimeout(() => void resolveBranchAndRefresh(), 0));
    if (events.CHAT_LOADED) ctx.eventSource.on(events.CHAT_LOADED, () => setTimeout(() => void resolveBranchAndRefresh(), 0));

    for (const event of [events.CHARACTER_MESSAGE_RENDERED, events.MESSAGE_UPDATED, events.MESSAGE_EDITED, events.MORE_MESSAGES_LOADED]) {
        if (event) ctx.eventSource.on(event, () => scheduleInventoryMount(70));
    }
}

export async function init() {
    if (initialized) return;
    initialized = true;

    if (!globalThis.SillyTavern?.getContext) {
        initialized = false;
        console.error('[Inventory Block] SillyTavern.getContext() is unavailable.');
        return;
    }

    addExtensionMenuButton();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();

    const ctx = context();
    if (ctx && hasActiveChat(ctx)) {
        ensureRoot(ctx);
        await seedFirstMessageIfNeeded(ctx);
        resolveActiveRevision(ctx);
        rememberBranchHead(ctx);
        ctx.saveMetadataDebounced?.();
        refreshAll(ctx);
    }

    console.info(`[Inventory Block] v${VERSION} loaded.`);
}

void init();
