import {
    bareBlockTexts,
    emptyInventory,
    formatInventoryBlock,
    inventoryBlocks,
    inventoryForGeneration,
    latestAssistantIndex,
    latestInventorySnapshot,
    normalizeInventoryTransports,
    replaceOrAppendInventory,
    syncActiveSwipeText,
    truncatedSnapshot,
} from './src/snapshot.js';
import { buildInventoryGenerationPrompt, defuseMacros, hasInventoryContext, injectInventorySnapshot, stripHistoricalInventory } from './src/prompt.js';
import { DEFAULT_MAX_DEPTH, MAX_MAX_DEPTH, MIN_MAX_DEPTH, clampDepth } from './src/tree.js';
import { copyText, openInventoryEditor, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount, setInventoryMountSuspended } from './src/megumin.js';

const VERSION = '0.6.6';
const SETTINGS_KEY = 'inventoryBlock';
const EXTENSION_PROMPT_KEY = 'inventory_block';
// SillyTavern extension_prompt_types.IN_PROMPT / extension_prompt_roles.SYSTEM.
const EXTENSION_PROMPT_IN_PROMPT = 0;
const EXTENSION_PROMPT_ROLE_SYSTEM = 0;
const SESSION_MAX_AGE_MS = 2 * 60 * 1000;
const SESSION_RECHECK_MS = 15 * 1000;

let initialized = false;
let eventsRegistered = false;
let uiRetry = null;
const pending = new Map();
const cleanupTimers = new Map();
const normalizingMessages = new Set();

function context() {
    return globalThis.SillyTavern?.getContext?.() ?? null;
}

function chatIdOf(ctx) {
    try { return ctx?.getCurrentChatId?.() ?? ctx?.chatId ?? null; }
    catch { return ctx?.chatId ?? null; }
}

function hasActiveChat(ctx) {
    return Boolean(ctx && chatIdOf(ctx));
}

function notify(level, message) {
    globalThis.toastr?.[level]?.(message, 'Inventory Block');
}

function normalizeType(type) {
    return String(type ?? 'normal').trim().toLowerCase();
}

// SillyTavern's background generation types; Inventory drives only foreground replies.
function isBackgroundGeneration(type, isDryRun = false) {
    if (isDryRun) return true;
    const lower = normalizeType(type);
    return lower === 'quiet' || lower === 'impersonate';
}

function settings(ctx = context()) {
    const store = ctx?.extensionSettings;
    if (!store || typeof store !== 'object') return { maxDepth: DEFAULT_MAX_DEPTH };
    if (!store[SETTINGS_KEY] || typeof store[SETTINGS_KEY] !== 'object') store[SETTINGS_KEY] = {};
    const own = store[SETTINGS_KEY];
    own.maxDepth = clampDepth(own.maxDepth ?? DEFAULT_MAX_DEPTH);
    return own;
}

function currentSnapshot(ctx = context()) {
    return latestInventorySnapshot(ctx?.chat ?? []);
}

function currentState(ctx = context()) {
    return currentSnapshot(ctx)?.state ?? emptyInventory();
}

function renderCurrentPane(pane) {
    const ctx = context();
    const snapshot = currentSnapshot(ctx);
    const previous = snapshot ? latestInventorySnapshot(ctx?.chat ?? [], { beforeIndex: snapshot.messageIndex }) : null;
    renderInventoryPane(pane, snapshot?.state ?? emptyInventory(), {
        hasSnapshot: Boolean(snapshot),
        previousState: previous?.state ?? null,
        // The newest reply carried no snapshot, so these changes belong to an earlier reply.
        changesFromEarlierReply: Boolean(snapshot) && snapshot.messageIndex !== latestAssistantIndex(ctx?.chat ?? []),
        maxDepth: settings(ctx).maxDepth,
        onEdit: openEditor,
        onCopy: copyCurrentBlock,
        uiKey: chatIdOf(ctx) ?? 'default',
    });
}

function refreshAll(delay = 20) {
    scheduleInventoryMount(delay, { forceRender: true });
}

function syncMountSuspension() {
    const activeId = chatIdOf(context());
    setInventoryMountSuspended(Boolean(activeId && pending.has(activeId)));
}

