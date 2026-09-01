import { LIMITS, ROOT_CATEGORY, SEED_TAG, UPDATE_COMMENT_MARKER, UPDATE_TAG } from './constants.js';
import {
    canonicalCategoryName,
    normalizeInventory,
    normalizeQuantity,
    validateAndNormalizeInventory,
} from './state.js';

const clone = value => structuredClone(value);
const NUMERIC_QUANTITY = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const CONTROL_SENTINEL = '.';

function oneLine(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function promptCell(value) {
    return oneLine(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\{/g, '&#123;')
        .replace(/\}/g, '&#125;')
        .replace(/\[/g, '&#91;')
        .replace(/\]/g, '&#93;')
        .replace(/\|/g, '∣');
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

function stringArgument(value, label) {
    if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
    const clean = value.trim();
    if (!clean) throw new Error(`${label} is required.`);
    return clean;
}

function numericQuantity(value) {
    const text = normalizeQuantity(value);
    return NUMERIC_QUANTITY.test(text) ? Number(text) : null;
}

function numericDelta(value, label = 'Quantity adjustment') {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
        return value;
    }
    if (typeof value !== 'string') throw new Error(`${label} must be a number or numeric string.`);
    const clean = value.trim();
    if (!NUMERIC_QUANTITY.test(clean)) throw new Error(`${label} must be a plain number.`);
    const number = Number(clean);
    if (!Number.isFinite(number)) throw new Error(`${label} must be a finite number.`);
    return number;
}

function categoryArgument(value, label = 'Inventory category') {
    const clean = canonicalCategoryName(stringArgument(value, label));
    if (!clean) throw new Error(`${label} is required.`);
    return clean;
}

function seedEscape(value, { bracket = false } = {}) {
    let text = oneLine(value)
        .replace(/\\/g, '\\\\')
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/\|/g, '\\|');
    if (bracket) text = text.replace(/\]/g, '\\]');
    return text;
}

function seedUnescape(value) {
    const source = String(value ?? '');
    let result = '';
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char !== '\\') {
            result += char;
            continue;
        }
        const next = source[i + 1];
        if (next === undefined) {
            result += '\\';
            continue;
        }
        if (next === 'u') {
            const code = source.slice(i + 2, i + 6).toLocaleUpperCase();
            if (code === '003C' || code === '003E') {
                result += String.fromCharCode(Number.parseInt(code, 16));
                i += 5;
                continue;
            }
        }
        if (['\\', '|', ']'].includes(next)) {
            result += next;
            i += 1;
            continue;
        }
        // Unknown manual escapes are literal. Serializer-produced backslashes are
        // doubled, so preserving the slash here is both safe and lossless.
        result += '\\';
    }
    return result;
}

function splitSeedCells(line) {
    let text = String(line ?? '').trim();
    if (text.startsWith('|')) text = text.slice(1);
    const cells = [];
    let current = '';
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === '\\') {
            current += char;
            escaped = true;
            continue;
        }
        if (char === '|') {
            cells.push(seedUnescape(current.trim()));
            current = '';
            continue;
        }
        current += char;
    }
    cells.push(seedUnescape(current.trim()));
    if (cells.length > 1 && cells.at(-1) === '' && !text.endsWith('\\|')) cells.pop();
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
        for (const item of category.items) {
            lines.push(`${promptCell(item.name)} | ${promptCell(item.quantity)} | ${promptCell(item.remark)}`);
        }
    }
    return lines.join('\n');
}

