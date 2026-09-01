import { ROOT_CATEGORY, SEED_TAG, UPDATE_COMMENT_MARKER, UPDATE_TAG } from './constants.js';
import {
    canonicalCategoryName,
    normalizeInventory,
    normalizeQuantity,
    validateAndNormalizeInventory,
} from './state.js';

const clone = value => structuredClone(value);

function oneLine(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '∣').trim();
}

function sameName(a, b) {
    return String(a ?? '').trim().toLocaleLowerCase() === String(b ?? '').trim().toLocaleLowerCase();
}

export function isRootCategoryName(name) {
    return canonicalCategoryName(name) === ROOT_CATEGORY;
}

export function formatInventoryState(state) {
    const inventory = normalizeInventory(state);
    if (!inventory.categories.length) return '(empty)';
    const lines = [];
    for (const category of inventory.categories) {
        lines.push(`[${oneLine(category.name)}]`);
        for (const item of category.items) lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
    }
    return lines.join('\n');
}

export function formatInventorySeedBlock(state) {
    const inventory = normalizeInventory(state);
    const lines = [`<${SEED_TAG}>`];
    const root = inventory.categories.find(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));
    for (const item of root?.items ?? []) lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
    sections.forEach(category => {
        if (lines.length > 1 && lines.at(-1) !== '') lines.push('');
        lines.push(`[${oneLine(category.name)}]`);
        for (const item of category.items) lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
    });
    lines.push(`</${SEED_TAG}>`);
    return lines.join('\n');
}

export function buildInventoryPrompt(state) {
    return `<InventoryState>\n${formatInventoryState(state)}\n</InventoryState>\n\n` +
`InventoryState is the sole authoritative current possession record. Earlier story mentions are historical and never restore absent items, old quantities, categories, or remarks.\n` +
`Entries are Name | Quantity | Remark under free-form categories. Follow explicit OOC inventory administration such as creating party-member categories or consolidating supplies.\n` +
`Never print <Inventory> or a visible inventory list. If nothing changes, emit no inventory control.\n` +
`For ordinary gameplay changes append exactly one machine-only comment at the very end:\n` +
`<!-- ${UPDATE_COMMENT_MARKER}\n{"mode":"patch","ops":[...]}\n-->\n` +
`Ops: add_category{name}; rename_category{category,name}; delete_category{category}; add_item{category,name,quantity,remark}; set_item{category,name,quantity?,remark?}; adjust_item{category,name,by}; edit_item{category,name,newName?,quantity?,remark?}; delete_item{category,name}; move_item{fromCategory,toCategory,name}.\n` +
`Use adjust_item only when Quantity itself is a plain number. If the meaningful amount is in Remark (for example Food | 1 | 8 days or Coin Pouch | 1 | 400 Gold), use edit_item instead.\n` +
`Use mode:"replace" only when the user explicitly asks for broad inventory cleanup/reorganization/consolidation. A replacement must contain the complete intended inventory: {"mode":"replace","categories":[{"name":"...","items":[{"name":"...","quantity":"...","remark":"..."}]}]}.\n` +
`Do not mention the machine control in prose.`;
}

function trimMarkdownRow(line) {
    let text = String(line ?? '').trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|')) text = text.slice(0, -1);
    return text.trim();
}

function rowCells(line) {
    return trimMarkdownRow(line).split('|').map(cell => cell.trim());
}

function seedCategoryMarker(line) {
    const bracket = String(line ?? '').trim().match(/^\[([^\]]+)\]$/);
    if (bracket) return bracket[1].trim();
    const bare = String(line ?? '').trim().match(/^--\s*(.+?)\s*--$/);
    if (bare) return bare[1].trim();
    const cells = rowCells(line);
    const tableMarker = String(cells[0] ?? '').match(/^--\s*(.+?)\s*--$/);
    if (tableMarker && cells.slice(1).every(cell => !cell)) return tableMarker[1].trim();
    return null;
}

function isSeedTableSeparator(cells) {
    return cells.length > 1 && cells.every(cell => !cell || /^:?-{2,}:?$/.test(cell));
}

function isSeedTableHeader(cells) {
    if (cells.length < 2) return false;
    const [first, second, third = ''] = cells.map(cell => cell.toLocaleLowerCase());
    return ['item', 'name'].includes(first) && ['qty', 'quantity'].includes(second) && (!third || ['notes', 'note', 'remark', 'remarks'].includes(third));
}

function ensureSeedCategory(categories, name) {
    const clean = canonicalCategoryName(name || ROOT_CATEGORY) || ROOT_CATEGORY;
    let category = categories.find(entry => sameName(entry.name, clean));
    if (!category) {
        category = { name: clean, items: [] };
        categories.push(category);
    }
    return category;
}