function clearCleanupTimer(chatId) {
    const timer = cleanupTimers.get(chatId);
    if (timer) clearTimeout(timer);
    cleanupTimers.delete(chatId);
}

/**
 * Text-completion APIs receive the Inventory context through SillyTavern's
 * extension prompt, which places it inside the instruct template's story string.
 * Chat completion keeps the system message inserted at prompt-ready.
 */
function usesExtensionPrompt(ctx) {
    return Boolean(ctx?.mainApi) && ctx.mainApi !== 'openai' && typeof ctx.setExtensionPrompt === 'function';
}

function setInventoryExtensionPrompt(ctx, value = '') {
    if (typeof ctx?.setExtensionPrompt !== 'function') return;
    ctx.setExtensionPrompt(EXTENSION_PROMPT_KEY, value, EXTENSION_PROMPT_IN_PROMPT, 0, false, EXTENSION_PROMPT_ROLE_SYSTEM);
}

function clearSession(chatId) {
    if (!chatId) return;
    clearCleanupTimer(chatId);
    pending.delete(chatId);
    if (!pending.size) setInventoryExtensionPrompt(context(), '');
    syncMountSuspension();
}

function scheduleSessionCleanup(chatId, delay = 3000) {
    clearCleanupTimer(chatId);
    cleanupTimers.set(chatId, setTimeout(() => clearSession(chatId), delay));
}

// SillyTavern marks <body data-generating="true"> and shows its Stop button while a reply generates.
function generationRunning() {
    if (document.body?.dataset?.generating === 'true') return true;
    const stop = document.getElementById('mes_stop');
    return Boolean(stop) && getComputedStyle(stop).display !== 'none';
}

/**
 * Safety net for generations that never report back (API errors, aborts that
 * emit no end event). Without it the session stays pending, Inventory stays
 * suspended and the pane never refreshes again until the next generation.
 */
function armSessionWatchdog(chatId, delay = SESSION_MAX_AGE_MS) {
    clearCleanupTimer(chatId);
    cleanupTimers.set(chatId, setTimeout(() => {
        if (generationRunning()) armSessionWatchdog(chatId, SESSION_RECHECK_MS);
        else clearSession(chatId);
    }, delay));
}

function prepareGeneration(type = 'normal', _params = null, isDryRun = false) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return null;
    if (isBackgroundGeneration(type, isDryRun)) {
        // A quiet/impersonate generation started before the reply's own prompt is built (for
        // example from another extension's handler) builds its prompt first, and in text
        // completion that prompt carries the Inventory placeholder too. Count it so it is
        // not mistaken for the reply's prompt.
        const pendingSession = pending.get(chatIdOf(ctx));
        if (!isDryRun && pendingSession && !pendingSession.consumed) pendingSession.backgroundPrompts += 1;
        return null;
    }
    const chatId = chatIdOf(ctx);
    const session = {
        chatId,
        state: inventoryForGeneration(ctx.chat, type),
        contextInPrompt: usesExtensionPrompt(ctx),
        consumed: false,
        backgroundPrompts: 0,
    };
    setInventoryExtensionPrompt(ctx, session.contextInPrompt ? defuseMacros(buildInventoryGenerationPrompt(session.state, { maxDepth: settings(ctx).maxDepth })) : '');
    pending.set(chatId, session);
    armSessionWatchdog(chatId);
    syncMountSuspension();
    return session;
}

// Session lifetime is owned by the watchdog, which knows whether a reply is still generating.
function selectPromptSession() {
    const activeId = chatIdOf(context());
    if (activeId && pending.has(activeId)) return pending.get(activeId);
    return pending.size === 1 ? [...pending.values()][0] : null;
}

async function onGenerationInterceptor(_chat, _contextSize, _abort, type = 'normal') {
    if (isBackgroundGeneration(type)) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    const chatId = chatIdOf(ctx);
    if (!pending.has(chatId)) prepareGeneration(type);
}

globalThis.inventoryBlockGenerationInterceptor = onGenerationInterceptor;

/**
 * Only the foreground reply's own prompt receives Inventory instructions. Other
 * prompts that fire while a reply is pending (raw or quiet generations by
 * other extensions) are background prompts. Text completion recognises the foreground
 * prompt exactly by the context SillyTavern placed into it; chat completion takes the
 * first prompt after the generation started.
 */
