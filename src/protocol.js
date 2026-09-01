import { normalizeInventory } from './state.js';
import { UPDATE_COMMENT_MARKER, UPDATE_TAG } from './constants.js';

const clone = value => structuredClone(value);
const ROOT_CATEGORY_NAMES = new Set(['general', 'uncategorized']);

function oneLine(value) {
    return String(value ?? '')
        .replace(/\r?\n/g, ' ')
        .replace(/\|/g, '∣')
        .trim();
}

export function isRootCategoryName(name) {
    return ROOT_CATEGORY_NAMES.has(String(name ?? '').trim().toLocaleLowerCase());
}

export function formatInventoryState(state) {
    const inventory = normalizeInventory(state);
    if (!inventory.categories.length) return '(empty)';

    const lines = [];
    for (const category of inventory.categories) {
        lines.push(`[${oneLine(category.name)}]`);
        if (!category.items.length) {
            lines.push('(empty)');
        } else {
            for (const item of category.items) {
                lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
            }
        }
    }
    return lines.join('\n');
}

export function formatInventorySeedBlock(state) {
    const inventory = normalizeInventory(state);
    const lines = ['<Inventory>'];
    const rootCategories = inventory.categories.filter(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));

    for (const category of rootCategories) {
        for (const item of category.items) {
            lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
        }
    }

    sections.forEach((category, index) => {
        if (lines.length > 1 && lines[lines.length - 1] !== '') lines.push('');
        lines.push(`[${oneLine(category.name)}]`);
        for (const item of category.items) {
            lines.push(`${oneLine(item.name)} | ${oneLine(item.quantity)} | ${oneLine(item.remark)}`);
        }
        if (index < sections.length - 1) lines.push('');
    });

    lines.push('</Inventory>');
    return lines.join('\n');
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
    if (!cells.length) return null;
    const tableMarker = cells[0].match(/^--\s*(.+?)\s*--$/);
    if (tableMarker && cells.slice(1).every(cell => !cell)) return tableMarker[1].trim();
    return null;
}

function isSeedTableSeparator(cells) {
    return cells.length > 1 && cells.every(cell => !cell || /^:?-{2,}:?$/.test(cell));
}

function isSeedTableHeader(cells) {
    if (cells.length < 2) return false;
    const first = cells[0].toLocaleLowerCase();
    const second = cells[1].toLocaleLowerCase();
    const third = String(cells[2] ?? '').toLocaleLowerCase();
    return ['item', 'name'].includes(first)
        && ['qty', 'quantity'].includes(second)
        && (!third || ['notes', 'note', 'remark', 'remarks'].includes(third));
}

function ensureSeedCategory(categories, name) {
    const clean = String(name ?? '').trim() || 'General';
    let category = categories.find(entry => entry.name.toLocaleLowerCase() === clean.toLocaleLowerCase());
    if (!category) {
        category = { name: clean, items: [] };
        categories.push(category);
    }
    return category;
}

export function consumeInventorySeed(messageText) {
    const source = String(messageText ?? '');
    const match = source.match(/<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>/i);
    if (!match) {
        return {
            found: false,
            cleanedText: source,
            state: null,
            errors: [],
        };
    }

    const categories = [];
    let current = null;
    const body = String(match[1] ?? '');
    const meaningfulLines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    for (const rawLine of meaningfulLines) {
        const marker = seedCategoryMarker(rawLine);
        if (marker) {
            current = ensureSeedCategory(categories, marker);
            continue;
        }

        const cells = rowCells(rawLine);
        if (isSeedTableSeparator(cells) || isSeedTableHeader(cells)) continue;
        if (cells.length < 2) continue;

        const name = String(cells[0] ?? '').trim();
        if (!name) continue;
        const quantity = String(cells[1] ?? '').trim();
        const remark = cells.slice(2).join(' | ').trim();
        if (!current) current = ensureSeedCategory(categories, 'General');
        current.items.push({ name, quantity, remark });
    }

    const state = normalizeInventory({ categories });
    if (meaningfulLines.length && !state.categories.some(category => category.items.length)) {
        return {
            found: true,
            cleanedText: source,
            state: null,
            errors: ['The <Inventory> seed was found, but no valid Name | Quantity | Remark rows could be parsed.'],
        };
    }

    const cleanedText = `${source.slice(0, match.index)}${source.slice((match.index ?? 0) + match[0].length)}`
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd();

    return {
        found: true,
        cleanedText,
        state,
        errors: [],
    };
}

