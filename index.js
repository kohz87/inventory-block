import {
    emptyInventory,
    formatInventoryBlock,
    inventoryBlocks,
    inventoryForGeneration,
    latestAssistantIndex,
    latestInventorySnapshot,
    normalizeInventoryTransports,
    replaceOrAppendInventory,
    syncActiveSwipeText,
} from './src/snapshot.js';
import { injectInventorySnapshot } from './src/prompt.js';
import { copyText, openInventoryEditor, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount, setInventoryMountSuspended } from './src/megumin.js';

const VERSION = '0.5.2';
const SESSION_MAX_AGE_MS = 2 * 60 * 1000;

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

function isBackgroundGeneration(type, isDryRun = false) {
    if (isDryRun) return true;
    const lower = normalizeType(type);
    return ['quiet', 'impersonate', 'raw', 'background', 'dryrun', 'dry-run'].some(token => lower.includes(token));
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
    renderInventoryPane(pane, snapshot?.state ?? emptyInventory(), {
        hasSnapshot: Boolean(snapshot),
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

function clearSession(chatId) {
    if (!chatId) return;
    clearCleanupTimer(chatId);
    pending.delete(chatId);
    syncMountSuspension();
}

function scheduleSessionCleanup(chatId, delay = 3000) {
    clearCleanupTimer(chatId);
    cleanupTimers.set(chatId, setTimeout(() => clearSession(chatId), delay));
}

function prepareGeneration(type = 'normal', _params = null, isDryRun = false) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx) || isBackgroundGeneration(type, isDryRun)) return null;
    const chatId = chatIdOf(ctx);
    const session = {
        chatId,
        type: normalizeType(type),
        state: inventoryForGeneration(ctx.chat, type),
        startedAt: Date.now(),
    };
    pending.set(chatId, session);
    syncMountSuspension();
    return session;
}

function freshPendingSessions() {
    const now = Date.now();
    for (const [chatId, session] of pending) {
        if (now - session.startedAt > SESSION_MAX_AGE_MS) clearSession(chatId);
    }
    return [...pending.values()];
}

function selectPromptSession() {
    const sessions = freshPendingSessions();
    const activeId = chatIdOf(context());
    if (activeId && pending.has(activeId)) return pending.get(activeId);
    return sessions.length === 1 ? sessions[0] : null;
}

async function onGenerationInterceptor(_chat, _contextSize, _abort, type = 'normal') {
    if (isBackgroundGeneration(type)) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    const chatId = chatIdOf(ctx);
    if (!pending.has(chatId)) prepareGeneration(type);
}

globalThis.inventoryBlockGenerationInterceptor = onGenerationInterceptor;

function onPromptReady(eventData = null) {
    if (eventData?.dryRun === true) return;
    const session = selectPromptSession();
    if (!session) return;
    const result = injectInventorySnapshot(eventData, session.state);
    if (!result.injected && result.reason !== 'unsupported-event') {
        console.warn(`[Inventory Block] v0.5 prompt injection skipped: ${result.reason}`);
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
    return { valid: false, malformed: false, truncated: /<Inventory\b/i.test(text) };
}

async function persistMessageEdit(ctx, messageId, message, { rerender = true } = {}) {
    syncActiveSwipeText(message);
    if (rerender && document.querySelector(`#chat .mes[mesid="${Number(messageId)}"]`)) {
        ctx.updateMessageBlock?.(messageId, message);
    }
    if (typeof ctx.saveChat === 'function') await ctx.saveChat();
    else ctx.saveMetadataDebounced?.();
}

async function normalizeMessageTransport(messageId, { rerender = true } = {}) {
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
        await persistMessageEdit(ctx, id, message, { rerender });
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
    await persistMessageEdit(ctx, target, message);
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
                <div class="inventory-block-settings-note">The latest valid surviving &lt;Inventory&gt; snapshot in the selected chat/swipe is the source of truth. There is no separate backend revision database.</div>
            </div>
        </div>`;
    wrapper.querySelector('#inventory_block_settings_edit')?.addEventListener('click', openEditor);
    wrapper.querySelector('#inventory_block_settings_copy')?.addEventListener('click', copyCurrentBlock);
    wrapper.querySelector('#inventory_block_settings_refresh')?.addEventListener('click', () => refreshAll(0));
    host.appendChild(wrapper);
    return true;
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
    if (events.MESSAGE_RECEIVED) ctx.eventSource.on(events.MESSAGE_RECEIVED, onMessageReceived);
    if (events.GENERATION_ENDED) ctx.eventSource.on(events.GENERATION_ENDED, onGenerationEnded);
    if (events.GENERATION_STOPPED) ctx.eventSource.on(events.GENERATION_STOPPED, onGenerationStopped);

    for (const event of [events.MESSAGE_EDITED, events.MESSAGE_SWIPED, events.CHARACTER_FIRST_MESSAGE_SELECTED]) {
        if (event) ctx.eventSource.on(event, onMessageVariantChanged);
    }
    for (const event of [events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED]) {
        if (event) ctx.eventSource.on(event, onTimelineChanged);
    }
    for (const event of [events.CHAT_CHANGED, events.CHAT_LOADED]) if (event) ctx.eventSource.on(event, onChatChanged);
    if (events.CHARACTER_MESSAGE_RENDERED) ctx.eventSource.on(events.CHARACTER_MESSAGE_RENDERED, onCharacterMessageRendered);
    if (events.MORE_MESSAGES_LOADED) ctx.eventSource.on(events.MORE_MESSAGES_LOADED, onTimelineChanged);
    for (const event of [events.APP_READY, events.APP_INITIALIZED, events.EXTENSIONS_FIRST_LOAD, events.EXTENSION_SETTINGS_LOADED]) {
        if (event) ctx.eventSource.on(event, () => {
            ensureExtensionUi();
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
    ensureExtensionUi();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();
    refreshAll(0);
    console.info(`[Inventory Block] v${VERSION} loaded (message-native snapshot mode).`);
}

void init();
