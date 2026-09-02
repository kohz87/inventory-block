import { EXTRA_KEY, LIMITS, SOURCE, VERSION } from './src/constants.js';
import {
    attachMessageRevision,
    commitManualState,
    createRevision,
    ensureRoot,
    getCurrentInventory,
    getInventoryAt,
    getRevision,
    inventoryEquals,
    invalidateLineageCache,
    lineageHashThrough,
    listRevisions,
    rememberBranchHead,
    resolveActiveRevision,
    restoreRevisionAsNew,
} from './src/state.js';
import {
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    hasCompleteInventoryUpdate,
    hasInventoryControl,
    mergeInventoryStates,
    stripReservedInventorySeed,
} from './src/protocol.js';
import {
    buildInventoryReferencePrompt,
    buildReconciliationPrompt,
    deriveAssistantEventText,
    parseReconciliationReply,
} from './src/reconcile.js';
import {
    createReplaceCapability,
    generationGuardLength,
    generationTypeMatches,
    isBackgroundGeneration,
    isBroadInventoryAdministration,
    isReplacementGeneration,
    isTrackedGeneration,
    normalizeGenerationType,
    targetMessageForGeneration,
    userInstructionForGeneration,
} from './src/lifecycle.js';
import {
    createPromptProbe,
    injectDryRunPrompt,
    injectGenerationPrompt,
    promptEventMatchesProbe,
} from './src/injection.js';
import { openInventoryEditor, openInventoryHistory, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount } from './src/megumin.js';
import { mountExtensionUi } from './src/settings.js';
import { GenerationSessionStore } from './src/session.js';

const PENDING_MAX_AGE_MS = 10 * 60 * 1000;
const WATCHDOG_INTERVAL_MS = 15000;
const STOP_GRACE_MS = 1800;
const END_GRACE_MS = 15000;
const COMPLETION_FALLBACK_MS = 1200;
const PROMPT_READY_MAX_AGE_MS = 60 * 1000;

let processingMessages = new Set();
let initialized = false;
let eventsRegistered = false;
let menuRetry = null;
let watchdog = null;
const terminalCleanupTimers = new Map();
const sessions = new GenerationSessionStore({ maxAgeMs: PENDING_MAX_AGE_MS, limit: LIMITS.promptSessions });
const dryRunSessions = [];

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

function removeSession(session) {
    if (session?.completionFallbackTimer) clearTimeout(session.completionFallbackTimer);
    if (session) session.completionFallbackTimer = null;
    const terminalTimer = terminalCleanupTimers.get(session);
    if (terminalTimer) clearTimeout(terminalTimer);
    terminalCleanupTimers.delete(session);
    sessions.remove(session);
    if (!sessions.size && watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
    }
}

function generationLockFor(ctx) {
    return sessions.activeForChat(chatIdOf(ctx));
}

function generationForMessage(ctx, messageId, eventType = '') {
    return sessions.forMessage(chatIdOf(ctx), messageId, eventType);
}

function generationComposerText() {
    return document.querySelector('#send_textarea')?.value ?? '';
}

function isTrustedUntrackedControl(type) {
    return ['edited', 'existing_swipe'].includes(normalizeGenerationType(type));
}

function prefixLineageHash(ctx, length) {
    if (!Number.isInteger(length) || length <= 0) return 'root';
    if (!Array.isArray(ctx?.chat) || ctx.chat.length < length) return null;
    return lineageHashThrough(ctx, length - 1);
}

function generationTimelineChanged(ctx, session) {
    const current = prefixLineageHash(ctx, session.guardLength);
    return current === null || current !== session.guardLineageHash;
}

