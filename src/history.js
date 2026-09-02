import {
    EXTRA_KEY,
    LINEAGE_VERSION,
    SOURCE,
    getHistoryRetention,
    setHistoryRetention,
} from './constants.js';
import {
    attachPortableCheckpoint,
    ensureRoot,
    getBranchKey,
    getCurrentInventory,
    revisionCount,
} from './state.js';

const clone = value => structuredClone(value);

function scrubInventoryMetadata(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    for (const message of chat) {
        if (message?.extra && typeof message.extra === 'object') delete message.extra[EXTRA_KEY];
        if (!Array.isArray(message?.swipe_info)) continue;
        for (const info of message.swipe_info) {
            if (info?.extra && typeof info.extra === 'object') delete info.extra[EXTRA_KEY];
        }
    }
}

export function applyHistoryRetention(context, value = getHistoryRetention()) {
    const retention = setHistoryRetention(value);
    if (!context?.chatMetadata) return { retention, before: 0, after: 0 };
    const before = revisionCount(context);
    ensureRoot(context);
    const after = revisionCount(context);
    return { retention, before, after };
}

export function trimInventoryHistory(context) {
    return applyHistoryRetention(context, getHistoryRetention());
}

export function clearInventoryHistory(context) {
    if (!context?.chatMetadata) throw new Error('Open a chat before clearing inventory history.');
    const root = ensureRoot(context);
    const current = clone(getCurrentInventory(context));
    const before = revisionCount(context);
    const mutationSerial = Number.isInteger(root.mutationSerial) ? root.mutationSerial + 1 : 1;

    scrubInventoryMetadata(context);
    root.activeRevision = 0;
    root.nextRevision = 1;
    root.mutationSerial = mutationSerial;
    root.revisions = {
        '0': {
            id: 0,
            parent: null,
            source: SOURCE.RESET,
            note: 'History cleared; current inventory baseline',
            createdAt: new Date().toISOString(),
            state: current,
            portable: true,
        },
    };
    root.branchHeads = {};

    const chat = Array.isArray(context.chat) ? context.chat : [];
    const branchKey = getBranchKey(context);
    root.branchHeads[branchKey] = {
        revision: 0,
        length: chat.length,
        sticky: true,
        touchedAt: Date.now(),
        lineageVersion: LINEAGE_VERSION,
    };
    if (chat.length) {
        attachPortableCheckpoint(context, chat.length - 1, 0, {
            source: SOURCE.RESET,
            note: 'Current inventory baseline after history clear',
        });
    }
    return { before, after: 1, retention: getHistoryRetention() };
}