function isForegroundPrompt(session, eventData) {
    if (!session || session.consumed) return false;
    const candidate = session.contextInPrompt && typeof eventData?.prompt === 'string' ? hasInventoryContext(eventData.prompt) : true;
    if (candidate && session.backgroundPrompts > 0) {
        session.backgroundPrompts -= 1;
        return false;
    }
    return candidate;
}

// Visible snapshot blocks in chat history, so copies embedded in user/system content by
// presets can be told apart from blocks a person wrote there.
function historyBlocks(ctx) {
    const known = new Set();
    for (const message of ctx?.chat ?? []) {
        if (message && !message.is_user && !message.is_system) bareBlockTexts(message.mes).forEach(block => known.add(block));
    }
    return known;
}

function onPromptReady(eventData = null) {
    if (eventData?.dryRun === true) return;
    const session = selectPromptSession();
    const knownBlocks = Array.isArray(eventData?.chat) ? historyBlocks(context()) : null;
    if (!isForegroundPrompt(session, eventData)) {
        // Background prompts get no instructions and keep only the newest snapshot.
        stripHistoricalInventory(eventData, { knownBlocks });
        return;
    }
    const result = injectInventorySnapshot(eventData, session.state, { maxDepth: settings().maxDepth, contextInPrompt: session.contextInPrompt, knownBlocks });
    if (result.injected) {
        session.consumed = true;
        // The context is needed for this one prompt; later quiet prompts must not inherit it.
        if (session.contextInPrompt) setInventoryExtensionPrompt(context(), '');
    } else if (result.reason !== 'unsupported-event') {
        console.warn(`[Inventory Block] prompt injection skipped: ${result.reason}`);
    }
}

function newestGeneratedBlockStatus(message) {
    const text = String(message?.mes ?? '');
    const blocks = inventoryBlocks(text);
    if (blocks.length) {
        const latest = blocks.at(-1);
        if (latest.state) return { valid: true, malformed: false, truncated: false };
        return { valid: false, malformed: true, truncated: false, error: latest.error };
    }
    return { valid: false, malformed: false, truncated: Boolean(truncatedSnapshot(text)) };
}

async function saveChat(ctx) {
    if (typeof ctx.saveChat === 'function') await ctx.saveChat();
    else ctx.saveMetadataDebounced?.();
}

// No MESSAGE_UPDATED is emitted here: built-in Translate re-translates (and, with auto
// mode off, discards a manual translation) and Summarize reacts to it. On receive,
// SillyTavern's CHARACTER_MESSAGE_RENDERED follows anyway; on edit, SillyTavern renders
// the normalized text itself and emits MESSAGE_UPDATED once.
async function persistMessageEdit(ctx, messageId, message, { rerender = true, save = true } = {}) {
    syncActiveSwipeText(message);
    if (rerender && document.querySelector(`#chat .mes[mesid="${Number(messageId)}"]`)) {
        ctx.updateMessageBlock?.(messageId, message);
    }
    if (save) await saveChat(ctx);
}

async function normalizeMessageTransport(messageId, { rerender = true, save = true } = {}) {
    const ctx = context();
    const id = Number(messageId);
    if (!ctx || !Number.isInteger(id) || normalizingMessages.has(id)) return false;
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return false;
    const normalized = normalizeInventoryTransports(message.mes);
    if (!normalized.changed) return false;

    normalizingMessages.add(id);
    try {
        message.mes = normalized.text;
        await persistMessageEdit(ctx, id, message, { rerender, save });
        return true;
    } finally {
        normalizingMessages.delete(id);
    }
}

async function onMessageReceived(messageId) {
    const ctx = context();
    const id = Number(messageId);
    if (!ctx || !Number.isInteger(id)) return;
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return;

    const chatId = chatIdOf(ctx);
    const wasTracked = Boolean(chatId && pending.has(chatId));
    const status = wasTracked ? newestGeneratedBlockStatus(message) : null;

    // Keep the snapshot in raw message history, but hide its transport from narration.
    // This also normalizes weak-model plain <Inventory> output into the canonical comment envelope.
    await normalizeMessageTransport(id, { rerender: true });

    if (status && !status.valid) {
        if (status.malformed) {
            notify('warning', `Malformed Inventory snapshot ignored; previous valid snapshot remains current. ${status.error?.message ?? ''}`.trim());
        } else if (status.truncated) {
            notify('warning', 'Truncated Inventory snapshot ignored; previous valid snapshot remains current.');
        } else {
            notify('warning', 'Response omitted a valid Inventory snapshot; previous valid snapshot remains current.');
        }
    }
    clearSession(chatId);
    refreshAll(0);
}