function scheduleAlternateSwipeMetadataCleanup(expectedChatId, messageId, activeSwipeId, activeUid) {
    if (!activeUid) return;
    setTimeout(() => {
        const live = context();
        if (!live || chatIdOf(live) !== expectedChatId) return;
        const message = live.chat?.[Number(messageId)];
        if (!message || !Array.isArray(message.swipe_info)) return;
        let changed = false;
        for (let i = 0; i < message.swipe_info.length; i++) {
            if (i === activeSwipeId) continue;
            const extra = message.swipe_info[i]?.extra;
            const meta = extra?.[EXTRA_KEY];
            if (meta?.uid && meta.uid === activeUid) {
                delete extra[EXTRA_KEY];
                changed = true;
            }
        }
        if (changed) live.saveMetadataDebounced?.();
    }, 0);
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

function refreshAll() {
    scheduleInventoryMount(30);
}

function persistChatSoon(ctx, expectedChatId = chatIdOf(ctx)) {
    setTimeout(() => {
        const live = context();
        if (!live || chatIdOf(live) !== expectedChatId) return;
        try {
            const result = live.saveChat?.();
            if (result?.catch) result.catch(error => console.warn('[Inventory Block] Deferred chat save failed.', error));
        } catch (error) {
            console.warn('[Inventory Block] Deferred chat save failed.', error);
        }
        live.saveMetadataDebounced?.();
    }, 0);
}

function refreshRenderedMessageIfPresent(ctx, messageId, message) {
    const selector = `#chat .mes[mesid="${Number(messageId)}"]`;
    if (document.querySelector(selector)) ctx.updateMessageBlock?.(messageId, message);
}

async function saveMetadata(ctx, expectedChatId = chatIdOf(ctx)) {
    if (chatIdOf(context()) !== expectedChatId) throw new Error('The active chat changed before Inventory Block could save.');
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

async function commitManual(state, options = {}, expectedChatId = null, expectedRevision = null, expectedMutationSerial = null) {
    const ctx = context();
    const actualChatId = chatIdOf(ctx);
    if (!ctx || !hasActiveChat(ctx)) throw new Error('Open a chat before editing inventory.');
    if (expectedChatId !== null && actualChatId !== expectedChatId) throw new Error('The active chat changed while the inventory editor was open. Nothing was saved.');
    if (generationLockFor(ctx)) throw new Error('Wait for the current generation response to finish committing before changing inventory manually.');
    ensureRoot(ctx);
    commitManualState(ctx, state, { ...options, expectedRevision, expectedMutationSerial });
    await saveMetadata(ctx, actualChatId);
    refreshAll();
}

async function openEditor() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before editing inventory.');
    const expectedChatId = chatIdOf(ctx);
    const root = ensureRoot(ctx);
    const expectedRevision = resolveActiveRevision(ctx);
    const expectedMutationSerial = root.mutationSerial;
    await openInventoryEditor(ctx, getInventoryAt(root, expectedRevision), {
        onSave: async state => {
            await commitManual(state, { source: SOURCE.MANUAL, note: 'Manual inventory edit' }, expectedChatId, expectedRevision, expectedMutationSerial);
            notify('success', 'Inventory saved.');
        },
    });
}

async function openHistory() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before viewing inventory history.');
    const expectedChatId = chatIdOf(ctx);
    const root = ensureRoot(ctx);
    await openInventoryHistory(ctx, listRevisions(ctx), root.activeRevision, {
        onRestore: async revisionId => {
            const live = context();
            if (!live || chatIdOf(live) !== expectedChatId) throw new Error('The active chat changed while history was open. Nothing was restored.');
            if (generationLockFor(live)) throw new Error('Wait for the current generation response to finish committing before restoring inventory history.');
            restoreRevisionAsNew(live, revisionId);
            await saveMetadata(live, expectedChatId);
            refreshAll();
        },
    });
}

function ensureExtensionUiEntries() {
    const { menuReady, settingsReady } = mountExtensionUi(document, {
        version: VERSION,
        onEdit: openEditor,
        onHistory: openHistory,
        onCopy: copyInventoryBlock,
    });
    if (menuReady && settingsReady) {
        if (menuRetry) clearTimeout(menuRetry);
        menuRetry = null;
        return;
    }
    if (!menuRetry) menuRetry = setTimeout(() => {
        menuRetry = null;
        ensureExtensionUiEntries();
    }, 250);
}

