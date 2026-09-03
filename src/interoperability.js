import { EXTRA_KEY, UPDATE_COMMENT_MARKER } from './constants.js';

function reconciliationTextHash(text) {
    let hash = 2166136261;
    const source = String(text ?? '');
    for (let i = 0; i < source.length; i++) {
        hash ^= source.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function activeMeta(message) {
    return message?.extra?.[EXTRA_KEY] ?? null;
}

function syncActiveSwipeMeta(message) {
    const swipeId = Number.isInteger(message?.swipe_id) ? message.swipe_id : 0;
    const swipe = Array.isArray(message?.swipe_info) ? message.swipe_info[swipeId] : null;
    if (!swipe || !message?.extra?.[EXTRA_KEY]) return;
    swipe.extra ??= {};
    swipe.extra[EXTRA_KEY] = structuredClone(message.extra[EXTRA_KEY]);
}

export function clearReconciliationBoundaryForManualEdit(message) {
    const meta = activeMeta(message);
    if (!meta?.reconcile) return false;
    delete meta.reconcile;
    syncActiveSwipeMeta(message);
    return true;
}

/**
 * A successful Inventory foreground commit stamps the cleaned assistant text so
 * manual recovery and Continue can avoid double-counting. Another one-pass
 * extension may subsequently strip its own machine transport from the same
 * message. That is a safe shortening, not a new narrative event. Retarget the
 * boundary only for a strict shrink on the same Inventory revision; additions,
 * revision changes, manual edits, and remaining Inventory controls fail closed.
 */
export function refreshReconciliationBoundaryAfterForeignCleanup(message) {
    const meta = activeMeta(message);
    const stamp = meta?.reconcile;
    const text = String(message?.mes ?? '');
    if (!stamp || !Number.isInteger(stamp.textLength) || !Number.isInteger(stamp.revision)) return false;
    if (!Number.isInteger(meta?.revision) || meta.revision !== stamp.revision) return false;
    if (text.length >= stamp.textLength) return false;
    if (new RegExp(UPDATE_COMMENT_MARKER, 'i').test(text)) return false;

    meta.reconcile = {
        ...stamp,
        textLength: text.length,
        textHash: reconciliationTextHash(text),
        at: Date.now(),
    };
    syncActiveSwipeMeta(message);
    return true;
}