function onGenerationEnded() {
    const chatId = chatIdOf(context());
    if (chatId && pending.has(chatId)) scheduleSessionCleanup(chatId, 2500);
    setTimeout(() => {
        syncMountSuspension();
        refreshAll(0);
    }, 50);
}

function onGenerationStopped() {
    clearSession(chatIdOf(context()));
    refreshAll(0);
}

async function saveManualSnapshot(state, expectedChatId) {
    const ctx = context();
    if (!ctx || chatIdOf(ctx) !== expectedChatId) throw new Error('The active chat changed while the Inventory editor was open. Nothing was saved.');
    if (pending.has(expectedChatId)) throw new Error('Finish the current generation before editing Inventory.');
    const target = latestAssistantIndex(ctx.chat);
    if (target < 0) throw new Error('No assistant message exists yet. Generate or open a greeting before saving Inventory.');
    const message = ctx.chat[target];
    message.mes = replaceOrAppendInventory(message.mes, state);
    // Inventory transport is hidden machine state. Re-rendering the whole assistant message
    // would destroy DOM owned by Megumin Suite and other extensions even though no visible
    // narration changed. Persist the raw message/swipe only, then refresh Inventory's pane.
    await persistMessageEdit(ctx, target, message, { rerender: false });
    refreshAll(0);
}

async function openEditor() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before editing Inventory.');
    const expectedChatId = chatIdOf(ctx);
    try {
        const saved = await openInventoryEditor(ctx, currentState(ctx), {
            onSave: state => saveManualSnapshot(state, expectedChatId),
        });
        if (saved) notify('success', 'Inventory snapshot saved into chat history.');
    } catch (error) {
        notify('error', error instanceof Error ? error.message : String(error));
    }
}

function rescanReport(ctx, hidden) {
    const snapshot = currentSnapshot(ctx);
    let invalid = null;
    for (let i = latestAssistantIndex(ctx.chat); i > (snapshot?.messageIndex ?? -1); i--) {
        const message = ctx.chat[i];
        if (!message || message.is_user || message.is_system) continue;
        const status = newestGeneratedBlockStatus(message);
        if (status.malformed || status.truncated) {
            invalid = { index: i, status };
            break;
        }
    }

    const notes = [];
    if (invalid) {
        const reason = invalid.status.malformed ? 'malformed' : 'truncated';
        const error = String(invalid.status.error?.message ?? '').replace(/\.+$/, '');
        const detail = error ? `: ${error}` : '';
        notes.push(`Message #${invalid.index} has a ${reason} Inventory block${detail}.`);
    }
    if (hidden) notes.push(`Hid ${hidden} raw Inventory ${hidden === 1 ? 'block' : 'blocks'} from narration.`);

    if (!snapshot) return notify('warning', ['No valid Inventory snapshot found in this chat.', ...notes].join(' '));
    const count = snapshot.state.categories.reduce((sum, category) => sum + category.items.length, 0);
    const summary = `Showing ${count} ${count === 1 ? 'item' : 'items'} from message #${snapshot.messageIndex}.`;
    notify(invalid ? 'warning' : 'success', [...notes, summary].join(' '));
}

/**
 * Manual Refresh / Rescan: recover from a stale generation session, hide any
 * raw snapshot left visible in narration, re-read the chat and report which
 * snapshot is current.
 */
async function rescanInventory() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before rescanning Inventory.');
    const chatId = chatIdOf(ctx);
    if (pending.has(chatId)) {
        if (generationRunning()) return notify('info', 'A response is still generating. Inventory refreshes when it finishes.');
        clearSession(chatId);
    }

    let hidden = 0;
    try {
        for (let id = 0; id < (ctx.chat?.length ?? 0); id++) {
            if (await normalizeMessageTransport(id, { rerender: true, save: false })) hidden++;
        }
        if (hidden) await saveChat(ctx);
    } catch (error) {
        notify('error', `Rescan could not update chat messages: ${error instanceof Error ? error.message : String(error)}`);
    }

    refreshAll(0);
    rescanReport(ctx, hidden);
}