export function consumeInventorySeed(messageText) {
    const source = String(messageText ?? '');
    const closed = source.match(/<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>/i);
    const open = source.search(/<Inventory\b[^>]*>/i);
    if (!closed) {
        if (open < 0) return { found: false, cleanedText: source, state: null, errors: [] };
        return {
            found: true,
            cleanedText: source.slice(0, open).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
            state: null,
            errors: ['The <Inventory> seed was truncated and was discarded.'],
        };
    }

    const categories = [];
    let current = null;
    const meaningfulLines = String(closed[1] ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const rawLine of meaningfulLines) {
        const marker = seedCategoryMarker(rawLine);
        if (marker) {
            current = ensureSeedCategory(categories, marker);
            continue;
        }
        const cells = rowCells(rawLine);
        if (isSeedTableSeparator(cells) || isSeedTableHeader(cells) || cells.length < 2) continue;
        const name = String(cells[0] ?? '').trim();
        if (!name) continue;
        if (!current) current = ensureSeedCategory(categories, ROOT_CATEGORY);
        current.items.push({ name, quantity: normalizeQuantity(cells[1]), remark: cells.slice(2).join(' | ').trim() });
    }

    const cleanedText = `${source.slice(0, closed.index)}${source.slice((closed.index ?? 0) + closed[0].length)}`
        .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();

    let state;
    try {
        state = validateAndNormalizeInventory({ categories });
    } catch (error) {
        return { found: true, cleanedText, state: null, errors: error.validationErrors ?? [error.message] };
    }
    return { found: true, cleanedText, state, errors: [] };
}

export function stripReservedInventorySeed(messageText) {
    const source = String(messageText ?? '');
    const closedRe = /<Inventory\b[^>]*>[\s\S]*?<\/Inventory\s*>/gi;
    let found = false;
    let cleaned = source.replace(closedRe, () => { found = true; return ''; });
    const open = cleaned.search(/<Inventory\b[^>]*>/i);
    let truncated = false;
    if (open >= 0) {
        found = true;
        truncated = true;
        cleaned = cleaned.slice(0, open);
    }
    cleaned = cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();
    return { found, truncated, cleanedText: cleaned };
}

function findCategory(state, name) {
    const canonical = canonicalCategoryName(name);
    return state.categories.find(category => sameName(category.name, canonical)) ?? null;
}

function requireCategory(state, name) {
    const category = findCategory(state, name);
    if (!category) throw new Error(`Unknown inventory category: ${name}`);
    return category;
}

function ensureCategory(state, name) {
    const clean = canonicalCategoryName(name) || ROOT_CATEGORY;
    let category = findCategory(state, clean);
    if (!category) {
        category = { name: clean, items: [] };
        state.categories.push(category);
    }
    return category;
}

function findItemIndex(category, name) {
    return category.items.findIndex(item => sameName(item.name, name));
}

function assertNoItemCollision(category, name, exceptIndex = -1) {
    const index = findItemIndex(category, name);
    if (index >= 0 && index !== exceptIndex) throw new Error(`Item already exists in "${category.name}": ${name}`);
}

function normalizedItemFromOp(op) {
    const name = String(op?.name ?? '').trim();
    if (!name) throw new Error('Inventory item name is required.');
    return { name, quantity: normalizeQuantity(op?.quantity), remark: String(op?.remark ?? '').replace(/\r?\n/g, ' ').trim() };
}

function applyPatchOperation(state, op) {
    if (!op || typeof op !== 'object' || Array.isArray(op)) throw new Error('Inventory operation must be an object.');
    switch (op.op) {
        case 'add_category': {
            const name = canonicalCategoryName(op.name);
            if (!name) throw new Error('Category name is required.');
            if (findCategory(state, name)) throw new Error(`Category already exists: ${name}`);
            state.categories.push({ name, items: [] });
            return;
        }
        case 'rename_category': {
            const category = requireCategory(state, op.category);
            const name = canonicalCategoryName(op.name);
            if (!name) throw new Error('New category name is required.');
            const duplicate = findCategory(state, name);
            if (duplicate && duplicate !== category) throw new Error(`Category already exists: ${name}`);
            category.name = name;
            return;
        }
        case 'delete_category': {
            const category = requireCategory(state, op.category);
            state.categories = state.categories.filter(entry => entry !== category);
            return;
        }
        case 'add_item': {
            const category = ensureCategory(state, op.category);
            const item = normalizedItemFromOp(op);
            const index = findItemIndex(category, item.name);
            if (index < 0) {
                if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(item.quantity) && Number(item.quantity) <= 0) {
                    throw new Error(`Cannot add ${item.name} with a non-positive numeric quantity.`);
                }
                category.items.push(item);
                return;
            }
            const existing = category.items[index];
            const current = Number(existing.quantity);
            const added = Number(item.quantity);
            if (!Number.isFinite(current) || !Number.isFinite(added) || existing.quantity === '' || item.quantity === '' || added <= 0) {
                throw new Error(`Item already exists and quantity is not safely additive: ${item.name}`);
            }
            existing.quantity = String(current + added);
            if (Object.hasOwn(op, 'remark') && item.remark) existing.remark = item.remark;
            return;
        }
        case 'set_item': {
            const category = ensureCategory(state, op.category);
            const name = String(op?.name ?? '').trim();
            if (!name) throw new Error('Inventory item name is required.');
            const index = findItemIndex(category, name);
            if (index < 0) {
                category.items.push({
                    name,
                    quantity: Object.hasOwn(op, 'quantity') ? normalizeQuantity(op.quantity) : '',
                    remark: Object.hasOwn(op, 'remark') ? String(op.remark ?? '').replace(/\r?\n/g, ' ').trim() : '',
                });
            } else {
                const existing = category.items[index];
                if (Object.hasOwn(op, 'quantity')) existing.quantity = normalizeQuantity(op.quantity);
                if (Object.hasOwn(op, 'remark')) existing.remark = String(op.remark ?? '').replace(/\r?\n/g, ' ').trim();
            }
            return;
        }
        case 'adjust_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const existing = category.items[index];
            if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(existing.quantity)) throw new Error(`Cannot numerically adjust non-numeric quantity for ${existing.name}.`);
            const delta = Number(op.by);
            if (!Number.isFinite(delta)) throw new Error(`Invalid quantity adjustment for ${existing.name}.`);
            const result = Number(existing.quantity) + delta;
            if (result <= 0) category.items.splice(index, 1);
            else existing.quantity = String(result);
            return;
        }
        case 'edit_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const item = category.items[index];
            if (Object.hasOwn(op, 'newName')) {
                const newName = String(op.newName ?? '').trim();
                if (!newName) throw new Error('New item name cannot be blank.');
                assertNoItemCollision(category, newName, index);
                item.name = newName;
            }
            if (Object.hasOwn(op, 'quantity')) item.quantity = normalizeQuantity(op.quantity);
            if (Object.hasOwn(op, 'remark')) item.remark = String(op.remark ?? '').replace(/\r?\n/g, ' ').trim();
            return;
        }
        case 'delete_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            category.items.splice(index, 1);
            return;
        }
        case 'move_item': {
            const from = requireCategory(state, op.fromCategory);
            const index = findItemIndex(from, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const to = ensureCategory(state, op.toCategory);
            if (to === from) return;
            assertNoItemCollision(to, from.items[index].name);
            const [item] = from.items.splice(index, 1);
            to.items.push(item);
            return;
        }
        default:
            throw new Error(`Unsupported inventory operation: ${op.op}`);
    }
}