export function formatInventorySeedBlock(state) {
    const inventory = normalizeInventory(state);
    const lines = [`<${SEED_TAG}>`];
    const root = inventory.categories.find(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));
    for (const item of root?.items ?? []) {
        lines.push(`${seedEscape(item.name)} | ${seedEscape(item.quantity)} | ${seedEscape(item.remark)}`);
    }
    sections.forEach(category => {
        if (lines.length > 1 && lines.at(-1) !== '') lines.push('');
        lines.push(`[${seedEscape(category.name, { bracket: true })}]`);
        for (const item of category.items) {
            lines.push(`${seedEscape(item.name)} | ${seedEscape(item.quantity)} | ${seedEscape(item.remark)}`);
        }
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
`For an inventory change, append exactly one machine-only control as the final content of the reply. Put it after a single space on the final line so single-line generation modes can still emit it. The terminal period is mandatory:\n` +
`<!-- ${UPDATE_COMMENT_MARKER} {"mode":"patch","ops":[...]} -->${CONTROL_SENTINEL}\n` +
`If a JSON string would contain the literal sequence -->, encode the > as \\u003e inside that JSON string.\n` +
`Ops: add_category{name}; rename_category{category,name}; delete_category{category,confirm?}; add_item{category,name,quantity,remark}; set_item{category,name,quantity?,remark?}; adjust_item{category,name,by}; edit_item{category,name,newName?,quantity?,remark?}; delete_item{category,name}; move_item{fromCategory,toCategory,name}.\n` +
`Deleting a non-empty category requires confirm:"delete-items" and should only be used when the user's intent clearly includes deleting its contents.\n` +
`Numeric quantities must stay above zero; when they reach zero the item is deleted. Use adjust_item only when Quantity itself is a plain number. If the meaningful amount is in Remark (for example Food | 1 | 8 days or Coin Pouch | 1 | 400 Gold), use edit_item instead.\n` +
replaceRule +
`Do not mention the machine control in prose.`;
}

function seedCategoryMarker(line) {
    const text = String(line ?? '').trim();
    if (!text.startsWith('[') || !text.endsWith(']')) return null;
    const inner = text.slice(1, -1);
    let escaped = false;
    for (let i = 0; i < inner.length; i++) {
        if (escaped) {
            escaped = false;
            continue;
        }
        if (inner[i] === '\\') {
            escaped = true;
            continue;
        }
        if (inner[i] === ']') return null;
    }
    return seedUnescape(inner).trim();
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

function seedMatches(source) {
    return [...String(source ?? '').matchAll(/<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>/gi)];
}

function removeSpans(source, spans) {
    if (!spans.length) return source;
    let result = source;
    const ordered = [...spans].sort((a, b) => b.index - a.index);
    for (const span of ordered) {
        result = `${result.slice(0, span.index)}${result.slice(span.index + span.length)}`;
    }
    return result;
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
            cleanedText: source.slice(0, open),
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
            errors: ['Exactly one <Inventory> seed block is allowed for one seed message; all seed blocks were discarded.'],
        };
    }

    const closed = matches[0];
    const categories = [];
    let current = null;
    const meaningfulLines = String(closed[1] ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (const rawLine of meaningfulLines) {
        const marker = seedCategoryMarker(rawLine);
        if (marker !== null) {
            if (!marker) {
                return {
                    found: true,
                    cleanedText: removeSpans(source, [{ index: closed.index ?? 0, length: closed[0].length }]),
                    state: null,
                    errors: ['Inventory category names cannot be blank.'],
                };
            }
            current = ensureSeedCategory(categories, marker);
            continue;
        }
        const cells = splitSeedCells(rawLine);
        if (cells.length < 2) continue;
        const name = String(cells[0] ?? '').trim();
        if (!name) continue;
        if (!current) current = ensureSeedCategory(categories, ROOT_CATEGORY);
        current.items.push({
            name,
            quantity: normalizeQuantity(cells[1]),
            remark: cells.slice(2).join(' | ').trim(),
        });
    }

    const cleanedText = removeSpans(source, [{ index: closed.index ?? 0, length: closed[0].length }]);
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
    const matches = seedMatches(source);
    const spans = matches.map(match => ({ index: match.index ?? 0, length: match[0].length }));
    let cleaned = removeSpans(source, spans);
    let found = spans.length > 0;
    let truncated = false;
    const open = cleaned.search(/<Inventory\b[^>]*>/i);
    if (open >= 0) {
        found = true;
        truncated = true;
        cleaned = cleaned.slice(0, open);
    }
    return { found, truncated, cleanedText: found ? cleaned : source };
}

export function mergeInventoryStates(baseState, addedState) {
    const merged = normalizeInventory(clone(baseState));
    const incoming = validateAndNormalizeInventory(addedState);
    for (const incomingCategory of incoming.categories) {
        let target = merged.categories.find(category => sameName(category.name, incomingCategory.name));
        if (!target) {
            target = { name: incomingCategory.name, items: [] };
            merged.categories.push(target);
        }
        for (const incomingItem of incomingCategory.items) {
            const existing = target.items.find(item => sameName(item.name, incomingItem.name));
            if (!existing) {
                target.items.push(clone(incomingItem));
                continue;
            }
            if (JSON.stringify(existing) !== JSON.stringify(incomingItem)) {
                throw new Error(`Seed merge collision for "${incomingItem.name}" in "${target.name}".`);
            }
        }
    }
    return validateAndNormalizeInventory(merged);
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

function itemArgument(value) {
    return stringArgument(value, 'Inventory item name');
}

function findItemIndex(category, name) {
    const clean = itemArgument(name);
    return category.items.findIndex(item => sameName(item.name, clean));
}

function assertNoItemCollision(category, name, exceptIndex = -1) {
    const clean = itemArgument(name);
    const index = category.items.findIndex(item => sameName(item.name, clean));
    if (index >= 0 && index !== exceptIndex) throw new Error(`Item already exists in "${category.name}": ${clean}`);
}

function normalizedItemFromOp(op) {
    const name = itemArgument(op?.name);
    assertScalarText(op?.quantity, 'Inventory quantity');
    assertScalarText(op?.remark, 'Inventory remark');
    return { name, quantity: normalizeQuantity(op?.quantity), remark: cleanRemark(op?.remark) };
}

function quantityWouldDelete(value) {
    const number = numericQuantity(value);
    return number !== null && number <= 0;
}

function applyPatchOperation(state, op) {
    if (!op || typeof op !== 'object' || Array.isArray(op)) throw new Error('Inventory operation must be an object.');
    if (typeof op.op !== 'string' || !op.op.trim()) throw new Error('Inventory operation requires a string op field.');
    switch (op.op) {
        case 'add_category': {
            const name = categoryArgument(op.name, 'Category name');
            if (findCategory(state, name)) throw new Error(`Category already exists: ${name}`);
            state.categories.push({ name, items: [] });
            return;
        }
        case 'rename_category': {
            const category = requireCategory(state, op.category);
            const name = categoryArgument(op.name, 'New category name');
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
            const name = itemArgument(op.name);
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
            const name = itemArgument(op.name);
            const index = findItemIndex(category, name);
            if (index < 0) throw new Error(`Unknown inventory item: ${name}`);
            const existing = category.items[index];
            const current = numericQuantity(existing.quantity);
            if (current === null) throw new Error(`Cannot numerically adjust non-numeric quantity for ${existing.name}.`);
            const result = current + numericDelta(op.by);
            if (result <= 0) category.items.splice(index, 1);
            else existing.quantity = String(result);
            return;
        }
        case 'edit_item': {
            const category = requireCategory(state, op.category);
            const name = itemArgument(op.name);
            const index = findItemIndex(category, name);
            if (index < 0) throw new Error(`Unknown inventory item: ${name}`);
            const item = category.items[index];
            if (Object.hasOwn(op, 'quantity')) assertScalarText(op.quantity, 'Inventory quantity');
            if (Object.hasOwn(op, 'remark')) assertScalarText(op.remark, 'Inventory remark');
            if (Object.hasOwn(op, 'newName')) {
                const newName = itemArgument(op.newName);
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
            const name = itemArgument(op.name);
            const index = findItemIndex(category, name);
            if (index < 0) throw new Error(`Unknown inventory item: ${name}`);
            category.items.splice(index, 1);
            return;
        }
        case 'move_item': {
            const from = requireCategory(state, op.fromCategory);
            const name = itemArgument(op.name);
            const index = findItemIndex(from, name);
            if (index < 0) throw new Error(`Unknown inventory item: ${name}`);
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
        if (!replaceCapability || typeof payload.replaceToken !== 'string' || payload.replaceToken !== replaceCapability) {
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
    const commentStart = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\b`, 'i').exec(source);
    if (commentStart && source.lastIndexOf('-->') > (commentStart.index ?? -1)) return true;
    const tag = new RegExp(`<${UPDATE_TAG}\\b[^>]*>[\\s\\S]*<\\/${UPDATE_TAG}\\s*>`, 'i');
    return tag.test(source);
}

function consumeCommentControl(source) {
    const markerRe = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\b`, 'gi');
    const starts = [...source.matchAll(markerRe)];
    if (!starts.length) return null;
    const first = starts[0];
    const start = first.index ?? 0;
    if (starts.length > 1) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Multiple inventory control records were emitted; all were discarded.'],
        };
    }
    const openMatch = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\b\\s*`, 'i').exec(source.slice(start));
    const bodyStart = start + (openMatch?.[0].length ?? first[0].length);
    const close = source.lastIndexOf('-->');
    if (close < bodyStart) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Inventory control record was truncated and discarded.'],
        };
    }
    const trailing = source.slice(close + 3);
    if (!/^\s*\.?\s*$/.test(trailing)) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Inventory control must be the final non-whitespace content in the response.'],
        };
    }
    let cleanStart = start;
    if (cleanStart > 0 && source[cleanStart - 1] === ' ') cleanStart -= 1;
    return {
        cleanedText: source.slice(0, cleanStart),
        body: source.slice(bodyStart, close).trim(),
        hadControl: true,
        errors: trailing.includes(CONTROL_SENTINEL) ? [] : ['Inventory control is missing its required terminal period.'],
    };
}

function consumeTagControl(source) {
    const openRe = new RegExp(`<${UPDATE_TAG}\\b[^>]*>`, 'gi');
    const starts = [...source.matchAll(openRe)];
    if (!starts.length) return null;
    const start = starts[0].index ?? 0;
    if (starts.length > 1) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Multiple inventory control records were emitted; all were discarded.'],
        };
    }
    const openLength = starts[0][0].length;
    const closeText = `</${UPDATE_TAG}>`;
    const lower = source.toLocaleLowerCase();
    const close = lower.lastIndexOf(closeText.toLocaleLowerCase());
    if (close < start + openLength) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Inventory control record was truncated and discarded.'],
        };
    }
    const trailing = source.slice(close + closeText.length);
    if (trailing.trim()) {
        return {
            cleanedText: source.slice(0, start),
            body: null,
            hadControl: true,
            errors: ['Inventory control must be the final non-whitespace content in the response.'],
        };
    }
    return {
        cleanedText: source.slice(0, start),
        body: source.slice(start + openLength, close).trim(),
        hadControl: true,
        errors: [],
    };
}

export function consumeInventoryUpdates(messageText, baseState, { replaceCapability = null } = {}) {
    const source = String(messageText ?? '');
    const comment = consumeCommentControl(source);
    const tag = consumeTagControl(source);
    if (comment && tag) {
        const firstStart = Math.min(
            source.search(new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\b`, 'i')),
            source.search(new RegExp(`<${UPDATE_TAG}\\b`, 'i')),
        );
        return {
            cleanedText: source.slice(0, Math.max(0, firstStart)),
            state: normalizeInventory(baseState),
            changed: false,
            hadControl: true,
            errors: ['Multiple inventory control formats were emitted; all were discarded.'],
            note: '',
            mode: null,
        };
    }
    const control = comment ?? tag;
    if (!control) {
        return {
            cleanedText: source,
            state: normalizeInventory(baseState),
            changed: false,
            hadControl: false,
            errors: [],
            note: '',
            mode: null,
        };
    }
    if (control.errors.length || control.body === null) {
        return {
            cleanedText: control.cleanedText,
            state: normalizeInventory(baseState),
            changed: false,
            hadControl: true,
            errors: control.errors,
            note: '',
            mode: null,
        };
    }

    const errors = [];
    let working = normalizeInventory(baseState);
    let payload = null;
    try {
        if (control.body.length > LIMITS.controlChars) throw new Error(`Inventory control exceeds ${LIMITS.controlChars.toLocaleString()} characters.`);
        payload = JSON.parse(stripFence(control.body));
        working = applyPayload(working, payload, { replaceCapability });
    } catch (error) {
        errors.push(...(error.validationErrors ?? [error instanceof Error ? error.message : String(error)]));
        working = normalizeInventory(baseState);
    }

    const changed = errors.length === 0 && JSON.stringify(working) !== JSON.stringify(normalizeInventory(baseState));
    const note = payload?.mode === 'replace'
        ? 'LLM inventory replacement'
        : `LLM inventory update (${Array.isArray(payload?.ops) ? payload.ops.length : 0} operations)`;
    return {
        cleanedText: control.cleanedText,
        state: working,
        changed,
        hadControl: true,
        errors,
        note,
        mode: payload?.mode ?? null,
    };
}