export function buildInventoryPrompt(state) {
    return `<InventoryState>\n${formatInventoryState(state)}\n</InventoryState>\n\n` +
`The InventoryState above is the sole authoritative record of current possession. Earlier inventory references in chat are historical and must not restore absent items, old quantities, old categories, or old remarks. Manual edits may intentionally supersede earlier narration.\n\n` +
`Inventory entries use only Name | Quantity | Remark under free-form categories. You may create, rename, merge, remove, or reorganize categories when the user's instruction calls for it. You may consolidate related entries into an aggregate entry and preserve useful composition, remaining uses, duration, ownership, or condition in Remark.\n\n` +
`Do not print a visible inventory list. If inventory genuinely changes during this response, or the user explicitly asks you to administer/reorganize inventory, append exactly one hidden control comment at the very end of the response:\n` +
`<!-- ${UPDATE_COMMENT_MARKER}\n{\"mode\":\"patch\",\"ops\":[...]}\n-->\n\n` +
`Patch operations:\n` +
`{\"op\":\"add_category\",\"name\":\"...\"}\n` +
`{\"op\":\"rename_category\",\"category\":\"old\",\"name\":\"new\"}\n` +
`{\"op\":\"delete_category\",\"category\":\"...\"}\n` +
`{\"op\":\"add_item\",\"category\":\"...\",\"name\":\"...\",\"quantity\":\"...\",\"remark\":\"...\"}\n` +
`{\"op\":\"set_item\",\"category\":\"...\",\"name\":\"...\",\"quantity\":\"...\",\"remark\":\"...\"}\n` +
`{\"op\":\"adjust_item\",\"category\":\"...\",\"name\":\"...\",\"by\":-1}\n` +
`{\"op\":\"edit_item\",\"category\":\"...\",\"name\":\"...\",\"newName\":\"...\",\"quantity\":\"...\",\"remark\":\"...\"}\n` +
`{\"op\":\"delete_item\",\"category\":\"...\",\"name\":\"...\"}\n` +
`{\"op\":\"move_item\",\"fromCategory\":\"...\",\"toCategory\":\"...\",\"name\":\"...\"}\n\n` +
`For broad semantic cleanup or reorganization, prefer one atomic replacement instead of many small operations:\n` +
`<!-- ${UPDATE_COMMENT_MARKER}\n{\"mode\":\"replace\",\"categories\":[{\"name\":\"Category\",\"items\":[{\"name\":\"Item\",\"quantity\":\"1\",\"remark\":\"...\"}]}]}\n-->\n\n` +
`The control comment is machine-only. Do not mention it in prose. If nothing changes, emit no inventory control comment.`;
}

function findCategory(state, name) {
    const needle = String(name ?? '').trim().toLocaleLowerCase();
    return state.categories.find(category => category.name.toLocaleLowerCase() === needle) ?? null;
}

function requireCategory(state, name) {
    const category = findCategory(state, name);
    if (!category) throw new Error(`Unknown inventory category: ${name}`);
    return category;
}

function ensureCategory(state, name) {
    const clean = String(name ?? '').trim() || 'Uncategorized';
    let category = findCategory(state, clean);
    if (!category) {
        category = { name: clean, items: [] };
        state.categories.push(category);
    }
    return category;
}

function findItemIndex(category, name) {
    const needle = String(name ?? '').trim().toLocaleLowerCase();
    return category.items.findIndex(item => item.name.toLocaleLowerCase() === needle);
}

function normalizeItemFromOp(op) {
    const name = String(op?.name ?? '').trim();
    if (!name) throw new Error('Inventory item name is required.');
    return {
        name,
        quantity: String(op?.quantity ?? '').replace(/\r?\n/g, ' ').trim(),
        remark: String(op?.remark ?? '').replace(/\r?\n/g, ' ').trim(),
    };
}

