export const ROOT_CATEGORY = 'General';
export const TRANSPORT_MARKER = 'INVENTORY_BLOCK_V05';
export const CATEGORY_PATH_SEPARATOR = '>';

// `<Inventory>` or `<Inventory attr>`, never look-alikes such as `<Inventory-notes>`.
const OPEN_TAG = '<Inventory(?:\\s[^>]*)?>';
const CLOSE_TAG = '<\\/Inventory\\s*>';
// A block body never contains another opening tag. Without this, a snapshot cut off
// before `</Inventory>` and followed by more text (Continue) would swallow everything
// up to the next snapshot's closing tag.
const BODY = `((?:(?!${OPEN_TAG})[\\s\\S])*?)`;
const COMPLETE_BLOCK = new RegExp(`${OPEN_TAG}${BODY}${CLOSE_TAG}`, 'gi');
const TRANSPORT_BLOCK = /<!--\s*INVENTORY_BLOCK_V05\b[\s\S]*?-->/gi;
// A complete block together with the envelope directly around it. Matching the
// block first means a stray `-->` inside the snapshot cannot end the envelope early.
const ENVELOPED_BLOCK = new RegExp(`(?:<!--\\s*INVENTORY_BLOCK_V05\\b\\s*)?${OPEN_TAG}${BODY}${CLOSE_TAG}(?:\\s*-->)?`, 'gi');
// Same, but only blocks inside the hidden envelope (never a user-authored bare block).
const HIDDEN_BLOCK = new RegExp(`<!--\\s*INVENTORY_BLOCK_V05\\b\\s*${OPEN_TAG}${BODY}${CLOSE_TAG}(?:\\s*-->)?`, 'gi');
const TABLE_RULE = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?$/;
const LIST_MARKER = /^(?:[-*•]|\d+[.)])\s+/;
const ENVELOPE_OPENER = /<!--\s*INVENTORY_BLOCK_V05\b\s*$/i;
const ENVELOPE_CLOSER = /^\s*-->/;

