export const EXTENSION_ID = 'inventory-block';
export const VERSION = '0.3.1';
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

let historyRetentionStorageRef = undefined;
let historyRetentionMemory = HISTORY_RETENTION_DEFAULT;
let historyRetentionInitialized = false;

function retentionStorage() {
    try { return globalThis.localStorage ?? null; }
    catch { return null; }
}

function syncRetentionStorage() {
    const storage = retentionStorage();
    if (storage !== historyRetentionStorageRef) {
        historyRetentionStorageRef = storage;
        historyRetentionInitialized = false;
    }
    return storage;
}

export function getHistoryRetention() {
    const storage = syncRetentionStorage();
    if (historyRetentionInitialized) return historyRetentionMemory;
    try { historyRetentionMemory = normalizeHistoryRetention(storage?.getItem(HISTORY_RETENTION_STORAGE_KEY)); }
    catch { historyRetentionMemory = HISTORY_RETENTION_DEFAULT; }
    historyRetentionInitialized = true;
    return historyRetentionMemory;
}

export function setHistoryRetention(value) {
    const normalized = normalizeHistoryRetention(value);
    const storage = syncRetentionStorage();
    historyRetentionMemory = normalized;
    historyRetentionInitialized = true;
    try { storage?.setItem(HISTORY_RETENTION_STORAGE_KEY, String(normalized)); }
    catch { /* retain the in-memory value when persistent storage is unavailable */ }
    return normalized;
}

function retainedBranchHeads() {
    return Math.min(512, Math.max(8, getHistoryRetention() - 2));
}

function retainedStickyBranchHeads() {
    return Math.min(192, Math.max(4, Math.floor(retainedBranchHeads() / 2)));
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
    get portableCheckpoints() { return getHistoryRetention(); },
    get branchHeads() { return retainedBranchHeads(); },
    get stickyBranchHeads() { return retainedStickyBranchHeads(); },
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
