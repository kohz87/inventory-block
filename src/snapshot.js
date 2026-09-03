export const INVENTORY_TAG = 'Inventory';
export const ROOT_CATEGORY = 'General';
export const TRANSPORT_MARKER = 'INVENTORY_BLOCK_V05';

const COMPLETE_BLOCK = /<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>/gi;
const TRANSPORT_BLOCK = /<!--\s*INVENTORY_BLOCK_V05\b[\s\S]*?-->/gi;

function clean(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function key(value) {
    return clean(value).normalize('NFKC').toLowerCase();
}

export function emptyInventory() {
    return { categories: [] };
}

export function normalizeInventory(input) {
    const result = emptyInventory();
    const categories = Array.isArray(input?.categories) ? input.categories : [];
    let root = null;
    for (const category of categories) {
        const name = clean(category?.name) || ROOT_CATEGORY;
        const items = Array.isArray(category?.items) ? category.items : [];
        const normalized = items
            .map(item => ({
                name: clean(item?.name),
                quantity: clean(item?.quantity),
                remark: clean(item?.remark),
            }))
            .filter(item => item.name);
        if (key(name) === key(ROOT_CATEGORY)) {
            root ??= { name: ROOT_CATEGORY, items: [] };
            if (!result.categories.includes(root)) result.categories.unshift(root);
            root.items.push(...normalized);
        } else {
            result.categories.push({ name, items: normalized });
        }
    }
    return result;
}

function splitRow(line) {
    const cells = [];
    let current = '';
    let escaped = false;
    for (const char of String(line ?? '')) {
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === '\\') {
            escaped = true;
            continue;
        }
        if (char === '|') {
            cells.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (escaped) current += '\\';
    cells.push(current.trim());
    return cells;
}

function escapeCell(value) {
    return clean(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

function validateInventory(state) {
    const inventory = normalizeInventory(state);
    const categoryKeys = new Set();
    for (const category of inventory.categories) {
        const categoryKey = key(category.name);
        if (categoryKeys.has(categoryKey)) throw new Error(`Duplicate Inventory category: ${category.name}`);
        categoryKeys.add(categoryKey);
        const itemKeys = new Set();
        for (const item of category.items) {
            const itemKey = key(item.name);
            if (itemKeys.has(itemKey)) throw new Error(`Duplicate Inventory item in ${category.name}: ${item.name}`);
            itemKeys.add(itemKey);
        }
    }
    return inventory;
}

export function parseInventoryBody(body) {
    const categories = [];
    let current = null;
    const ensureRoot = () => {
        current = categories.find(category => key(category.name) === key(ROOT_CATEGORY));
        if (!current) {
            current = { name: ROOT_CATEGORY, items: [] };
            categories.unshift(current);
        }
        return current;
    };

    const lines = String(body ?? '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith('[') && line.endsWith(']')) {
            const name = clean(line.slice(1, -1));
            if (!name) throw new Error(`Inventory category on line ${i + 1} is blank.`);
            current = { name, items: [] };
            categories.push(current);
            continue;
        }
        const cells = splitRow(line);
        if (cells.length < 2 || cells.length > 3 || !clean(cells[0])) {
            throw new Error(`Inventory row ${i + 1} must be Name | Quantity | Remark.`);
        }
        if (!current) ensureRoot();
        current.items.push({
            name: clean(cells[0]),
            quantity: clean(cells[1]),
            remark: clean(cells[2] ?? ''),
        });
    }
    return validateInventory({ categories });
}

export function parseInventoryBlock(blockText) {
    const match = /^\s*<Inventory\b[^>]*>([\s\S]*?)<\/Inventory\s*>\s*$/i.exec(String(blockText ?? ''));
    if (!match) throw new Error('Expected exactly one complete <Inventory>...</Inventory> block.');
    return parseInventoryBody(match[1]);
}

export function formatInventoryBlock(state) {
    const inventory = validateInventory(state);
    const lines = ['<Inventory>'];
    const root = inventory.categories.find(category => key(category.name) === key(ROOT_CATEGORY));
    const sections = inventory.categories.filter(category => key(category.name) !== key(ROOT_CATEGORY));
    for (const item of root?.items ?? []) {
        lines.push(`${escapeCell(item.name)} | ${escapeCell(item.quantity)} | ${escapeCell(item.remark)}`);
    }
    for (const category of sections) {
        if (lines.length > 1 && lines.at(-1) !== '') lines.push('');
        lines.push(`[${clean(category.name).replace(/\]/g, '\\]')}]`);
        for (const item of category.items) {
            lines.push(`${escapeCell(item.name)} | ${escapeCell(item.quantity)} | ${escapeCell(item.remark)}`);
        }
    }
    lines.push('</Inventory>');
    return lines.join('\n');
}

export function formatInventoryTransport(state) {
    return `<!-- ${TRANSPORT_MARKER}\n${formatInventoryBlock(state)}\n-->`;
}

function transportRanges(source) {
    const ranges = [];
    for (const match of String(source ?? '').matchAll(TRANSPORT_BLOCK)) {
        const start = match.index ?? 0;
        ranges.push({ start, end: start + match[0].length, raw: match[0] });
    }
    return ranges;
}

export function inventoryBlocks(text) {
    const source = String(text ?? '');
    const transports = transportRanges(source);
    const blocks = [];
    for (const match of source.matchAll(COMPLETE_BLOCK)) {
        const raw = match[0];
        const start = match.index ?? 0;
        const end = start + raw.length;
        const transport = transports.find(range => range.start <= start && range.end >= end) ?? null;
        let state = null;
        let error = null;
        try { state = parseInventoryBody(match[1]); }
        catch (caught) { error = caught instanceof Error ? caught : new Error(String(caught)); }
        blocks.push({
            start,
            end,
            raw,
            state,
            error,
            hidden: Boolean(transport),
            transportStart: transport?.start ?? null,
            transportEnd: transport?.end ?? null,
        });
    }
    return blocks;
}

export function latestValidInventoryInText(text) {
    const blocks = inventoryBlocks(text);
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].state) return blocks[i];
    }
    return null;
}

