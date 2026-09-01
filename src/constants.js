export const EXTENSION_ID = 'inventory-block';
export const VERSION = '0.2.1';
export const STATE_VERSION = 2;

export const META_KEY = 'inventoryBlockV2';
export const EXTRA_KEY = 'inventoryBlockV2';
export const PROMPT_KEY = 'inventory-block-state';

export const UPDATE_COMMENT_MARKER = 'INVENTORY_BLOCK_UPDATE';
export const UPDATE_TAG = 'InventoryUpdate';
export const SEED_TAG = 'Inventory';
export const ROOT_CATEGORY = 'General';

export const SOURCE = Object.freeze({
    INIT: 'init',
    SEED: 'seed',
    LLM: 'llm',
    MANUAL: 'manual',
    RESTORE: 'restore',
    IMPORT: 'import',
    RESET: 'reset',
});