function clean(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function key(value) {
    return clean(value).normalize('NFKC').toLowerCase();
}

/**
 * Category headers may carry a sub-category path such as `[Wagon > Food]`.
 * The stored category name stays the full path; only whitespace around the
 * separators is canonicalized so `Wagon>Food` and `Wagon > Food` are the same.
 */
export function splitCategoryPath(name) {
    return clean(name).split(CATEGORY_PATH_SEPARATOR).map(segment => segment.trim()).filter(Boolean);
}

export function canonicalCategoryName(name) {
    return splitCategoryPath(name).join(` ${CATEGORY_PATH_SEPARATOR} `);
}

export function categoryKey(name) {
    return key(canonicalCategoryName(name));
}

export function itemKey(name) {
    return key(name);
}

export function emptyInventory() {
    return { categories: [] };
}

export function normalizeInventory(input) {
    const result = emptyInventory();
    const categories = Array.isArray(input?.categories) ? input.categories : [];
    let root = null;
    for (const category of categories) {
        const name = canonicalCategoryName(category?.name) || ROOT_CATEGORY;
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

/**
 * Backslash escapes are reversible through splitRow/unescapeText. Besides `\`
 * and `|`, escape anything that would end the hidden comment (`-->`, `--!>`) or
 * open/close a block (`<Inventory`, `</Inventory`) when it appears inside a cell.
 */
function escapeText(value, specials) {
    return clean(value)
        .replace(/\\/g, '\\\\')
        .replace(specials, '\\$&')
        .replace(/--(!?)>/g, '--$1\\>')
        .replace(/<(?=\/?inventory)/gi, '<\\');
}

function escapeCell(value) {
    return escapeText(value, /\|/g);
}

// A name starting like a list marker, table divider or header (`- Spare`, `2. Map`,
// `[Sealed] Letter`) gets a leading backslash so the parser keeps it verbatim.
function escapeName(value) {
    const text = escapeCell(value);
    return /^(?:[-*•:[]|\d+[.)])/.test(text) ? `\\${text}` : text;
}

function escapeHeader(name) {
    return escapeText(name, /[|\]]/g);
}

// A header is `[…]` whose only unescaped `]` is the final one. `[Food | Water]` (written by
// versions that did not escape `|`) stays a header; `[Sealed] Letter | 1 |` is a row.
function isHeaderLine(line) {
    if (!line.startsWith('[') || !line.endsWith(']')) return false;
    let escaped = false;
    for (let i = 1; i < line.length - 1; i++) {
        const char = line[i];
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === ']') return false;
    }
    return !escaped;
}

function rowCells(text) {
    const cells = splitRow(text);
    // Markdown-table rows: `| Rope | 1 | coiled |`. Drop the empty edge cells.
    if (text.startsWith('|')) cells.shift();
    if (cells.length >= 4 && cells.at(-1) === '') cells.pop();
    return cells;
}

// Only a markdown-table row (`| Name | Qty | Remark |`) can be a header row; a canonical
// `Name | Qty |` row is an ordinary item.
function isTableHeaderRow(cells, markdown) {
    return markdown && /^(?:name|items?)$/i.test(cells[0] ?? '') && /^(?:qty|quantity|amount|count|#)$/i.test(cells[1] ?? '');
}

function unescapeText(value) {
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
    return escaped ? `${result}\\` : result;
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
        let line = lines[i].trim();
        if (!line || TABLE_RULE.test(line)) continue;
        // A whole row wrapped in brackets (`[Spare Rope | 1 | coiled]`) is a row, not a header:
        // headers written since v0.6.3 escape `|`, and older ones rarely held two.
        if (isHeaderLine(line) && splitRow(line.slice(1, -1)).length >= 3) line = line.slice(1, -1).trim();
        if (isHeaderLine(line)) {
            const name = canonicalCategoryName(unescapeText(line.slice(1, -1)));
            if (!name) throw new Error(`Inventory category on line ${i + 1} is blank.`);
            // A repeated header continues the earlier section instead of invalidating the snapshot.
            current = categories.find(category => key(category.name) === key(name));
            if (!current) {
                current = { name, items: [] };
                categories.push(current);
            }
            continue;
        }
        const row = line.replace(LIST_MARKER, '');
        const cells = rowCells(row);
        if (isTableHeaderRow(cells, row.startsWith('|'))) continue;
        if (cells.length < 2 || !clean(cells[0])) {
            throw new Error(`Inventory row ${i + 1} must be Name | Quantity | Remark.`);
        }
        if (!current) ensureRoot();
        current.items.push({
            name: clean(cells[0]),
            quantity: clean(cells[1]),
            // An unescaped `|` inside the remark only splits it further; keep it as text.
            remark: clean(cells.slice(2).join(' | ')),
        });
    }
    return validateInventory({ categories });
}

export function parseInventoryBlock(blockText) {
    const match = new RegExp(`^\\s*${OPEN_TAG}([\\s\\S]*?)${CLOSE_TAG}\\s*$`, 'i').exec(String(blockText ?? ''));
    if (!match) throw new Error('Expected exactly one complete <Inventory>...</Inventory> block.');
    return parseInventoryBody(match[1]);
}

export function formatInventoryBlock(state) {
    const inventory = validateInventory(state);
    const lines = ['<Inventory>'];
    const root = inventory.categories.find(category => key(category.name) === key(ROOT_CATEGORY));
    const sections = inventory.categories.filter(category => key(category.name) !== key(ROOT_CATEGORY));
    for (const item of root?.items ?? []) {
        lines.push(`${escapeName(item.name)} | ${escapeCell(item.quantity)} | ${escapeCell(item.remark)}`);
    }
    for (const category of sections) {
        if (lines.length > 1 && lines.at(-1) !== '') lines.push('');
        lines.push(`[${escapeHeader(category.name)}]`);
        for (const item of category.items) {
            lines.push(`${escapeName(item.name)} | ${escapeCell(item.quantity)} | ${escapeCell(item.remark)}`);
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

/**
 * Parse a block body. A reply cut off mid-snapshot is closed with `\n-->` when it is
 * received; if Continue then finishes the same block, that closer ends up inside the
 * body. It is never part of a row (a real `-->` in a cell is escaped as `--\>`), so
 * when the body only parses without it, it is dropped.
 */
function parseBlockBody(body) {
    try {
        return { state: parseInventoryBody(body), error: null };
    } catch (caught) {
        const error = caught instanceof Error ? caught : new Error(String(caught));
        if (/\n-->/.test(body)) {
            try { return { state: parseInventoryBody(body.replace(/\n-->/g, '')), error: null }; } catch { /* keep the original error */ }
        }
        return { state: null, error };
    }
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
        const opener = ENVELOPE_OPENER.exec(source.slice(0, start));
        const closer = ENVELOPE_CLOSER.exec(source.slice(end));
        const { state, error } = parseBlockBody(match[1]);
        blocks.push({
            start,
            end,
            raw,
            state,
            error,
            hidden: Boolean(transport),
            transportStart: transport?.start ?? null,
            transportEnd: transport?.end ?? null,
            // The block plus any envelope directly around it, even when a stray `-->`
            // inside the block broke the envelope (then `hidden` is false).
            wrapStart: opener ? start - opener[0].length : start,
            wrapEnd: closer ? end + closer[0].length : end,
        });
    }
    return blocks;
}

/**
 * A reply cut off mid-snapshot gets its hidden envelope closed with `\n-->` on receive.
 * If Continue then picks up exactly at the cut, its text is glued straight onto that
 * closer (`<Inven\n-->tory>`, `90 Go\n-->ld`). Such an envelope holds no complete block
 * and is followed by non-whitespace, which never happens for an envelope Inventory
 * wrote around a finished snapshot, so the closer is dropped and the halves rejoin.
 * A second `-->` directly after a complete envelope is a duplicate closer and is dropped.
 */
export function rejoinContinuedCuts(text) {
    let source = String(text ?? '');
    for (const range of transportRanges(source).reverse()) {
        if (!source.slice(range.start, range.end).endsWith('\n-->')) continue;
        if (new RegExp(COMPLETE_BLOCK.source, 'i').test(source.slice(range.start, range.end))) {
            // Cut right after `</Inventory>`: the envelope was closed on receive and Continue
            // then wrote the original closer too. Drop the duplicate so no `-->` shows.
            const duplicate = /^\s*-->/.exec(source.slice(range.end));
            if (duplicate) source = `${source.slice(0, range.end)}${source.slice(range.end + duplicate[0].length)}`;
            continue;
        }
        const next = source.charAt(range.end);
        if (!next || /\s/.test(next)) continue;
        source = `${source.slice(0, range.end - 4)}${source.slice(range.end)}`;
    }
    return source;
}

export function latestValidInventoryInText(text) {
    const blocks = inventoryBlocks(rejoinContinuedCuts(text));
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

/**
 * Baseline for a generation. Regenerate and Swipe replace the final message only
 * when it is an assistant reply; when the chat ends with the user's message (for
 * example after a failed reply) nothing is replaced and the newest snapshot stays
 * current. This also holds once SillyTavern has already removed the replaced reply.
 */
export function inventoryForGeneration(chat, type = 'normal') {
    const list = Array.isArray(chat) ? chat : [];
    const lower = String(type ?? 'normal').toLowerCase();
    const last = list.at(-1);
    const replacesLast = (lower.includes('regenerate') || lower.includes('swipe'))
        && Boolean(last) && !last.is_user && !last.is_system;
    const snapshot = latestInventorySnapshot(list, replacesLast ? { beforeIndex: list.length - 1 } : {});
    return normalizeInventory(snapshot?.state ?? emptyInventory());
}

function rowShaped(line) {
    return line.includes('|') || (line.startsWith('[') && line.endsWith(']'));
}

// The last line of a cut-off snapshot may be a partial row (`Coin Po`, `Rope (50 ft)`) of
// any length, but not finished prose: a line whose text, ignoring closing quotes and
// brackets, ends in sentence punctuation is prose.
function partialRow(line) {
    if (rowShaped(line) || line.startsWith('[')) return true;
    return !/[.!?…]$/.test(line.replace(/["'”’)\]]+$/, ''));
}

function lastMatch(source, pattern) {
    let found = null;
    for (const match of source.matchAll(pattern)) found = match;
    return found;
}

// Only a tag alone on its line followed by snapshot-shaped rows counts as a
// cut-off snapshot; prose such as "keep an <inventory> of …" never does.
function looksLikeSnapshotTail(source, open) {
    const lineStart = source.lastIndexOf('\n', open.index) + 1;
    if (source.slice(lineStart, open.index).trim()) return false;
    const rest = source.slice(open.index + open[0].length);
    const [tagLineRest, ...body] = rest.split(/\r?\n/);
    if (tagLineRest.trim()) return false;
    const lines = body.map(line => line.trim()).filter(Boolean);
    if (!lines.length) return true;
    return lines.slice(0, -1).every(rowShaped) && partialRow(lines.at(-1));
}

/**
 * Snapshots cut off before `</Inventory>` and then followed by more text, as when
 * a truncated reply is finished with Continue. Each span covers the envelope (if
 * any), the opening tag and the row-shaped lines after it — plus a `-->` that an
 * earlier normalization added — but never the prose that follows.
 */
export function interruptedSnapshots(text) {
    const source = String(text ?? '');
    const opens = [...source.matchAll(new RegExp(OPEN_TAG, 'gi'))];
    const transports = transportRanges(source);
    const spans = [];
    for (let i = 0; i < opens.length - 1; i++) {
        const open = opens[i];
        const nextOpen = opens[i + 1];
        if (new RegExp(CLOSE_TAG, 'i').test(source.slice(open.index, nextOpen.index))) continue;
        const opener = ENVELOPE_OPENER.exec(source.slice(0, open.index));
        const nextOpener = ENVELOPE_OPENER.exec(source.slice(0, nextOpen.index));
        const limit = nextOpen.index - (nextOpener?.[0].length ?? 0);
        const start = opener ? open.index - opener[0].length : open.index;
        let end = open.index + open[0].length;
        let offset = end;
        const lines = source.slice(end, limit).split('\n');
        for (let j = 0; j < lines.length; j++) {
            const line = lines[j].trim();
            if (j === 0 && !line) { offset += lines[j].length + 1; continue; }
            if (line === '-->') { end = offset + lines[j].length; break; }
            if (!rowShaped(line)) break;
            end = offset + lines[j].length;
            offset += lines[j].length + 1;
        }
        spans.push({
            start,
            end,
            enveloped: Boolean(opener),
            hidden: transports.some(range => range.start === start && range.end === end),
            body: source.slice(open.index, end).replace(/\s*-->$/, ''),
        });
    }
    return spans;
}

function removeSpans(source, spans) {
    let result = source;
    for (const span of [...spans].reverse()) result = `${result.slice(0, span.start)}${result.slice(span.end)}`;
    return result;
}

/**
 * Locate a snapshot that was cut off before `</Inventory>`:
 * - `envelope`: an `<!-- INVENTORY_BLOCK_V05` comment that was never closed;
 * - `hidden`: an already-closed envelope holding an unterminated block;
 * - `bare`: a visible, snapshot-shaped opening tag with no closing tag.
 */
export function truncatedSnapshot(text) {
    const source = String(text ?? '');
    const opener = lastMatch(source, /<!--\s*INVENTORY_BLOCK_V05\b/gi);
    if (opener && !source.includes('-->', opener.index)) return { start: opener.index, kind: 'envelope' };
    const open = lastMatch(source, new RegExp(OPEN_TAG, 'gi'));
    if (!open) return null;
    if (new RegExp(CLOSE_TAG, 'i').test(source.slice(open.index))) return null;
    const transport = transportRanges(source).find(range => range.start <= open.index && range.end > open.index);
    if (transport) return { start: transport.start, kind: 'hidden' };
    return looksLikeSnapshotTail(source, open) ? { start: open.index, kind: 'bare' } : null;
}

function removeTrailingTruncatedInventory(text) {
    const source = String(text ?? '');
    const truncated = truncatedSnapshot(source);
    return truncated ? source.slice(0, truncated.start).trimEnd() : source;
}

/**
 * Remove snapshots from prompt text. With `bare: false` only Inventory's own hidden
 * envelopes are removed, so a block a person wrote into a message, character card or
 * World Info entry (an example format, a pasted list) reaches the model untouched.
 */
/** Raw text of the visible (not enveloped) complete blocks in `text`. */
export function bareBlockTexts(text) {
    const source = String(text ?? '');
    const found = [];
    for (const match of source.matchAll(COMPLETE_BLOCK)) {
        if (!ENVELOPE_OPENER.test(source.slice(0, match.index))) found.push(match[0].trim());
    }
    return found;
}

export function stripInventoryBlocks(text, { bare = true, knownBlocks = null } = {}) {
    let source = rejoinContinuedCuts(text);
    source = removeSpans(source, interruptedSnapshots(source).filter(span => bare || span.enveloped));
    source = source.replace(bare ? ENVELOPED_BLOCK : HIDDEN_BLOCK, '').replace(TRANSPORT_BLOCK, '');
    // Presets that embed chat history in a user/system message carry old visible snapshots
    // there; drop those copies while keeping any block a person wrote.
    if (!bare && knownBlocks?.size) source = source.replace(COMPLETE_BLOCK, block => (knownBlocks.has(block.trim()) ? '' : block));
    const truncated = truncatedSnapshot(source);
    if (truncated && (bare || truncated.kind !== 'bare')) source = source.slice(0, truncated.start).trimEnd();
    return source;
}

function hiddenRawBlock(raw) {
    // Keep a malformed block for inspection, but never let it close the comment early.
    return `<!-- ${TRANSPORT_MARKER}\n${raw.replace(/--(!?)>/g, '--$1\\>')}\n-->`;
}

export function normalizeInventoryTransports(text) {
    const original = String(text ?? '');
    let source = rejoinContinuedCuts(original);
    // Close snapshots that were cut off and then continued, so the prose after them stays visible.
    for (const span of interruptedSnapshots(source).reverse()) {
        if (span.hidden) continue;
        source = `${source.slice(0, span.start)}${hiddenRawBlock(span.body)}${source.slice(span.end)}`;
    }
    const plain = inventoryBlocks(source).filter(block => !block.hidden);
    for (let i = plain.length - 1; i >= 0; i--) {
        const block = plain[i];
        // Visible blocks, and blocks whose envelope a stray `-->` broke, are rewritten as one
        // canonical envelope. That is idempotent: the result is hidden and left alone next time.
        const wrapped = block.state ? formatInventoryTransport(block.state) : hiddenRawBlock(block.raw);
        source = `${source.slice(0, block.wrapStart)}${wrapped}${source.slice(block.wrapEnd)}`;
    }

    const truncated = truncatedSnapshot(source);
    if (truncated?.kind === 'envelope') {
        source = `${source.trimEnd()}\n-->`;
    } else if (truncated?.kind === 'bare') {
        source = `${source.slice(0, truncated.start)}${hiddenRawBlock(source.slice(truncated.start))}`;
    }

    return { text: source, changed: source !== original };
}

export function replaceOrAppendInventory(text, state) {
    const transport = formatInventoryTransport(state);
    let source = removeTrailingTruncatedInventory(rejoinContinuedCuts(text));
    const blocks = inventoryBlocks(source);
    if (blocks.length) {
        const target = blocks.at(-1);
        const start = target.transportStart ?? target.wrapStart;
        const end = target.transportEnd ?? target.wrapEnd;
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
