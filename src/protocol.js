import { LIMITS, ROOT_CATEGORY, SEED_TAG, UPDATE_COMMENT_MARKER, UPDATE_TAG } from './constants.js';
import {
    canonicalCategoryName,
    normalizeInventory,
    normalizeQuantity,
    validateAndNormalizeInventory,
} from './state.js';

const clone = value => structuredClone(value);
const NUMERIC_QUANTITY = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function oneLine(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function promptCell(value) {
    return oneLine(value).replace(/\|/g, '∣');
}

function sameName(a, b) {
    return String(a ?? '').trim().toLocaleLowerCase() === String(b ?? '').trim().toLocaleLowerCase();
}

function cleanRemark(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function assertScalarText(value, label, { optional = true } = {}) {
    if (optional && (value === undefined || value === null)) return;
    if (typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) {
        throw new Error(`${label} must be text or a number.`);
    }
}

function numericQuantity(value) {
    const text = normalizeQuantity(value);
    return NUMERIC_QUANTITY.test(text) ? Number(text) : null;
}

function categoryArgument(value, label = 'Inventory category') {
    if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
    const clean = canonicalCategoryName(value);
    if (!clean) throw new Error(`${label} is required.`);
    return clean;
}

function seedEscape(value, { bracket = false } = {}) {
    let text = oneLine(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    if (bracket) text = text.replace(/\]/g, '\\]');
    return text;
}

function seedUnescape(value) {
    let result = '';
    let escaped = false;
    for (const char of String(value ?? '')) {
        if (escaped) {
            result += char;
            escaped = false;
        } else if (char === '\\') {
            escaped = true;
        } else {
            result += char;
        }
    }
    if (escaped) result += '\\';
    return result;
}

function splitSeedCells(line) {
    let text = String(line ?? '').trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
    const cells = [];
    let current = '';
    let escaped = false;
    for (const char of text) {
        if (escaped) {
            current += char;
            escaped = false;
        } else if (char === '\\') {
            escaped = true;
        } else if (char === '|') {
            cells.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (escaped) current += '\\';
    cells.push(current.trim());
    return cells;
}

export function isRootCategoryName(name) {
    return canonicalCategoryName(name) === ROOT_CATEGORY;
}

export function formatInventoryState(state) {
    const inventory = normalizeInventory(state);
    if (!inventory.categories.length) return '(empty)';
    const lines = [];
    for (const category of inventory.categories) {
        lines.push(`[${promptCell(category.name)}]`);
        for (const item of category.items) lines.push(`${promptCell(item.name)} | ${promptCell(item.quantity)} | ${promptCell(item.remark)}`);
    }
    return lines.join('\n');
}

export function formatInventorySeedBlock(state) {
    const inventory = normalizeInventory(state);
    const lines = [`<${SEED_TAG}>`];
    const root = inventory.categories.find(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));
    for (const item of root?.items ?? []) lines.push(`${seedEscape(item.name)} | ${seedEscape(item.quantity)} | ${seedEscape(item.remark)}`);
    sections.forEach(category => {
        if (lines.length > 1 && lines.at(-1) !== '') lines.push('');
        lines.push(`[${seedEscape(category.name, { bracket: true })}]`);
        for (const item of category.items) lines.push(`${seedEscape(item.name)} | ${seedEscape(item.quantity)} | ${seedEscape(item.remark)}`);
    });
    lines.push(`</${SEED_TAG}>`);
    return lines.join('\n');
}

export function buildInventoryPrompt(state, { replaceCapability = null } = {}) {
    const replaceRule = replaceCapability
        ? `The user explicitly requested broad inventory administration this turn. A full replacement is allowed only with this exact capability: ${replaceCapability}. Use {"mode":"replace","replaceToken":"${replaceCapability}","categories":[...]} and include the complete intended inventory.\n`
        : 'Full inventory replacement is disabled this turn. Use patch operations only.\n';
    return `<InventoryState>\n${formatInventoryState(state)}\n</InventoryState>\n\n` +
`InventoryState is the sole authoritative current possession record. Earlier story mentions are historical and never restore absent items, old quantities, categories, or remarks.\n` +
`Entries are Name | Quantity | Remark under free-form categories. Follow explicit OOC inventory administration such as creating party-member categories or consolidating supplies.\n` +
`Never print <Inventory> or a visible inventory list. If nothing changes, emit no inventory control.\n` +
`For ordinary gameplay changes append exactly one machine-only comment at the very end of the reply, with no prose after it:\n` +
`<!-- ${UPDATE_COMMENT_MARKER}\n{"mode":"patch","ops":[...]}\n-->\n` +
`Ops: add_category{name}; rename_category{category,name}; delete_category{category,confirm?}; add_item{category,name,quantity,remark}; set_item{category,name,quantity?,remark?}; adjust_item{category,name,by}; edit_item{category,name,newName?,quantity?,remark?}; delete_item{category,name}; move_item{fromCategory,toCategory,name}.\n` +
`Deleting a non-empty category requires confirm:"delete-items" and should only be used when the user's intent clearly includes deleting its contents.\n` +
`Numeric quantities must stay above zero; when they reach zero the item is deleted. Use adjust_item only when Quantity itself is a plain number. If the meaningful amount is in Remark (for example Food | 1 | 8 days or Coin Pouch | 1 | 400 Gold), use edit_item instead.\n` +
replaceRule +
`Do not mention the machine control in prose.`;
}

function seedCategoryMarker(line) {
    const text = String(line ?? '').trim();
    if (text.startsWith('[') && text.endsWith(']')) {
        const inner = text.slice(1, -1);
        let escaped = false;
        for (let i = 0; i < inner.length; i++) {
            if (escaped) escaped = false;
            else if (inner[i] === '\\') escaped = true;
            else if (inner[i] === ']') return null;
        }
        return seedUnescape(inner).trim();
    }
    const bare = text.match(/^--\s*(.+?)\s*--$/);
    if (bare) return bare[1].trim();
    const cells = splitSeedCells(line);
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

function tidyMessage(text) {
    return String(text ?? '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function seedMatches(source) {
    return [...String(source ?? '').matchAll(/<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>/gi)];
}

export function consumeInventorySeed(messageText) {
    const source = String(messageText ?? '');
    const matches = seedMatches(source);
    const allOpens = [...source.matchAll(/<Inventory\b[^>]*>/gi)];
    if (!matches.length) {
        const open = source.search(/<Inventory\b[^>]*>/i);
        if (open < 0) return { found: false, cleanedText: source, state: null, errors: [] };
        return {
            found: true,
            cleanedText: tidyMessage(source.slice(0, open)),
            state: null,
            errors: ['The <Inventory> seed was truncated and was discarded.'],
        };
    }
    if (matches.length !== 1 || allOpens.length !== 1) {
        const stripped = stripReservedInventorySeed(source);
        return {
            found: true,
            cleanedText: stripped.cleanedText,
            state: null,
            errors: ['Exactly one <Inventory> seed block is allowed in the first message; all seed blocks were discarded.'],
        };
    }

    const closed = matches[0];
    const categories = [];
    let current = null;
    const meaningfulLines = String(closed[1] ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const rawLine of meaningfulLines) {
        const marker = seedCategoryMarker(rawLine);
        if (marker) {
            current = ensureSeedCategory(categories, marker);
            continue;
        }
        const cells = splitSeedCells(rawLine);
        if (isSeedTableSeparator(cells) || isSeedTableHeader(cells) || cells.length < 2) continue;
        const name = String(cells[0] ?? '').trim();
        if (!name) continue;
        if (!current) current = ensureSeedCategory(categories, ROOT_CATEGORY);
        current.items.push({ name, quantity: normalizeQuantity(cells[1]), remark: cells.slice(2).join(' | ').trim() });
    }

    const start = closed.index ?? 0;
    const cleanedText = tidyMessage(`${source.slice(0, start)}${source.slice(start + closed[0].length)}`);
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
    return { found, truncated, cleanedText: tidyMessage(cleaned) };
}

function findCategory(state, name) {
    const canonical = canonicalCategoryName(name);
    return state.categories.find(category => sameName(category.name, canonical)) ?? null;
}

function requireCategory(state, name) {
    const clean = categoryArgument(name);
    const category = findCategory(state, clean);
    if (!category) throw new Error(`Unknown inventory category: ${clean}`);
    return category;
}

function ensureCategory(state, name) {
    const clean = name === undefined || name === null || name === '' ? ROOT_CATEGORY : categoryArgument(name);
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
    if (typeof op?.name !== 'string') throw new Error('Inventory item name must be a string.');
    assertScalarText(op?.quantity, 'Inventory quantity');
    assertScalarText(op?.remark, 'Inventory remark');
    const name = op.name.trim();
    if (!name) throw new Error('Inventory item name is required.');
    return { name, quantity: normalizeQuantity(op?.quantity), remark: cleanRemark(op?.remark) };
}

function quantityWouldDelete(value) {
    const number = numericQuantity(value);
    return number !== null && number <= 0;
}

function applyPatchOperation(state, op) {
    if (!op || typeof op !== 'object' || Array.isArray(op)) throw new Error('Inventory operation must be an object.');
    switch (op.op) {
        case 'add_category': {
            if (typeof op.name !== 'string') throw new Error('Category name must be a string.');
            const name = canonicalCategoryName(op.name);
            if (!name) throw new Error('Category name is required.');
            if (findCategory(state, name)) throw new Error(`Category already exists: ${name}`);
            state.categories.push({ name, items: [] });
            return;
        }
        case 'rename_category': {
            const category = requireCategory(state, op.category);
            if (typeof op.name !== 'string') throw new Error('New category name must be a string.');
            const name = canonicalCategoryName(op.name);
            if (!name) throw new Error('New category name is required.');
            const duplicate = findCategory(state, name);
            if (duplicate && duplicate !== category) throw new Error(`Category already exists: ${name}`);
            category.name = name;
            return;
        }
        case 'delete_category': {
            const category = requireCategory(state, op.category);
            if (category.items.length && op.confirm !== 'delete-items') {
                throw new Error(`Category "${category.name}" is not empty; delete_category requires confirm:"delete-items" to remove its items.`);
            }
            state.categories = state.categories.filter(entry => entry !== category);
            return;
        }
        case 'add_item': {
            const category = ensureCategory(state, op.category);
            const item = normalizedItemFromOp(op);
            const index = findItemIndex(category, item.name);
            const added = numericQuantity(item.quantity);
            if (index < 0) {
                if (added !== null && added <= 0) throw new Error(`Cannot add ${item.name} with a non-positive numeric quantity.`);
                category.items.push(item);
                return;
            }
            const existing = category.items[index];
            const current = numericQuantity(existing.quantity);
            if (current === null || added === null || added <= 0) {
                throw new Error(`Item already exists and quantity is not safely additive: ${item.name}`);
            }
            existing.quantity = String(current + added);
            if (Object.hasOwn(op, 'remark') && item.remark) existing.remark = item.remark;
            return;
        }
        case 'set_item': {
            const category = ensureCategory(state, op.category);
            if (typeof op?.name !== 'string') throw new Error('Inventory item name must be a string.');
            const name = op.name.trim();
            if (!name) throw new Error('Inventory item name is required.');
            const index = findItemIndex(category, name);
            if (Object.hasOwn(op, 'quantity')) assertScalarText(op.quantity, 'Inventory quantity');
            if (Object.hasOwn(op, 'remark')) assertScalarText(op.remark, 'Inventory remark');
            if (index < 0) {
                const quantity = Object.hasOwn(op, 'quantity') ? normalizeQuantity(op.quantity) : '';
                if (quantityWouldDelete(quantity)) throw new Error(`Cannot create ${name} with a non-positive numeric quantity.`);
                category.items.push({
                    name,
                    quantity,
                    remark: Object.hasOwn(op, 'remark') ? cleanRemark(op.remark) : '',
                });
            } else {
                const existing = category.items[index];
                if (Object.hasOwn(op, 'quantity')) {
                    const quantity = normalizeQuantity(op.quantity);
                    if (quantityWouldDelete(quantity)) {
                        category.items.splice(index, 1);
                        return;
                    }
                    existing.quantity = quantity;
                }
                if (Object.hasOwn(op, 'remark')) existing.remark = cleanRemark(op.remark);
            }
            return;
        }
        case 'adjust_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const existing = category.items[index];
            const current = numericQuantity(existing.quantity);
            if (current === null) throw new Error(`Cannot numerically adjust non-numeric quantity for ${existing.name}.`);
            const delta = Number(op.by);
            if (!Number.isFinite(delta)) throw new Error(`Invalid quantity adjustment for ${existing.name}.`);
            const result = current + delta;
            if (result <= 0) category.items.splice(index, 1);
            else existing.quantity = String(result);
            return;
        }
        case 'edit_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const item = category.items[index];
            if (Object.hasOwn(op, 'quantity')) assertScalarText(op.quantity, 'Inventory quantity');
            if (Object.hasOwn(op, 'remark')) assertScalarText(op.remark, 'Inventory remark');
            if (Object.hasOwn(op, 'newName')) {
                if (typeof op.newName !== 'string') throw new Error('New item name must be a string.');
                const newName = op.newName.trim();
                if (!newName) throw new Error('New item name cannot be blank.');
                assertNoItemCollision(category, newName, index);
                item.name = newName;
            }
            if (Object.hasOwn(op, 'quantity')) {
                const quantity = normalizeQuantity(op.quantity);
                if (quantityWouldDelete(quantity)) {
                    category.items.splice(index, 1);
                    return;
                }
                item.quantity = quantity;
            }
            if (Object.hasOwn(op, 'remark')) item.remark = cleanRemark(op.remark);
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

function applyPayload(baseState, payload, { replaceCapability = null } = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Inventory update payload must be a JSON object.');
    if (payload.mode === 'replace') {
        if (!replaceCapability || payload.replaceToken !== replaceCapability) {
            throw new Error('Full inventory replacement was not authorized for this generation.');
        }
        return validateAndNormalizeInventory({ categories: payload.categories });
    }
    if (payload.mode !== 'patch') throw new Error(`Unsupported inventory update mode: ${payload.mode}`);
    if (!Array.isArray(payload.ops)) throw new Error('Patch update requires an ops array.');
    if (payload.ops.length > LIMITS.patchOps) throw new Error(`Patch update has too many operations (${payload.ops.length}; maximum ${LIMITS.patchOps}).`);
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

export function hasCompleteInventoryUpdate(text) {
    const source = String(text ?? '');
    const comment = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\s*[\\s\\S]*?-->`, 'i');
    const tag = new RegExp(`<${UPDATE_TAG}\\b[^>]*>[\\s\\S]*?<\\/${UPDATE_TAG}\\s*>`, 'i');
    return comment.test(source) || tag.test(source);
}

function collectControls(source) {
    const controls = [];
    const commentRe = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\s*([\\s\\S]*?)-->`, 'gi');
    const tagRe = new RegExp(`<${UPDATE_TAG}\\b[^>]*>([\\s\\S]*?)<\\/${UPDATE_TAG}\\s*>`, 'gi');
    for (const match of source.matchAll(commentRe)) controls.push({ body: match[1], index: match.index ?? 0, length: match[0].length });
    for (const match of source.matchAll(tagRe)) controls.push({ body: match[1], index: match.index ?? 0, length: match[0].length });
    return controls.sort((a, b) => a.index - b.index);
}

export function consumeInventoryUpdates(messageText, baseState, { replaceCapability = null } = {}) {
    const source = String(messageText ?? '');
    const controls = collectControls(source);
    let cleaned = source;
    for (let i = controls.length - 1; i >= 0; i--) {
        const control = controls[i];
        cleaned = `${cleaned.slice(0, control.index)}${cleaned.slice(control.index + control.length)}`;
    }

    let truncated = false;
    const commentCut = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}[\\s\\S]*$`, 'i');
    if (commentCut.test(cleaned)) { cleaned = cleaned.replace(commentCut, ''); truncated = true; }
    const tagCut = new RegExp(`<${UPDATE_TAG}\\b[^>]*>[\\s\\S]*$`, 'i');
    if (tagCut.test(cleaned)) { cleaned = cleaned.replace(tagCut, ''); truncated = true; }
    cleaned = tidyMessage(cleaned);

    const errors = [];
    if (truncated) errors.push('Inventory control record was truncated and discarded.');
    if (controls.length > 1) errors.push('Multiple inventory control records were emitted; all were discarded.');
    if (controls.length === 1) {
        const control = controls[0];
        const trailing = source.slice(control.index + control.length);
        if (trailing.trim()) errors.push('Inventory control must be the final non-whitespace content in the response.');
    }
    if (controls.length === 0 || errors.length) {
        return { cleanedText: cleaned, state: normalizeInventory(baseState), changed: false, hadControl: controls.length > 0 || truncated, errors, note: '' };
    }

    let working = normalizeInventory(baseState);
    let payload = null;
    try {
        if (String(controls[0].body ?? '').length > LIMITS.controlChars) throw new Error(`Inventory control exceeds ${LIMITS.controlChars.toLocaleString()} characters.`);
        payload = JSON.parse(stripFence(controls[0].body));
        working = applyPayload(working, payload, { replaceCapability });
    } catch (error) {
        errors.push(...(error.validationErrors ?? [error instanceof Error ? error.message : String(error)]));
        working = normalizeInventory(baseState);
    }

    const changed = errors.length === 0 && JSON.stringify(working) !== JSON.stringify(normalizeInventory(baseState));
    const note = payload?.mode === 'replace' ? 'LLM inventory replacement' : `LLM inventory update (${Array.isArray(payload?.ops) ? payload.ops.length : 0} operations)`;
    return { cleanedText: cleaned, state: working, changed, hadControl: true, errors, note, mode: payload?.mode ?? null };
}