async function copyCurrentBlock() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before copying Inventory.');
    const snapshot = currentSnapshot(ctx);
    if (!snapshot) return notify('warning', 'No valid Inventory snapshot exists yet.');
    try {
        await copyText(formatInventoryBlock(snapshot.state));
        notify('success', 'Current Inventory block copied.');
    } catch (error) {
        notify('error', error instanceof Error ? error.message : 'Could not copy Inventory.');
    }
}

function addMenuButton(documentRef) {
    if (documentRef.querySelector('#inventory_block_menu')) return true;
    const menu = documentRef.querySelector('#extensionsMenu');
    if (!menu) return false;
    const item = documentRef.createElement('div');
    item.id = 'inventory_block_menu';
    item.className = 'list-group-item flex-container flexGap5';
    item.title = `Inventory Block v${VERSION}`;
    item.innerHTML = '<div class="fa-solid fa-box-open extensionsMenuExtensionButton"></div><span>Inventory</span>';
    item.addEventListener('click', openEditor);
    menu.appendChild(item);
    return true;
}

function addSettingsPanel(documentRef) {
    if (documentRef.querySelector('#inventory_block_settings')) return true;
    const host = documentRef.querySelector('#extensions_settings') ?? documentRef.querySelector('#extensions_settings2');
    if (!host) return false;
    const wrapper = documentRef.createElement('div');
    wrapper.id = 'inventory_block_settings';
    wrapper.className = 'inventory-block-settings';
    wrapper.innerHTML = `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Inventory Block</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="inventory-block-settings-version">v${VERSION} · message-native snapshots</div>
                <div class="inventory-block-settings-actions">
                    <button id="inventory_block_settings_edit" type="button" class="menu_button"><i class="fa-solid fa-pen-to-square"></i> Edit Inventory</button>
                    <button id="inventory_block_settings_copy" type="button" class="menu_button"><i class="fa-solid fa-copy"></i> Copy Current Block</button>
                    <button id="inventory_block_settings_refresh" type="button" class="menu_button"><i class="fa-solid fa-rotate"></i> Refresh / Rescan</button>
                </div>
                <label class="inventory-block-settings-field" for="inventory_block_settings_depth">
                    <span>Sub-category depth</span>
                    <select id="inventory_block_settings_depth" class="text_pole">
                        ${Array.from({ length: MAX_MAX_DEPTH - MIN_MAX_DEPTH + 1 }, (_, i) => MIN_MAX_DEPTH + i)
                            .map(depth => `<option value="${depth}">${depth === 1 ? '1 (no nesting)' : depth}</option>`).join('')}
                    </select>
                </label>
                <div class="inventory-block-settings-note">Sub-categories use full-path headers such as [Wagon &gt; Food]. Paths deeper than this limit are folded into their last level; nothing is hidden.</div>
                <div class="inventory-block-settings-note">The latest valid surviving &lt;Inventory&gt; snapshot in the selected chat/swipe is the source of truth. There is no separate backend revision database.</div>
            </div>
        </div>`;
    const depth = wrapper.querySelector('#inventory_block_settings_depth');
    if (depth) {
        depth.value = String(settings().maxDepth);
        depth.addEventListener('change', () => {
            const ctx = context();
            settings(ctx).maxDepth = clampDepth(depth.value);
            ctx?.saveSettingsDebounced?.();
            refreshAll(0);
        });
    }
    wrapper.querySelector('#inventory_block_settings_edit')?.addEventListener('click', openEditor);
    wrapper.querySelector('#inventory_block_settings_copy')?.addEventListener('click', copyCurrentBlock);
    wrapper.querySelector('#inventory_block_settings_refresh')?.addEventListener('click', () => void rescanInventory());
    host.appendChild(wrapper);
    return true;
}

function syncSettingsPanel(documentRef = document) {
    const depth = documentRef.querySelector('#inventory_block_settings_depth');
    if (depth) depth.value = String(settings().maxDepth);
}

function ensureExtensionUi() {
    const menuReady = addMenuButton(document);
    const settingsReady = addSettingsPanel(document);
    if (menuReady && settingsReady) {
        if (uiRetry) clearTimeout(uiRetry);
        uiRetry = null;
        return;
    }
    if (!uiRetry) uiRetry = setTimeout(() => {
        uiRetry = null;
        ensureExtensionUi();
    }, 250);
}