function firstAssistantMessageId(ctx) {
    return (Array.isArray(ctx?.chat) ? ctx.chat : []).findIndex(message => message && !message.is_user && !message.is_system);
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

function generationBase(ctx, session = null) {
    const root = ensureRoot(ctx);
    if (session && getRevision(root, session.baseRevision)) return session.baseRevision;
    return resolveActiveRevision(ctx);
}

function currentMessageNeedsNewUid(message, type) {
    if (!activeMessageMeta(message)?.uid) return true;
    return ['swipe', 'regenerate', 'normal', 'group', 'first_message', 'seed', 'seed_existing', 'existing_swipe'].includes(normalizeGenerationType(type));
}

function acceptExistingMessageBase(message, type, fallbackBase, session = null) {
    const existing = activeMessageMeta(message);
    const lower = normalizeGenerationType(type);
    if (existing && ['continue', 'append', 'appendfinal', 'updated', 'message_updated', 'edited'].includes(lower)) return existing.baseRevision;
    if (existing && session?.type === 'continue') return existing.baseRevision;
    return fallbackBase;
}

function initialGreetingSeedEligible(ctx, id, type) {
    const lower = normalizeGenerationType(type);
    if (!['first_message', 'seed_existing'].includes(lower)) return false;
    if (lower === 'first_message' && ctx.chat.length > id + 1) return false;
    for (let i = 0; i <= id; i++) {
        const message = ctx.chat[i];
        if (!message || message.is_user || message.is_system) return false;
    }
    return true;
}

function reportWarnings(warnings) {
    if (!warnings.length) return;
    notify('warning', `Inventory update rejected: ${warnings.join(' ')}`);
    console.warn('[Inventory Block] Inventory control/seed rejected.', warnings);
}

function attachReconciledRevision(ctx, session, message, messageId, revisionId, baseRevision) {
    const messageBaseRevision = acceptExistingMessageBase(message, session.type, baseRevision, session);
    const revisionRecord = getRevision(ensureRoot(ctx), revisionId);
    const shouldPortable = revisionId !== messageBaseRevision || revisionRecord?.portable !== true;
    const attachedMeta = attachMessageRevision(ctx, messageId, {
        baseRevision: Number.isInteger(messageBaseRevision) ? messageBaseRevision : revisionId,
        revision: revisionId,
        newUid: currentMessageNeedsNewUid(message, session.type),
        portable: shouldPortable,
    });
    const activeSwipeId = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
    scheduleAlternateSwipeMetadataCleanup(session.chatId, messageId, activeSwipeId, attachedMeta?.uid);
}

async function reconcileCompletedSession(session) {
    if (!session || session.finished || session.stopped) return;
    const ctx = context();
    if (!ctx || chatIdOf(ctx) !== session.chatId) {
        console.warn('[Inventory Block] Post-response reconciliation was skipped because the active chat changed.');
        removeSession(session);
        return;
    }
    const id = Number(session.messageId);
    const message = ctx.chat?.[id];
    if (!Number.isInteger(id) || !message || message.is_user || message.is_system) {
        removeSession(session);
        return;
    }

    try {
        invalidateLineageCache(ctx);
        const root = ensureRoot(ctx);
        let baseRevision = session.baseRevision;
        if (!getRevision(root, baseRevision)) baseRevision = resolveActiveRevision(ctx);
        const baseState = getInventoryAt(root, baseRevision);
        const event = deriveAssistantEventText(session.type, session.targetInitialText, message.mes);
        if (event.error) {
            reportWarnings([event.error]);
            attachReconciledRevision(ctx, session, message, id, baseRevision, baseRevision);
            root.activeRevision = baseRevision;
            rememberBranchHead(ctx, baseRevision);
            persistChatSoon(ctx, session.chatId);
            refreshAll();
            return;
        }

        const mutationConflictBefore = root.mutationSerial !== session.mutationSerial;
        const timelineConflictBefore = generationTimelineChanged(ctx, session);
        if (mutationConflictBefore || timelineConflictBefore) {
            const warnings = [];
            if (mutationConflictBefore) warnings.push('Inventory changed before post-response reconciliation could start; this message was not allowed to overwrite the newer inventory.');
            if (timelineConflictBefore) warnings.push('The chat timeline changed before post-response reconciliation could start; this message was not allowed to write inventory.');
            reportWarnings(warnings);
            return;
        }

        const generateQuietPrompt = ctx.generateQuietPrompt;
        if (typeof generateQuietPrompt !== 'function') {
            reportWarnings(['SillyTavern generateQuietPrompt is unavailable; post-response inventory reconciliation was skipped.']);
            return;
        }

        const quietPrompt = buildReconciliationPrompt(baseState, {
            userText: session.userInstruction,
            assistantText: event.text,
            type: session.type,
            replaceCapability: session.replaceCapability,
        });
        const reply = await generateQuietPrompt({ quietPrompt, skipWIAN: true, trimToSentence: false });

        const live = context();
        if (!live || chatIdOf(live) !== session.chatId) {
            console.warn('[Inventory Block] Post-response reconciliation finished after the user changed chats; its result was discarded.');
            return;
        }
        invalidateLineageCache(live);
        const liveRoot = ensureRoot(live);
        const mutationConflict = liveRoot.mutationSerial !== session.mutationSerial;
        const timelineConflict = generationTimelineChanged(live, session);
        if (mutationConflict || timelineConflict) {
            const warnings = [];
            if (mutationConflict) warnings.push('Inventory changed while the hidden reconciliation scan was running; its result was discarded.');
            if (timelineConflict) warnings.push('The chat timeline changed while the hidden reconciliation scan was running; its result was discarded.');
            reportWarnings(warnings);
            return;
        }

        const result = parseReconciliationReply(reply, baseState, { replaceCapability: session.replaceCapability });
        const warnings = [...result.errors];
        let acceptedRevision = baseRevision;
        if (!warnings.length && !inventoryEquals(baseState, result.state)) {
            acceptedRevision = createRevision(live, result.state, {
                parent: baseRevision,
                source: SOURCE.LLM,
                note: result.note || 'Post-response inventory reconciliation',
            });
        } else {
            liveRoot.activeRevision = baseRevision;
        }

        attachReconciledRevision(live, session, message, id, acceptedRevision, baseRevision);
        liveRoot.activeRevision = acceptedRevision;
        rememberBranchHead(live, acceptedRevision);
        persistChatSoon(live, session.chatId);
        reportWarnings(warnings);
        refreshAll();
    } catch (error) {
        console.error('[Inventory Block] Post-response inventory reconciliation failed.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    } finally {
        session.finished = true;
        removeSession(session);
    }
}

function maybeStartReconciliation(session, { messageReceivedIsFinal = false } = {}) {
    if (!session || session.finished || session.stopped || session.reconciliationStarted || !session.messageReceived) return;
    if (!session.generationEnded && !messageReceivedIsFinal) return;
    session.reconciliationStarted = true;
    if (session.completionFallbackTimer) clearTimeout(session.completionFallbackTimer);
    session.completionFallbackTimer = null;
    const terminalTimer = terminalCleanupTimers.get(session);
    if (terminalTimer) clearTimeout(terminalTimer);
    terminalCleanupTimers.delete(session);
    void reconcileCompletedSession(session);
}

async function onMessageReceived(messageId, type = 'normal') {
    const ctx = context();
    const id = Number(messageId);
    if (!ctx || !hasActiveChat(ctx) || !Number.isInteger(id)) return;
    invalidateLineageCache(ctx);
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return;

    const hasSeed = /<Inventory\b/i.test(String(message.mes ?? ''));
    if (hasSeed && isFirstAssistantMessage(ctx, id)) {
        await processAssistantMessage(id, type);
        return;
    }

    const session = generationForMessage(ctx, id, type);
    if (!session) {
        if (hasInventoryControl(message.mes) || hasSeed) await processAssistantMessage(id, type);
        else setTimeout(() => void resolveBranchAndRefresh(), 0);
        return;
    }

    session.messageReceived = true;
    session.messageReceivedAt = Date.now();
    session.messageId = id;
    session.finalMessageText = String(message.mes ?? '');
    if (!session.completionFallbackTimer) {
        session.completionFallbackTimer = setTimeout(() => {
            session.completionFallbackTimer = null;
            maybeStartReconciliation(session, { messageReceivedIsFinal: true });
        }, COMPLETION_FALLBACK_MS);
    }
    maybeStartReconciliation(session);
}

async function processAssistantMessage(messageId, type = '') {
    const id = Number(messageId);
    const ctx = context();
    const chatId = chatIdOf(ctx);
    const processingKey = `${chatId}:${id}`;
    if (!Number.isInteger(id) || processingMessages.has(processingKey)) return;
    if (!ctx || !hasActiveChat(ctx)) return;
    invalidateLineageCache(ctx);
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return;

    processingMessages.add(processingKey);
    let session = null;
    try {
        const root = ensureRoot(ctx);
        const existingMeta = activeMessageMeta(message);
        const firstMessage = isFirstAssistantMessage(ctx, id);
        const hasSeed = /<Inventory\b/i.test(String(message.mes ?? ''));
        session = generationForMessage(ctx, id, type);
        const pendingApplies = Boolean(session);
        const currentLineageHash = lineageHashThrough(ctx, id);
        const greetingSeed = hasSeed && initialGreetingSeedEligible(ctx, id, type);
        const firstSeed = firstMessage && hasSeed && (
            (pendingApplies && isReplacementGeneration(session.type) && session.baseRevision === 0) ||
            (ctx.chat.length <= id + 1 && (!existingMeta || existingMeta.lineageHash !== currentLineageHash))
        );
        const seedAllowed = greetingSeed || firstSeed;
        const latestAssistant = latestAssistantMessageId(ctx) === id;

        if (!latestAssistant && !seedAllowed) {
            let cleaned = String(message.mes ?? '');
            const reserved = stripReservedInventorySeed(cleaned);
            cleaned = reserved.cleanedText;
            const stripped = consumeInventoryUpdates(cleaned, getCurrentInventory(ctx));
            cleaned = stripped.cleanedText;
            if (reserved.found || stripped.hadControl) notify('warning', 'Historical inventory machine text was stripped without changing inventory state.');
            if (cleaned !== message.mes) {
                message.mes = cleaned;
                refreshRenderedMessageIfPresent(ctx, id, message);
                persistChatSoon(ctx, chatId);
            }
            setTimeout(() => void resolveBranchAndRefresh(), 0);
            return;
        }

        let baseRevision = seedAllowed && firstMessage ? 0 : generationBase(ctx, pendingApplies ? session : null);
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
                try {
                    workingState = firstMessage && baseRevision === 0 ? seed.state : mergeInventoryStates(baseState, seed.state);
                    seeded = true;
                } catch (error) {
                    warnings.push(error instanceof Error ? error.message : String(error));
                }
            }
        } else {
            const reserved = stripReservedInventorySeed(workingText);
            workingText = reserved.cleanedText;
            if (reserved.found) warnings.push('A later <Inventory> block was stripped. Starting inventory tags are greeting-only.');
        }

        const result = consumeInventoryUpdates(workingText, workingState, {
            replaceCapability: pendingApplies && session.promptInjected ? session.replaceCapability : null,
        });
        warnings.push(...result.errors);

        const controlTrusted = (pendingApplies && session.promptInjected) || seedAllowed || isTrustedUntrackedControl(type);
        if (result.hadControl && !controlTrusted) {
            warnings.push(pendingApplies
                ? 'Inventory control was emitted by a generation that did not receive Inventory state; it was stripped without changing backend state.'
                : 'Inventory control was emitted outside a tracked assistant generation and was stripped without changing backend state.');
            result.state = workingState;
            result.changed = false;
        }

        const mutationConflict = Boolean(pendingApplies && root.mutationSerial !== session.mutationSerial);
        const timelineConflict = Boolean(pendingApplies && generationTimelineChanged(ctx, session));
        if (mutationConflict) warnings.push('Inventory changed while generation was running; the generated inventory write was discarded.');
        if (timelineConflict) warnings.push('The chat timeline changed while generation was running; the generated inventory write was discarded.');
        const concurrentConflict = mutationConflict || timelineConflict;

        let acceptedState = result.state;
        let acceptedRevision = baseRevision;
        const source = seeded ? SOURCE.SEED : SOURCE.LLM;
        let note = seeded ? (greetingSeed && !firstMessage ? 'Merged group greeting inventory seed' : 'First-message inventory seed') : result.note;

        if (concurrentConflict) {
            acceptedRevision = resolveActiveRevision(ctx);
            acceptedState = getInventoryAt(root, acceptedRevision);
        } else {
            const changedFromBase = warnings.length === 0 && !inventoryEquals(baseState, acceptedState);
            if (changedFromBase) {
                if (seeded && result.changed) note += ' + LLM update';
                acceptedRevision = createRevision(ctx, acceptedState, { parent: baseRevision, source, note });
            } else {
                acceptedRevision = baseRevision;
                root.activeRevision = acceptedRevision;
            }
        }

        message.mes = result.cleanedText;
        const effectiveBase = concurrentConflict ? acceptedRevision : baseRevision;
        const messageBaseRevision = concurrentConflict
            ? acceptedRevision
            : acceptExistingMessageBase(message, type, effectiveBase, pendingApplies ? session : null);
        const revisionRecord = getRevision(root, acceptedRevision);
        const shouldPortable = acceptedRevision !== messageBaseRevision || revisionRecord?.portable !== true;
        const attachedMeta = attachMessageRevision(ctx, id, {
            baseRevision: Number.isInteger(messageBaseRevision) ? messageBaseRevision : acceptedRevision,
            revision: acceptedRevision,
            newUid: currentMessageNeedsNewUid(message, type),
            portable: shouldPortable,
        });
        const activeSwipeId = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
        scheduleAlternateSwipeMetadataCleanup(chatId, id, activeSwipeId, attachedMeta?.uid);
        root.activeRevision = acceptedRevision;
        rememberBranchHead(ctx, acceptedRevision);

        refreshRenderedMessageIfPresent(ctx, id, message);
        persistChatSoon(ctx, chatId);
        reportWarnings(warnings);
        if (seeded && !warnings.length) notify('success', greetingSeed && !firstMessage ? 'Greeting inventory merged.' : 'Starting inventory loaded.');
        if (pendingApplies) {
            session.finished = true;
            removeSession(session);
        }
        refreshAll();
    } catch (error) {
        console.error('[Inventory Block] Failed to process assistant inventory state.', error);
        notify('error', error instanceof Error ? error.message : String(error));
        if (session) removeSession(session);
    } finally {
        processingMessages.delete(processingKey);
    }
}