function applyPayload(baseState, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Inventory update payload must be a JSON object.');
    if (payload.mode === 'replace') return validateAndNormalizeInventory({ categories: payload.categories });
    if (payload.mode !== 'patch') throw new Error(`Unsupported inventory update mode: ${payload.mode}`);
    if (!Array.isArray(payload.ops)) throw new Error('Patch update requires an ops array.');
    const state = normalizeInventory(clone(baseState));
    for (const op of payload.ops) applyPatchOperation(state, op);
    return validateAndNormalizeInventory(state);
}

function stripFence(text) {
    return String(text ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export function hasInventoryControl(text) {
    return new RegExp(`${UPDATE_COMMENT_MARKER}|<${UPDATE_TAG}\\b|<Inventory\\b`, 'i').test(String(text ?? ''));
}

export function consumeInventoryUpdates(messageText, baseState) {
    let cleaned = String(messageText ?? '');
    const payloadTexts = [];
    const commentRe = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\s*([\\s\\S]*?)-->`, 'gi');
    cleaned = cleaned.replace(commentRe, (_whole, body) => { payloadTexts.push(body); return ''; });
    const tagRe = new RegExp(`<${UPDATE_TAG}\\b[^>]*>([\\s\\S]*?)<\\/${UPDATE_TAG}\\s*>`, 'gi');
    cleaned = cleaned.replace(tagRe, (_whole, body) => { payloadTexts.push(body); return ''; });

    let truncated = false;
    const commentCut = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}[\\s\\S]*$`, 'i');
    if (commentCut.test(cleaned)) { cleaned = cleaned.replace(commentCut, ''); truncated = true; }
    const tagCut = new RegExp(`<${UPDATE_TAG}\\b[^>]*>[\\s\\S]*$`, 'i');
    if (tagCut.test(cleaned)) { cleaned = cleaned.replace(tagCut, ''); truncated = true; }
    cleaned = cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();

    const errors = [];
    if (truncated) errors.push('Inventory control record was truncated and discarded.');
    if (payloadTexts.length > 1) errors.push('Multiple inventory control records were emitted; all were discarded.');
    if (payloadTexts.length === 0 || errors.length) {
        return { cleanedText: cleaned, state: normalizeInventory(baseState), changed: false, hadControl: payloadTexts.length > 0 || truncated, errors, note: '' };
    }

    let working = normalizeInventory(baseState);
    let payload = null;
    try {
        payload = JSON.parse(stripFence(payloadTexts[0]));
        working = applyPayload(working, payload);
    } catch (error) {
        errors.push(...(error.validationErrors ?? [error instanceof Error ? error.message : String(error)]));
        working = normalizeInventory(baseState);
    }

    const changed = errors.length === 0 && JSON.stringify(working) !== JSON.stringify(normalizeInventory(baseState));
    const note = payload?.mode === 'replace' ? 'LLM inventory replacement' : `LLM inventory update (${Array.isArray(payload?.ops) ? payload.ops.length : 0} operations)`;
    return { cleanedText: cleaned, state: working, changed, hadControl: true, errors, note, mode: payload?.mode ?? null };
}
