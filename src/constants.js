export const EXTENSION_ID = 'inventory-block';
export const VERSION = '0.2.9';
export const STATE_VERSION = 2;
export const LINEAGE_VERSION = 2;

export const META_KEY = 'inventoryBlockV2';
export const EXTRA_KEY = 'inventoryBlockV2';

export const UPDATE_COMMENT_MARKER = 'INVENTORY_BLOCK_UPDATE';
export const SEED_TAG = 'Inventory';
export const ROOT_CATEGORY = 'General';

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
    revisions: 768,
    history: 200,
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