async function seedInitialGreetingsIfNeeded(ctx) {
    const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
    let seededAny = false;
    for (let id = 0; id < chat.length; id++) {
        const message = chat[id];
        if (!message || message.is_user || message.is_system) break;
        if (!/<Inventory\b/i.test(String(message.mes ?? ''))) continue;
        const meta = activeMessageMeta(message);
        if (meta && meta.lineageHash === lineageHashThrough(ctx, id)) continue;
        await processAssistantMessage(id, 'seed_existing');
        seededAny = true;
    }
    return seededAny;
}

async function resolveBranchAndRefresh() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) {
        scheduleInventoryMount(20);
        return;
    }
    try {
        ensureRoot(ctx);
        await seedInitialGreetingsIfNeeded(ctx);
        resolveActiveRevision(ctx);
        rememberBranchHead(ctx);
        ctx.saveMetadataDebounced?.();
        refreshAll();
    } catch (error) {
        console.warn('[Inventory Block] Could not restore branch inventory.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    }
}

function armWatchdog() {
    if (watchdog) return;
    const tick = () => {
        watchdog = null;
        const liveSessions = new Set(sessions.prune());
        for (const [session, timer] of terminalCleanupTimers) {
            if (liveSessions.has(session)) continue;
            clearTimeout(timer);
            terminalCleanupTimers.delete(session);
        }
        if (sessions.size) watchdog = setTimeout(tick, WATCHDOG_INTERVAL_MS);
    };
    watchdog = setTimeout(tick, WATCHDOG_INTERVAL_MS);
}

function rememberDryRun(chatId, prompt, ctx) {
    dryRunSessions.push({
        chatId,
        prompt,
        tokenCounter: ctx?.getTokenCountAsync,
        probe: createPromptProbe(ctx?.chat),
        startedAt: Date.now(),
    });
    while (dryRunSessions.length > LIMITS.dryRunChats) dryRunSessions.shift();
}

function onGenerationPrepared(type = 'normal', _params = null, isDryRun = false) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx) || isBackgroundGeneration(type)) return;
    const chatId = chatIdOf(ctx);

    if (isDryRun) {
        try { rememberDryRun(chatId, buildInventoryReferencePrompt(getCurrentInventory(ctx)), ctx); }
        catch (error) { console.warn('[Inventory Block] Could not prepare dry-run inventory context.', error); }
        return;
    }
    if (!isTrackedGeneration(type, false)) return;

    try {
        const root = ensureRoot(ctx);
        const previousActiveRevision = resolveActiveRevision(ctx);
        const latestAssistant = latestAssistantMessageId(ctx);
        const lower = normalizeGenerationType(type);
        const targetMessageId = targetMessageForGeneration(lower, latestAssistant);
        const targetMeta = Number.isInteger(targetMessageId) ? activeMessageMeta(ctx.chat?.[targetMessageId]) : null;
        let baseRevision = previousActiveRevision;
        if (isReplacementGeneration(lower) && Number.isInteger(targetMeta?.baseRevision) && getRevision(root, targetMeta.baseRevision)) baseRevision = targetMeta.baseRevision;

        const userInstruction = userInstructionForGeneration(lower, ctx.chat, generationComposerText());
        const broadAdmin = isBroadInventoryAdministration(userInstruction);
        const replaceCapability = broadAdmin ? createReplaceCapability() : null;
        const startChatLength = Array.isArray(ctx.chat) ? ctx.chat.length : 0;
        const guardLength = generationGuardLength(lower, startChatLength, targetMessageId);
        const prompt = buildInventoryReferencePrompt(getInventoryAt(root, baseRevision));
        const targetInitialText = Number.isInteger(targetMessageId) ? String(ctx.chat?.[targetMessageId]?.mes ?? '') : '';

        sessions.add({
            chatId,
            type: lower,
            baseRevision,
            previousActiveRevision,
            mutationSerial: root.mutationSerial,
            targetMessageId,
            startChatLength,
            guardLength,
            guardLineageHash: prefixLineageHash(ctx, guardLength),
            preProbe: createPromptProbe(ctx.chat),
            replaceCapability,
            userInstruction,
            targetInitialText,
            prompt,
            tokenCounter: ctx.getTokenCountAsync,
            interceptorSeen: false,
            promptInjected: false,
            promptInjectionFailed: false,
            generationEnded: false,
            messageReceived: false,
            reconciliationStarted: false,
            stopped: false,
            startedAt: Date.now(),
        });
        armWatchdog();
    } catch (error) {
        console.warn('[Inventory Block] Could not prepare generation inventory state.', error);
    }
}

