import { EXTRA_KEY, SOURCE, VERSION } from './src/constants.js';
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
    hasCompleteInventoryUpdate,
    hasInventoryControl,
    mergeInventoryStates,
    stripReservedInventorySeed,
} from './src/protocol.js';
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
import { openInventoryEditor, openInventoryHistory, renderInventoryPane } from './src/ui.js';
import { initializeMeguminBridge, scheduleInventoryMount } from './src/megumin.js';
import { mountExtensionUi } from './src/settings.js';
import { createPromptSlotMarker, injectDryRunPrompt, insertPromptSlot, replacePromptSlot } from './src/injection.js';

let pendingGeneration = null;
let processingMessages = new Set();
let initialized = false;
let eventsRegistered = false;
let menuRetry = null;
let pendingWatchdog = null;
let ephemeralDryRunPrompt = null;
const promptSlots = new Map();
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;
const WATCHDOG_INTERVAL_MS = 15000;
const PROMPT_SLOT_MAX_AGE_MS = 30 * 60 * 1000;

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

function pendingFor(ctx) {
    if (!pendingGeneration || pendingGeneration.chatId !== chatIdOf(ctx)) return null;
    if (Date.now() - pendingGeneration.startedAt > PENDING_MAX_AGE_MS) {
        pendingGeneration = null;
        return null;
    }
    return pendingGeneration;
}

function generationLockFor(ctx) {
    return pendingFor(ctx);
}

function pendingAppliesToMessage(pending, messageId) {
    if (!pending) return false;
    const id = Number(messageId);
    if (!Number.isInteger(id)) return false;
    if (Number.isInteger(pending.targetMessageId)) return id === pending.targetMessageId;
    return id >= pending.startChatLength;
}