function applyPatchOperation(state, op) {
    if (!op || typeof op !== 'object') throw new Error('Inventory operation must be an object.');

    switch (op.op) {
        case 'add_category': {
            ensureCategory(state, op.name);
            return;
        }
        case 'rename_category': {
            const category = requireCategory(state, op.category);
            const nextName = String(op.name ?? '').trim();
            if (!nextName) throw new Error('New category name is required.');
            const duplicate = findCategory(state, nextName);
            if (duplicate && duplicate !== category) throw new Error(`Category already exists: ${nextName}`);
            category.name = nextName;
            return;
        }
        case 'delete_category': {
            const category = requireCategory(state, op.category);
            state.categories = state.categories.filter(entry => entry !== category);
            return;
        }
        case 'add_item': {
            const category = ensureCategory(state, op.category);
            const item = normalizeItemFromOp(op);
            const index = findItemIndex(category, item.name);
            if (index < 0) {
                category.items.push(item);
                return;
            }

            const existing = category.items[index];
            const current = Number(existing.quantity);
            const added = Number(item.quantity);
            if (Number.isFinite(current) && Number.isFinite(added) && String(existing.quantity).trim() !== '' && String(item.quantity).trim() !== '') {
                existing.quantity = String(current + added);
                if (item.remark) existing.remark = item.remark;
                return;
            }
            throw new Error(`Item already exists and quantity is not safely additive: ${item.name}`);
        }
        case 'set_item': {
            const category = ensureCategory(state, op.category);
            const item = normalizeItemFromOp(op);
            const index = findItemIndex(category, item.name);
            if (index < 0) category.items.push(item);
            else category.items[index] = item;
            return;
        }
        case 'adjust_item': {
            const category = requireCategory(state, op.category);
            const index = findItemIndex(category, op.name);
            if (index < 0) throw new Error(`Unknown inventory item: ${op.name}`);
            const existing = category.items[index];
            const current = Number(existing.quantity);
            const delta = Number(op.by);
            if (!Number.isFinite(current) || String(existing.quantity).trim() === '' || !Number.isFinite(delta)) {
                throw new Error(`Cannot numerically adjust quantity for ${existing.name}.`);
            }
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
            if (Object.hasOwn(op, 'newName')) {
                const newName = String(op.newName ?? '').trim();
                if (!newName) throw new Error('New item name cannot be blank.');
                item.name = newName;
            }
            if (Object.hasOwn(op, 'quantity')) item.quantity = String(op.quantity ?? '').replace(/\r?\n/g, ' ').trim();
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
            const [item] = from.items.splice(index, 1);
            ensureCategory(state, op.toCategory).items.push(item);
            return;
        }
        default:
            throw new Error(`Unsupported inventory operation: ${op.op}`);
    }
}

function applyPayload(baseState, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Inventory update payload must be a JSON object.');
    }

    if (payload.mode === 'replace') {
        return normalizeInventory({ categories: payload.categories });
    }

    if (payload.mode === 'patch') {
        if (!Array.isArray(payload.ops)) throw new Error('Patch update requires an ops array.');
        const state = normalizeInventory(clone(baseState));
        for (const op of payload.ops) applyPatchOperation(state, op);
        return normalizeInventory(state);
    }

    throw new Error(`Unsupported inventory update mode: ${payload.mode}`);
}

function stripFence(text) {
    return String(text ?? '')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
}

export function consumeInventoryUpdates(messageText, baseState) {
    let cleaned = String(messageText ?? '');
    const payloadTexts = [];

    const commentRe = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}\\s*([\\s\\S]*?)-->`, 'gi');
    cleaned = cleaned.replace(commentRe, (_whole, body) => {
        payloadTexts.push(body);
        return '';
    });

    const tagRe = new RegExp(`<${UPDATE_TAG}\\b[^>]*>([\\s\\S]*?)<\\/${UPDATE_TAG}\\s*>`, 'gi');
    cleaned = cleaned.replace(tagRe, (_whole, body) => {
        payloadTexts.push(body);
        return '';
    });

    let truncated = false;
    const commentCut = new RegExp(`<!--\\s*${UPDATE_COMMENT_MARKER}[\\s\\S]*$`, 'i');
    if (commentCut.test(cleaned)) {
        cleaned = cleaned.replace(commentCut, '');
        truncated = true;
    }
    const tagCut = new RegExp(`<${UPDATE_TAG}\\b[^>]*>[\\s\\S]*$`, 'i');
    if (tagCut.test(cleaned)) {
        cleaned = cleaned.replace(tagCut, '');
        truncated = true;
    }

    cleaned = cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd();

    if (!payloadTexts.length) {
        return {
            cleanedText: cleaned,
            state: normalizeInventory(baseState),
            changed: false,
            hadControl: truncated,
            errors: truncated ? ['Inventory control record was truncated and was discarded.'] : [],
            note: '',
        };
    }

    const errors = [];
    let working = normalizeInventory(baseState);
    let operationCount = 0;
    let replaceCount = 0;

    try {
        for (const payloadText of payloadTexts) {
            const payload = JSON.parse(stripFence(payloadText));
            if (payload.mode === 'replace') replaceCount++;
            if (Array.isArray(payload.ops)) operationCount += payload.ops.length;
            working = applyPayload(working, payload);
        }
    } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
        working = normalizeInventory(baseState);
    }

    if (truncated) errors.push('A second/trailing inventory control record was truncated and discarded.');

    const changed = errors.length === 0 && JSON.stringify(working) !== JSON.stringify(normalizeInventory(baseState));
    const note = replaceCount
        ? 'LLM inventory replacement'
        : operationCount
            ? `LLM inventory update (${operationCount} operation${operationCount === 1 ? '' : 's'})`
            : 'LLM inventory update';

    return {
        cleanedText: cleaned,
        state: working,
        changed,
        hadControl: true,
        errors,
        note,
    };
}