function chooseSessionForInterceptor(chat, type) {
    return sessions.chooseForInterceptor(chat, type);
}

async function onGenerationInterceptor(chat, contextSize, _abort, type = 'normal') {
    if (isBackgroundGeneration(type) || !Array.isArray(chat)) return;
    const session = chooseSessionForInterceptor(chat, type);
    if (!session) return;

    try {
        session.interceptorSeen = true;
        session.interceptorAt = Date.now();
        session.contextSize = Number.isFinite(Number(contextSize)) ? Number(contextSize) : null;

        // Rebind the causal guard after SillyTavern has appended the new user message.
        const live = context();
        if (live && chatIdOf(live) === session.chatId) {
            const liveLength = Array.isArray(live.chat) ? live.chat.length : 0;
            session.guardLength = generationGuardLength(session.type, liveLength, session.targetMessageId);
            session.guardLineageHash = prefixLineageHash(live, session.guardLength);
        }

        // Do not mutate the working chat. Inventory is bound here but injected only at
        // the final prompt-ready event, after World Info/depth/macro processing.
        session.promptProbe = createPromptProbe(chat);
    } catch (error) {
        session.promptInjectionFailed = true;
        console.warn('[Inventory Block] Could not reserve foreground inventory prompt budget.', error);
    }
}

