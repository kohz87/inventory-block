const GLOBAL_QUEUE_KEY = '__sillytavern_shared_quiet_generation_queue_v1';
export const SHARED_BLOCKER_FAILSAFE_MS = 12 * 60 * 1000;

function createCoordinator() {
    return {
        tail: Promise.resolve(),
        activeLabel: '',
        queuedCount: 0,
        blockers: new Set(),
        blockerTimers: new Map(),
        unblockPromise: Promise.resolve(),
        resolveUnblock: null,
    };
}

function getCoordinator() {
    let state = globalThis[GLOBAL_QUEUE_KEY];
    if (!state || typeof state !== 'object' || !state.tail || typeof state.tail.then !== 'function') {
        state = createCoordinator();
        globalThis[GLOBAL_QUEUE_KEY] = state;
    }
    if (!(state.blockers instanceof Set)) state.blockers = new Set();
    if (!(state.blockerTimers instanceof Map)) state.blockerTimers = new Map();
    if (!state.unblockPromise || typeof state.unblockPromise.then !== 'function') state.unblockPromise = Promise.resolve();
    return state;
}

function releaseBlocker(state, key) {
    const timer = state.blockerTimers.get(key);
    if (timer) globalThis.clearTimeout?.(timer);
    state.blockerTimers.delete(key);
    if (!state.blockers.delete(key)) return;
    if (state.blockers.size === 0) {
        const resolve = state.resolveUnblock;
        state.resolveUnblock = null;
        state.unblockPromise = Promise.resolve();
        resolve?.();
    }
}

export function setSharedQuietGenerationBlocked(label, blocked) {
    const state = getCoordinator();
    const key = String(label || 'extension');
    if (blocked) {
        if (!state.blockers.has(key)) {
            if (state.blockers.size === 0) {
                state.unblockPromise = new Promise(resolve => { state.resolveUnblock = resolve; });
            }
            state.blockers.add(key);
        }
        const existingTimer = state.blockerTimers.get(key);
        if (existingTimer) globalThis.clearTimeout?.(existingTimer);
        const timer = globalThis.setTimeout?.(() => releaseBlocker(state, key), SHARED_BLOCKER_FAILSAFE_MS);
        timer?.unref?.();
        if (timer) state.blockerTimers.set(key, timer);
        return;
    }
    releaseBlocker(state, key);
}

export function sharedQuietGenerationStatus() {
    const state = getCoordinator();
    return {
        activeLabel: String(state.activeLabel || ''),
        queuedCount: Math.max(0, Number(state.queuedCount) || 0),
        blockers: [...state.blockers],
    };
}