export function latestInventorySnapshot(chat, { beforeIndex = null } = {}) {
    const list = Array.isArray(chat) ? chat : [];
    const end = beforeIndex === null ? list.length : Math.max(0, Math.min(list.length, Number(beforeIndex) || 0));
    for (let messageIndex = end - 1; messageIndex >= 0; messageIndex--) {
        const message = list[messageIndex];
        if (!message || message.is_user || message.is_system) continue;
        const block = latestValidInventoryInText(message.mes);
        if (block) return { ...block, messageIndex, message };
    }
    return null;
}

export function latestAssistantIndex(chat) {
    const list = Array.isArray(chat) ? chat : [];
    for (let i = list.length - 1; i >= 0; i--) {
        const message = list[i];
        if (message && !message.is_user && !message.is_system) return i;
    }
    return -1;
}

export function inventoryForGeneration(chat, type = 'normal') {
    const lower = String(type ?? 'normal').toLowerCase();
    if (lower.includes('first_message')) return emptyInventory();
    if (lower.includes('regenerate') || lower === 'swipe' || lower.includes('swipe')) {
        const target = latestAssistantIndex(chat);
        return normalizeInventory(latestInventorySnapshot(chat, { beforeIndex: target })?.state ?? emptyInventory());
    }
    return normalizeInventory(latestInventorySnapshot(chat)?.state ?? emptyInventory());
}

function trailingTruncatedInventoryStart(text) {
    const source = String(text ?? '');
    const lower = source.toLowerCase();
    const open = lower.lastIndexOf('<inventory');
    const close = lower.lastIndexOf('</inventory');
    return open >= 0 && open > close ? open : -1;
}

function removeTrailingTruncatedInventory(text) {
    const source = String(text ?? '');
    const open = trailingTruncatedInventoryStart(source);
    return open >= 0 ? source.slice(0, open).trimEnd() : source;
}

export function stripInventoryBlocks(text, { stripTrailingTruncated = true } = {}) {
    let source = String(text ?? '').replace(TRANSPORT_BLOCK, '').replace(COMPLETE_BLOCK, '');
    if (stripTrailingTruncated) source = removeTrailingTruncatedInventory(source);
    return source;
}

export function normalizeInventoryTransports(text) {
    const original = String(text ?? '');
    let source = original;
    const blocks = inventoryBlocks(source);
    const plain = blocks.filter(block => !block.hidden);
    for (let i = plain.length - 1; i >= 0; i--) {
        const block = plain[i];
        const wrapped = `<!-- ${TRANSPORT_MARKER}\n${block.raw}\n-->`;
        source = `${source.slice(0, block.start)}${wrapped}${source.slice(block.end)}`;
    }

    const truncatedStart = trailingTruncatedInventoryStart(source);
    if (truncatedStart >= 0) {
        const transports = transportRanges(source);
        const alreadyHidden = transports.some(range => range.start <= truncatedStart && range.end > truncatedStart);
        if (!alreadyHidden) {
            const truncated = source.slice(truncatedStart);
            source = `${source.slice(0, truncatedStart)}<!-- ${TRANSPORT_MARKER}\n${truncated}\n-->`;
        }
    }

    return { text: source, changed: source !== original };
}

export function replaceOrAppendInventory(text, state) {
    const transport = formatInventoryTransport(state);
    let source = removeTrailingTruncatedInventory(text);
    const blocks = inventoryBlocks(source);
    if (blocks.length) {
        const target = blocks.at(-1);
        const start = target.transportStart ?? target.start;
        const end = target.transportEnd ?? target.end;
        return `${source.slice(0, start)}${transport}${source.slice(end)}`;
    }
    source = source.trimEnd();
    return source ? `${source}\n\n${transport}` : transport;
}

export function syncActiveSwipeText(message) {
    if (!message || !Array.isArray(message.swipes)) return;
    const swipe = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
    if (swipe >= 0 && swipe < message.swipes.length) message.swipes[swipe] = String(message.mes ?? '');
}