globalThis.inventoryBlockGenerationInterceptor = onGenerationInterceptor;

async function onPromptReady(eventData = null) {
    const ctx = context();
    if (eventData?.dryRun === true) {
        const matches = dryRunSessions
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => !entry.probe?.length || promptEventMatchesProbe(eventData, entry.probe));
        const selected = matches.length === 1 ? matches[0] : null;
        if (!selected) return;
        dryRunSessions.splice(selected.index, 1);
        await injectDryRunPrompt(eventData, selected.entry.prompt, { getTokenCountAsync: selected.entry.tokenCounter });
        return;
    }

    const session = sessions.chooseForPromptEvent(eventData, { maxReadyAgeMs: PROMPT_READY_MAX_AGE_MS });
    if (!session) return;

    const result = await injectGenerationPrompt(eventData, session.prompt, {
        contextSize: session.contextSize,
        getTokenCountAsync: session.tokenCounter,
        probe: session.promptProbe,
        requireProbe: Boolean(session.promptProbe?.length),
    });
    if (result.injected) {
        session.promptInjected = true;
        session.promptInjectedAt = Date.now();
        return;
    }
    if (result.reason !== 'probe-mismatch') {
        session.promptInjectionFailed = true;
        console.warn(`[Inventory Block] Foreground inventory prompt was not injected: ${result.reason}.`);
        console.warn('[Inventory Block] Read-only inventory reference was unavailable to the visible response; hidden post-response reconciliation can still run.');
    }
}