function generationForMessage(ctx, messageId, eventType = '') {
    const pending = pendingFor(ctx);
    if (!pending || !pendingAppliesToMessage(pending, messageId)) return null;
    if (eventType && !generationTypeMatches(pending.type, eventType)) return null;
    return pending;
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

function generationTimelineChanged(ctx, generation) {
    const current = prefixLineageHash(ctx, generation.guardLength);
    return current === null || current !== generation.guardLineageHash;
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

function refreshAll(_ctx = context()) {
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

async function commitManual(state, options = {}, expectedChatId = null) {
    const ctx = context();
    const actualChatId = chatIdOf(ctx);
    if (!ctx || !hasActiveChat(ctx)) throw new Error('Open a chat before editing inventory.');
    if (expectedChatId !== null && actualChatId !== expectedChatId) {
        throw new Error('The active chat changed while the inventory editor was open. Nothing was saved.');
    }
    if (generationLockFor(ctx)) throw new Error('Wait for the current generation response to finish committing before changing inventory manually.');
    ensureRoot(ctx);
    commitManualState(ctx, state, options);
    await saveMetadata(ctx, actualChatId);
    refreshAll(ctx);
}

async function openEditor() {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return notify('warning', 'Open a chat before editing inventory.');
    const expectedChatId = chatIdOf(ctx);
    await openInventoryEditor(ctx, getCurrentInventory(ctx), {
        onSave: async state => {
            await commitManual(state, { source: SOURCE.MANUAL, note: 'Manual inventory edit' }, expectedChatId);
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
            refreshAll(live);
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

function generationBase(ctx, pending = pendingFor(ctx)) {
    const root = ensureRoot(ctx);
    if (pending && getRevision(root, pending.baseRevision)) return pending.baseRevision;
    return resolveActiveRevision(ctx);
}

function currentMessageNeedsNewUid(message, type) {
    if (!activeMessageMeta(message)?.uid) return true;
    return ['swipe', 'regenerate', 'normal', 'group', 'first_message', 'seed', 'existing_swipe'].includes(normalizeGenerationType(type));
}

function acceptExistingMessageBase(message, type, fallbackBase, pending = null) {
    const existing = activeMessageMeta(message);
    const lower = normalizeGenerationType(type);
    if (existing && ['continue', 'append', 'appendfinal', 'updated', 'message_updated', 'edited'].includes(lower)) return existing.baseRevision;
    if (existing && pending?.type === 'continue') return existing.baseRevision;
    return fallbackBase;
}

function initialGreetingSeedEligible(ctx, id, type) {
    if (normalizeGenerationType(type) !== 'first_message') return false;
    if (ctx.chat.length > id + 1) return false;
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

function clearPendingIfMatches(generation, chatId) {
    if (pendingGeneration === generation && pendingGeneration?.chatId === chatId) {
        if (generation?.promptSlot) promptSlots.delete(generation.promptSlot);
        pendingGeneration = null;
        if (pendingWatchdog) {
            clearTimeout(pendingWatchdog);
            pendingWatchdog = null;
        }
    }
}

async function processAssistantMessage(messageId, type = '') {
    const id = Number(messageId);
    const ctx = context();
    const chatId = chatIdOf(ctx);
    const processingKey = `${chatId}:${id}`;
    if (!Number.isInteger(id) || processingMessages.has(processingKey)) return;
    if (!ctx || !hasActiveChat(ctx)) return;
    const message = ctx.chat?.[id];
    if (!message || message.is_user || message.is_system) return;

    processingMessages.add(processingKey);
    let generation = null;
    try {
        const root = ensureRoot(ctx);
        const existingMeta = activeMessageMeta(message);
        const firstMessage = isFirstAssistantMessage(ctx, id);
        const hasSeed = /<Inventory\b/i.test(String(message.mes ?? ''));
        generation = generationForMessage(ctx, id, type);
        const pendingApplies = Boolean(generation);
        const currentLineageHash = lineageHashThrough(ctx, id);
        const greetingSeed = hasSeed && initialGreetingSeedEligible(ctx, id, type);
        const firstSeed = firstMessage && hasSeed && (
            (pendingApplies && isReplacementGeneration(generation.type) && generation.baseRevision === 0) ||
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
            const hadMachineSyntax = reserved.found || stripped.hadControl;
            if (hadMachineSyntax) notify('warning', 'Historical inventory control text was stripped without changing inventory state.');
            if (cleaned !== message.mes) {
                message.mes = cleaned;
                refreshRenderedMessageIfPresent(ctx, id, message);
                persistChatSoon(ctx, chatId);
            }
            setTimeout(() => void resolveBranchAndRefresh(), 0);
            return;
        }

        let baseRevision = seedAllowed && firstMessage ? 0 : generationBase(ctx, pendingApplies ? generation : null);
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
            if (reserved.found) {
                workingText = reserved.cleanedText;
                warnings.push(reserved.truncated
                    ? 'A later/truncated <Inventory> block was stripped. Starting inventory tags are greeting-only.'
                    : 'A later <Inventory> block was stripped. Starting inventory tags are greeting-only.');
            }
        }

        const result = consumeInventoryUpdates(workingText, workingState, {
            replaceCapability: pendingApplies ? generation?.replaceCapability : null,
        });
        warnings.push(...result.errors);
        const controlTrusted = pendingApplies || seedAllowed || isTrustedUntrackedControl(type);
        if (result.hadControl && !controlTrusted) {
            warnings.push('Inventory control was emitted outside a tracked assistant generation and was stripped without changing inventory state.');
            result.state = workingState;
            result.changed = false;
        }

        const mutationConflict = Boolean(pendingApplies && root.mutationSerial !== generation.mutationSerial);
        const timelineConflict = Boolean(pendingApplies && generationTimelineChanged(ctx, generation));
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
            : acceptExistingMessageBase(message, type, effectiveBase, pendingApplies ? generation : null);
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
        if (pendingApplies) clearPendingIfMatches(generation, chatId);
        refreshAll(ctx);
    } catch (error) {
        console.error('[Inventory Block] Failed to process assistant inventory state.', error);
        notify('error', error instanceof Error ? error.message : String(error));
    } finally {
        processingMessages.delete(processingKey);
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

function armPendingWatchdog(snapshot) {
    if (pendingWatchdog) clearTimeout(pendingWatchdog);
    const tick = () => {
        pendingWatchdog = null;
        if (pendingGeneration !== snapshot) return;
        const live = context();
        const age = Date.now() - snapshot.startedAt;
        const generating = document.body?.dataset?.generating === 'true';
        if (age >= PENDING_MAX_AGE_MS || (!generating && age >= WATCHDOG_INTERVAL_MS)) {
            pendingGeneration = null;
            refreshAll(live);
            return;
        }
        pendingWatchdog = setTimeout(tick, WATCHDOG_INTERVAL_MS);
    };
    pendingWatchdog = setTimeout(tick, WATCHDOG_INTERVAL_MS);
}

function onGenerationPrepared(type = 'normal', _params = null, isDryRun = false) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) return;
    if (isBackgroundGeneration(type)) return;
    if (isDryRun) {
        try {
            ephemeralDryRunPrompt = {
                chatId: chatIdOf(ctx),
                prompt: buildInventoryPrompt(getCurrentInventory(ctx)),
                startedAt: Date.now(),
            };
        } catch (error) {
            console.warn('[Inventory Block] Could not prepare dry-run inventory context.', error);
            ephemeralDryRunPrompt = null;
        }
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
        if (isReplacementGeneration(lower) && Number.isInteger(targetMeta?.baseRevision) && getRevision(root, targetMeta.baseRevision)) {
            baseRevision = targetMeta.baseRevision;
        }
        const userInstruction = userInstructionForGeneration(lower, ctx.chat, generationComposerText());
        const broadAdmin = isBroadInventoryAdministration(userInstruction);
        const replaceCapability = broadAdmin ? createReplaceCapability() : null;
        const startChatLength = Array.isArray(ctx.chat) ? ctx.chat.length : 0;
        const guardLength = generationGuardLength(lower, startChatLength, targetMessageId);
        pendingGeneration = {
            chatId: chatIdOf(ctx),
            type: lower,
            baseRevision,
            previousActiveRevision,
            mutationSerial: root.mutationSerial,
            targetMessageId,
            startChatLength,
            guardLength,
            guardLineageHash: prefixLineageHash(ctx, guardLength),
            replaceCapability,
            promptReadySeen: false,
            startedAt: Date.now(),
        };
        armPendingWatchdog(pendingGeneration);
    } catch (error) {
        console.warn('[Inventory Block] Could not prepare generation inventory state.', error);
    }
}

function prunePromptSlots() {
    const cutoff = Date.now() - PROMPT_SLOT_MAX_AGE_MS;
    for (const [marker, slot] of promptSlots) {
        if (pendingGeneration?.promptSlot === marker) continue;
        if (!slot || slot.createdAt < cutoff) promptSlots.delete(marker);
    }
}

function onPromptReady(eventData = null) {
    const ctx = context();
    prunePromptSlots();
    for (const [marker, slot] of [...promptSlots]) {
        const replaced = replacePromptSlot(eventData, marker, slot.prompt);
        if (!replaced) continue;
        promptSlots.delete(marker);
        if (pendingGeneration?.promptSlot === marker) pendingGeneration.promptReadySeen = true;
    }
    if (ephemeralDryRunPrompt && ephemeralDryRunPrompt.chatId === chatIdOf(ctx) && eventData?.dryRun === true) {
        injectDryRunPrompt(eventData, ephemeralDryRunPrompt.prompt);
        ephemeralDryRunPrompt = null;
    }
}

function onGenerationInterceptor(chat, _contextSize, _abort, type = 'normal') {
    if (isBackgroundGeneration(type)) return;
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx) || !Array.isArray(chat)) return;
    try {
        const pending = pendingFor(ctx);
        const matching = pending && generationTypeMatches(pending.type, type) ? pending : null;
        const root = ensureRoot(ctx);
        const revision = matching && getRevision(root, matching.baseRevision)
            ? matching.baseRevision
            : resolveActiveRevision(ctx);
        const prompt = buildInventoryPrompt(getInventoryAt(root, revision), {
            replaceCapability: matching?.replaceCapability ?? null,
        });
        // Reserve prompt budget with an opaque base64 payload. It is generation-local,
        // invisible to the model after replacement, and does not expose inventory text to WI scans.
        const marker = createPromptSlotMarker(prompt);
        if (!insertPromptSlot(chat, marker)) return;
        promptSlots.set(marker, {
            prompt,
            chatId: chatIdOf(ctx),
            createdAt: Date.now(),
        });
        if (matching) matching.promptSlot = marker;
        prunePromptSlots();
    } catch (error) {
        console.warn('[Inventory Block] Could not inject generation-local inventory prompt.', error);
    }
}

globalThis.inventoryBlockGenerationInterceptor = onGenerationInterceptor;

function onGenerationStopped() {
    // Do not consume the transaction here. SillyTavern can emit terminal events before
    // MESSAGE_RECEIVED; the watchdog clears abandoned sessions once the UI is idle.
}

function onMessageUpdated(messageId, type = 'updated', manualEdit = false) {
    const ctx = context();
    const message = ctx?.chat?.[Number(messageId)];
    if (!message || message.is_user || message.is_system) return;
    const activePending = pendingFor(ctx);
    if (!manualEdit && activePending && pendingAppliesToMessage(activePending, messageId)) return;
    if (hasCompleteInventoryUpdate(message.mes) || (manualEdit && hasInventoryControl(message.mes))) {
        void processAssistantMessage(messageId, type);
    } else {
        setTimeout(() => void resolveBranchAndRefresh(), 0);
    }
}

function onMessageSwiped(messageId) {
    setTimeout(async () => {
        const ctx = context();
        const id = Number(messageId);
        if (!ctx || !hasActiveChat(ctx) || !Number.isInteger(id)) return;
        try {
            const revision = resolveActiveRevision(ctx);
            const message = ctx.chat?.[id];
            if (message && !message.is_user && !message.is_system && hasInventoryControl(message.mes)) {
                await processAssistantMessage(id, 'existing_swipe');
                return;
            }
            if (message && !message.is_user && !message.is_system) {
                const meta = activeMessageMeta(message);
                if (!meta || meta.lineageHash !== lineageHashThrough(ctx, id)) {
                    attachMessageRevision(ctx, id, { baseRevision: revision, revision, newUid: true, portable: false });
                }
            }
            rememberBranchHead(ctx);
            ctx.saveMetadataDebounced?.();
            refreshAll(ctx);
        } catch (error) {
            console.warn('[Inventory Block] Could not restore swiped inventory branch.', error);
        }
    }, 20);
}

function onChatChanged() {
    pendingGeneration = null;
    ephemeralDryRunPrompt = null;
    // Do not clear generation-local slots here: an in-flight request from the
    // previous chat may still reach its prompt-ready event after the UI switches.
    prunePromptSlots();
    if (pendingWatchdog) {
        clearTimeout(pendingWatchdog);
        pendingWatchdog = null;
    }
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
    for (const event of [events.CHAT_COMPLETION_PROMPT_READY, events.GENERATE_AFTER_COMBINE_PROMPTS]) {
        if (event) ctx.eventSource.on(event, onPromptReady);
    }
    if (events.MESSAGE_RECEIVED) ctx.eventSource.on(events.MESSAGE_RECEIVED, processAssistantMessage);
    if (events.MESSAGE_UPDATED) ctx.eventSource.on(events.MESSAGE_UPDATED, id => onMessageUpdated(id, 'updated', false));
    if (events.MESSAGE_EDITED) ctx.eventSource.on(events.MESSAGE_EDITED, id => onMessageUpdated(id, 'edited', true));
    if (events.MESSAGE_SWIPED) ctx.eventSource.on(events.MESSAGE_SWIPED, onMessageSwiped);
    for (const event of [events.MESSAGE_DELETED, events.MESSAGE_SWIPE_DELETED, events.CHARACTER_FIRST_MESSAGE_SELECTED]) {
        if (event) ctx.eventSource.on(event, () => setTimeout(() => void resolveBranchAndRefresh(), 20));
    }
    for (const event of [events.CHAT_CHANGED, events.CHAT_LOADED]) {
        if (event) ctx.eventSource.on(event, onChatChanged);
    }
    for (const event of [events.APP_READY, events.APP_INITIALIZED, events.EXTENSIONS_FIRST_LOAD, events.EXTENSION_SETTINGS_LOADED]) {
        if (event) ctx.eventSource.on(event, () => {
            ensureExtensionUiEntries();
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
    ensureExtensionUiEntries();
    initializeMeguminBridge(renderCurrentPane);
    registerEvents();
    await resolveBranchAndRefresh();
    console.info(`[Inventory Block] v${VERSION} loaded.`);
}

void init();
