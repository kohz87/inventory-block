import { emptyInventory, formatInventoryTransport, inventoryBlocks, normalizeInventory, stripInventoryBlocks } from './snapshot.js';
import { DEFAULT_MAX_DEPTH, clampDepth } from './tree.js';

export const CONTEXT_BEGIN = 'INVENTORY_BLOCK_V05_CONTEXT_BEGIN';
export const CONTEXT_END = 'INVENTORY_BLOCK_V05_CONTEXT_END';

const CONTEXT_RE = new RegExp(`${CONTEXT_BEGIN}[\\s\\S]*?${CONTEXT_END}`, 'g');

function removeOldContext(text) {
    return String(text ?? '').replace(CONTEXT_RE, '');
}

function sanitizeText(text) {
    return stripInventoryBlocks(removeOldContext(text));
}

function mapContentText(content, transform) {
    if (typeof content === 'string') return transform(content, 0);
    if (!Array.isArray(content)) return content;
    return content.map((part, index) => {
        if (typeof part === 'string') return transform(part, index);
        if (part && typeof part === 'object' && typeof part.text === 'string') return { ...part, text: transform(part.text, index) };
        return part;
    });
}

function sanitizeContent(content) {
    return mapContentText(content, text => sanitizeText(text));
}

function contentTexts(content) {
    const texts = [];
    mapContentText(content, (text, index) => { texts.push({ text, index }); return text; });
    return texts;
}

function hasValidBlock(text) {
    return inventoryBlocks(text).some(block => block.state);
}

// Remove every snapshot except the last valid one in `text`, which stays in place.
function keepLastBlock(text) {
    const source = removeOldContext(text);
    const last = inventoryBlocks(source).filter(block => block.state).at(-1);
    if (!last) return sanitizeText(source);
    const kept = source.slice(last.wrapStart, last.wrapEnd);
    return `${stripInventoryBlocks(source.slice(0, last.wrapStart))}${kept}${stripInventoryBlocks(source.slice(last.wrapEnd))}`;
}

function nestingRule(maxDepth) {
    const depth = clampDepth(maxDepth);
    if (depth <= 1) return 'Do not nest categories; never use ">" inside a section header.';
    return `Section headers may nest sub-categories with " > " (for example [Wagon > Food]), at most ${depth} levels deep. ` +
        'Write the full path in every header, keep existing category paths spelled exactly as they appear in the current snapshot, and only add a sub-category when it keeps a large category organized.';
}

// Constraints the parser enforces; stating them keeps a whole turn from being rejected.
const FORMAT_RULES = 'Write each category header once and each item name once per category; merge duplicates into a single row. ' +
    'Never put "|" inside a name, quantity, or remark (write "/" instead), and never write "-->" anywhere inside the snapshot.';

export function buildInventoryGenerationPrompt(state = emptyInventory(), { maxDepth = DEFAULT_MAX_DEPTH } = {}) {
    const block = formatInventoryTransport(normalizeInventory(state));
    return `${CONTEXT_BEGIN}\n` +
`${block}\n\n` +
`The hidden Inventory snapshot envelope above is the sole authoritative current possession state. Earlier story references and earlier Inventory snapshots are historical only and must never restore absent items, quantities, categories, or balances.\n` +
`At the end of EVERY assistant response, emit exactly one complete updated Inventory snapshot in the SAME hidden HTML-comment envelope format shown above, including the INVENTORY_BLOCK_V05 marker and the complete Inventory opening/closing tags. The snapshot represents the full inventory after the events completed in that response. It is never a patch, delta, JSON object, or partial list. Preserve every unchanged item and category exactly; omission means loss, so do not omit unchanged data.\n` +
`Apply only gains, losses, transfers, spending, consumption, equipment changes, or other possession changes that the response actually establishes as completed. Planned, attempted, interrupted, hypothetical, negotiated, or uncertain changes do not alter Inventory. If a change cannot be determined safely, keep the previous value instead of guessing or inventing precision. Never create a negative balance.\n` +
`Use the compact row format Name | Quantity | Remark and section headers [Category] on their own line. ${nestingRule(maxDepth)} ${FORMAT_RULES} Keep the Inventory envelope standalone and outside other XML/structured blocks. Write visible prose and visible structured blocks normally; other extensions may place their own independently namespaced machine payloads before or after Inventory.\n` +
`Never print the Inventory snapshot as visible narration and do not explain its bookkeeping in prose.\n${CONTEXT_END}`;
}