function scheduleTerminalCleanup(graceMs, chatLength = null) {
    const ctx = context();
    const chatId = chatIdOf(ctx);
    if (!chatId) return;
    const session = sessions.chooseForTerminal(chatId, chatLength);
    if (!session) return;
    const previous = terminalCleanupTimers.get(session);
    if (previous) clearTimeout(previous);
    const timer = setTimeout(() => {
        terminalCleanupTimers.delete(session);
        if (sessions.snapshot().includes(session)) removeSession(session);
        refreshAll();
    }, graceMs);
    terminalCleanupTimers.set(session, timer);
}

function onGenerationStopped(chatLength = null) {
    const ctx = context();
    const session = sessions.chooseForTerminal(chatIdOf(ctx), chatLength);
    if (!session || session.reconciliationStarted) return;
    session.stopped = true;
    if (session.completionFallbackTimer) clearTimeout(session.completionFallbackTimer);
    session.completionFallbackTimer = null;
    scheduleTerminalCleanup(STOP_GRACE_MS, chatLength);
}

function onGenerationEnded(chatLength = null) {
    const ctx = context();
    const session = sessions.chooseForTerminal(chatIdOf(ctx), chatLength);
    if (!session || session.reconciliationStarted) return;
    session.generationEnded = true;
    session.generationEndedAt = Date.now();
    maybeStartReconciliation(session);
    if (!session.reconciliationStarted) scheduleTerminalCleanup(END_GRACE_MS, chatLength);
}

function onMessageUpdated(messageId, type = 'updated', manualEdit = false) {
    const ctx = context();
    if (ctx) invalidateLineageCache(ctx);
    const message = ctx?.chat?.[Number(messageId)];
    if (!message) return;
    if (message.is_user || message.is_system) {
        setTimeout(() => void resolveBranchAndRefresh(), 0);
        return;
    }
    const active = generationForMessage(ctx, messageId, type);
    if (!manualEdit && active) return;
    if (hasCompleteInventoryUpdate(message.mes) || (manualEdit && hasInventoryControl(message.mes))) void processAssistantMessage(messageId, type);
    else setTimeout(() => void resolveBranchAndRefresh(), 0);
}

