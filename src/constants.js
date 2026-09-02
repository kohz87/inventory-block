export const EXTENSION_ID = 'inventory-block';
export const VERSION = '0.3.0';
export const STATE_VERSION = 2;
export const LINEAGE_VERSION = 2;

export const META_KEY = 'inventoryBlockV2';
export const EXTRA_KEY = 'inventoryBlockV2';

export const UPDATE_COMMENT_MARKER = 'INVENTORY_BLOCK_UPDATE';
export const SEED_TAG = 'Inventory';
export const ROOT_CATEGORY = 'General';

export const HISTORY_RETENTION_OPTIONS = Object.freeze([50, 100, 200, 500, 768]);
export const HISTORY_RETENTION_DEFAULT = 200;
export const HISTORY_RETENTION_MAX = 768;
export const HISTORY_RETENTION_STORAGE_KEY = 'inventoryBlock.historyRetention';

export function normalizeHistoryRetention(value) {
    const number = Number(value);
    return HISTORY_RETENTION_OPTIONS.includes(number) ? number : HISTORY_RETENTION_DEFAULT;
}

export function getHistoryRetention() {
    try {
        return normalizeHistoryRetention(globalThis.localStorage?.getItem(HISTORY_RETENTION_STORAGE_KEY));
    } catch {
        return HISTORY_RETENTION_DEFAULT;
    }
}

export function setHistoryRetention(value) {
    const normalized = normalizeHistoryRetention(value);
    try { globalThis.localStorage?.setItem(HISTORY_RETENTION_STORAGE_KEY, String(normalized)); }
    catch { /* storage unavailable; use normalized value for this call */ }
    return normalized;
}

export const LIMITS = Object.freeze({
    categories: 64,
    items: 512,
    categoryName: 160,
    itemName: 240,
    quantity: 96,
    remark: 2000,
    serializedChars: 120000,
    controlChars: 150000,
    patchOps: 256,
    get revisions() { return getHistoryRetention(); },
    get history() { return getHistoryRetention(); },
    branchHeads: 512,
    stickyBranchHeads: 192,
    uiChats: 64,
    dryRunChats: 8,
    promptProbeChars: 160,
    promptSessions: 8,
});

export const SOURCE = Object.freeze({
    INIT: 'init',
    SEED: 'seed',
    LLM: 'llm',
    MANUAL: 'manual',
    RESTORE: 'restore',
    IMPORT: 'import',
    RESET: 'reset',
    PORTABLE: 'portable',
});