function insertSystemPrompt(chat, prompt) {
    let index = 0;
    while (index < chat.length && chat[index]?.role === 'system') index += 1;
    chat.splice(index, 0, { role: 'system', content: prompt });
}

/**
 * Sanitize a prompt Inventory does not drive (quiet, impersonate and other
 * extensions' generations). Without this, every historical hidden snapshot rides
 * along in those prompts. Only the newest complete snapshot is kept, as context.
 */
export function stripHistoricalInventory(eventData) {
    if (!eventData || typeof eventData !== 'object' || eventData.dryRun === true) return { stripped: false, reason: 'invalid-event' };

    if (Array.isArray(eventData.chat)) {
        const chat = eventData.chat;
        let newest = null;
        chat.forEach((message, messageIndex) => {
            for (const { text, index } of contentTexts(message?.content)) {
                if (hasValidBlock(text)) newest = { messageIndex, index };
            }
        });
        const cleaned = [];
        chat.forEach((message, messageIndex) => {
            const content = mapContentText(message?.content, (text, index) => (
                newest && newest.messageIndex === messageIndex && newest.index === index ? keepLastBlock(text) : sanitizeText(text)
            ));
            const ownContextOnly = message?.role === 'system'
                && typeof message?.content === 'string'
                && message.content.includes(CONTEXT_BEGIN)
                && String(content ?? '').trim() === '';
            if (!ownContextOnly) cleaned.push({ ...message, content });
        });
        chat.splice(0, chat.length, ...cleaned);
        return { stripped: true, kind: 'chat' };
    }

    if (typeof eventData.prompt === 'string') {
        eventData.prompt = keepLastBlock(eventData.prompt);
        return { stripped: true, kind: 'text' };
    }

    return { stripped: false, reason: 'unsupported-event' };
}

/**
 * Sanitize a combined text prompt whose Inventory context already arrived through
 * SillyTavern's extension prompt (inside the instruct template). The context
 * region is kept verbatim; every other snapshot is removed.
 */
function sanitizeAroundContext(text) {
    const begin = text.lastIndexOf(CONTEXT_BEGIN);
    const end = begin >= 0 ? text.indexOf(CONTEXT_END, begin) : -1;
    if (begin < 0 || end < 0) return null;
    const close = end + CONTEXT_END.length;
    return `${sanitizeText(text.slice(0, begin))}${text.slice(begin, close)}${sanitizeText(text.slice(close))}`;
}

export function injectInventorySnapshot(eventData, state, options = {}) {
    if (!eventData || typeof eventData !== 'object' || eventData.dryRun === true) return { injected: false, reason: 'invalid-event' };
    const prompt = buildInventoryGenerationPrompt(state, options);

    if (Array.isArray(eventData.chat)) {
        const chat = eventData.chat;
        const cleaned = [];
        for (const message of chat) {
            const content = sanitizeContent(message?.content);
            const ownContextOnly = message?.role === 'system'
                && typeof message?.content === 'string'
                && message.content.includes(CONTEXT_BEGIN)
                && String(content ?? '').trim() === '';
            if (!ownContextOnly) cleaned.push({ ...message, content });
        }
        // Preserve the shared array object so other prompt-ready extensions that already
        // hold a reference cannot lose their work when Inventory sanitizes history.
        chat.splice(0, chat.length, ...cleaned);
        insertSystemPrompt(chat, prompt);
        return { injected: true, kind: 'chat' };
    }

    if (typeof eventData.prompt === 'string') {
        if (options.contextInPrompt) {
            const sanitized = sanitizeAroundContext(eventData.prompt);
            if (sanitized !== null) {
                eventData.prompt = sanitized;
                return { injected: true, kind: 'text-extension-prompt' };
            }
        }
        // Fallback when the extension prompt is unavailable: prepend to the combined prompt.
        const clean = sanitizeText(eventData.prompt);
        eventData.prompt = `${prompt}\n${clean}`;
        return { injected: true, kind: 'text' };
    }

    return { injected: false, reason: 'unsupported-event' };
}