function onMessageSwiped(messageId) {
    setTimeout(async () => {
        const ctx = context();
        const id = Number(messageId);
        if (!ctx || !hasActiveChat(ctx) || !Number.isInteger(id)) return;
        try {
            invalidateLineageCache(ctx);
            const revision = resolveActiveRevision(ctx);
            const message = ctx.chat?.[id];
            if (message && !message.is_user && !message.is_system && hasInventoryControl(message.mes)) {
                await processAssistantMessage(id, 'existing_swipe');
                return;
            }
            if (message && !message.is_user && !message.is_system) {
                const meta = activeMessageMeta(message);
                if (!meta || meta.lineageHash !== lineageHashThrough(ctx, id)) attachMessageRevision(ctx, id, { baseRevision: revision, revision, newUid: true, portable: false });
            }
            rememberBranchHead(ctx);
            ctx.saveMetadataDebounced?.();
            refreshAll();
        } catch (error) {
            console.warn('[Inventory Block] Could not restore swiped inventory branch.', error);
        }
    }, 20);
}

function onChatChanged() {
    // Generation sessions deliberately survive UI chat switches; each carries its own
    // chat id, state snapshot, token counter, and prompt. This prevents cross-chat bleed.
    processingMessages.clear();
    setTimeout(() => void resolveBranchAndRefresh(), 0);
}

function registerEvents() {
    if (eventsRegistered) return;
    const ctx = context();
    if (!ctx?.eventSource || !ctx?.eventTypes) return;
    eventsRegistered = true;
    const events = ctx.eventTypes;

    const generationPrepareEvent = events.GENERATION_AFTER_COMMANDS || events.GENERATION_STARTED;
    if (generationPrepareEvent) ctx.eventSource.on(generationPrepareEvent, onGenerationPrepared);
    if (events.GENERATION_STOPPED) ctx.eventSource.on(events.GENERATION_STOPPED, onGenerationStopped);
    if (events.GENERATION_ENDED) ctx.eventSource.on(events.GENERATION_ENDED, onGenerationEnded);
    for (const event of [events.CHAT_COMPLETION_PROMPT_READY, events.GENERATE_AFTER_COMBINE_PROMPTS]) if (event) ctx.eventSource.on(event, onPromptReady);
    if (events.MESSAGE_RECEIVED) ctx.eventSource.on(events.MESSAGE_RECEIVED, onMessageReceived);
    if (events.MESSAGE_UPDATED) ctx.eventSource.on(events.MESSAGE_UPDATED, id => onMessageUpdated(id, 'updated', false));
    if (events.MESSAGE_EDITED) ctx.eventSource.on(events.MESSAGE_EDITED, id => onMessageUpdated(id, 'edited', true));
    if (events.MESSAGE_SWIPED) ctx.eventSource.on(events.MESSAGE_SWIPED, onMessageSwiped);
    for (const event of [events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED, events.CHARACTER_FIRST_MESSAGE_SELECTED]) {
        if (event) ctx.eventSource.on(event, () => {
            const live = context();
            if (live) invalidateLineageCache(live);
            setTimeout(() => void resolveBranchAndRefresh(), 20);
        });
    }
    for (const event of [events.CHAT_CHANGED, events.CHAT_LOADED]) if (event) ctx.eventSource.on(event, onChatChanged);
    for (const event of [events.APP_READY, events.APP_INITIALIZED, events.EXTENSIONS_FIRST_LOAD, events.EXTENSION_SETTINGS_LOADED]) {
        if (event) ctx.eventSource.on(event, () => {
            ensureExtensionUiEntries();
            initializeMeguminBridge(renderCurrentPane);
            setTimeout(() => void resolveBranchAndRefresh(), 0);
        });
    }
    for (const event of [events.CHARACTER_MESSAGE_RENDERED, events.MORE_MESSAGES_LOADED]) if (event) ctx.eventSource.on(event, () => scheduleInventoryMount(50));
}

export async function init() {
    if (initialized) return;
    if (!globalThis.SillyTavern?.getContext) {
        setTimeout(() => void init(), 100);
        return;
    }
    initialized = true;
    ensureExtensionUiEntries();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();
    await resolveBranchAndRefresh();
    console.info(`[Inventory Block] v${VERSION} loaded.`);
}

void init();