function onTimelineChanged() {
    refreshAll(20);
}

function onMessageVariantChanged(messageId) {
    void normalizeMessageTransport(messageId).finally(() => refreshAll(20));
}

// SillyTavern awaits MESSAGE_EDITED, then renders chat[id].mes itself and emits
// MESSAGE_UPDATED. Normalizing before that render needs no re-render of our own.
async function onMessageEdited(messageId) {
    try { await normalizeMessageTransport(messageId, { rerender: false }); }
    finally { refreshAll(20); }
}

function onCharacterMessageRendered(messageId) {
    void normalizeMessageTransport(messageId).finally(() => refreshAll(20));
}

function onChatChanged() {
    // Pending sessions are chat-scoped and intentionally survive UI chat switches.
    // A generation that was already prepared may still reach prompt-ready after the user
    // views another chat; dropping it here would silently omit Inventory from that request.
    syncMountSuspension();
    refreshAll(0);
}

function registerEvents() {
    if (eventsRegistered) return;
    const ctx = context();
    if (!ctx?.eventSource || !ctx?.eventTypes) return;
    eventsRegistered = true;
    const events = ctx.eventTypes;

    const prepare = events.GENERATION_AFTER_COMMANDS || events.GENERATION_STARTED;
    if (prepare) ctx.eventSource.on(prepare, prepareGeneration);
    for (const event of [events.CHAT_COMPLETION_PROMPT_READY, events.GENERATE_AFTER_COMBINE_PROMPTS]) if (event) ctx.eventSource.on(event, onPromptReady);
    // On swipe and render, run before other extensions' listeners so their decorations are
    // applied after any re-render instead of being wiped by it. MESSAGE_RECEIVED stays a plain
    // listener: SillyTavern's own reasoning auto-parse must move <think> out of the reply first,
    // and extensions decorate on CHARACTER_MESSAGE_RENDERED, which follows anyway.
    const first = (event, listener) => (typeof ctx.eventSource.makeFirst === 'function'
        ? ctx.eventSource.makeFirst(event, listener)
        : ctx.eventSource.on(event, listener));
    if (events.MESSAGE_RECEIVED) ctx.eventSource.on(events.MESSAGE_RECEIVED, onMessageReceived);
    if (events.GENERATION_ENDED) ctx.eventSource.on(events.GENERATION_ENDED, onGenerationEnded);
    if (events.GENERATION_STOPPED) ctx.eventSource.on(events.GENERATION_STOPPED, onGenerationStopped);

    if (events.MESSAGE_EDITED) ctx.eventSource.on(events.MESSAGE_EDITED, onMessageEdited);
    for (const event of [events.MESSAGE_SWIPED, events.CHARACTER_FIRST_MESSAGE_SELECTED]) {
        if (event) first(event, onMessageVariantChanged);
    }
    for (const event of [events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED]) {
        if (event) ctx.eventSource.on(event, onTimelineChanged);
    }
    for (const event of [events.CHAT_CHANGED, events.CHAT_LOADED]) if (event) ctx.eventSource.on(event, onChatChanged);
    if (events.CHARACTER_MESSAGE_RENDERED) first(events.CHARACTER_MESSAGE_RENDERED, onCharacterMessageRendered);
    if (events.MORE_MESSAGES_LOADED) ctx.eventSource.on(events.MORE_MESSAGES_LOADED, onTimelineChanged);
    for (const event of [events.APP_READY, events.APP_INITIALIZED, events.EXTENSIONS_FIRST_LOAD, events.EXTENSION_SETTINGS_LOADED]) {
        if (event) ctx.eventSource.on(event, () => {
            ensureExtensionUi();
            syncSettingsPanel();
            refreshAll(0);
        });
    }
}

export async function init() {
    if (initialized) return;
    if (!globalThis.SillyTavern?.getContext) {
        setTimeout(() => void init(), 100);
        return;
    }
    initialized = true;
    setInventoryExtensionPrompt(context(), '');
    ensureExtensionUi();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();
    refreshAll(0);
    console.info(`[Inventory Block] v${VERSION} loaded (message-native snapshot mode).`);
}

void init();
