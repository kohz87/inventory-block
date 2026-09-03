import { emptyInventory, formatInventoryTransport, normalizeInventory, stripInventoryBlocks } from './snapshot.js';

export const CONTEXT_BEGIN = 'INVENTORY_BLOCK_V05_CONTEXT_BEGIN';
export const CONTEXT_END = 'INVENTORY_BLOCK_V05_CONTEXT_END';

const CONTEXT_RE = new RegExp(`${CONTEXT_BEGIN}[\\s\\S]*?${CONTEXT_END}`, 'g');

function removeOldContext(text) {
    return String(text ?? '').replace(CONTEXT_RE, '');
}

function sanitizeText(text) {
    return stripInventoryBlocks(removeOldContext(text));
}

function sanitizeContent(content) {
    if (typeof content === 'string') return sanitizeText(content);
    if (!Array.isArray(content)) return content;
    return content.map(part => {
        if (typeof part === 'string') return sanitizeText(part);
        if (part && typeof part === 'object' && typeof part.text === 'string') return { ...part, text: sanitizeText(part.text) };
        return part;
    });
}

export function buildInventoryGenerationPrompt(state = emptyInventory()) {
    const block = formatInventoryTransport(normalizeInventory(state));
    return `${CONTEXT_BEGIN}\n` +
`${block}\n\n` +
`The hidden Inventory snapshot envelope above is the sole authoritative current possession state. Earlier story references and earlier Inventory snapshots are historical only and must never restore absent items, quantities, categories, or balances.\n` +
`At the end of EVERY assistant response, emit exactly one complete updated Inventory snapshot in the SAME hidden HTML-comment envelope format shown above, including the INVENTORY_BLOCK_V05 marker and the complete Inventory opening/closing tags. The snapshot represents the full inventory after the events completed in that response. It is never a patch, delta, JSON object, or partial list. Preserve every unchanged item and category exactly; omission means loss, so do not omit unchanged data.\n` +
`Apply only gains, losses, transfers, spending, consumption, equipment changes, or other possession changes that the response actually establishes as completed. Planned, attempted, interrupted, hypothetical, negotiated, or uncertain changes do not alter Inventory. If a change cannot be determined safely, keep the previous value instead of guessing or inventing precision. Never create a negative balance.\n` +
`Use the compact row format Name | Quantity | Remark and section headers [Category]. Keep the Inventory envelope standalone and outside other XML/structured blocks. Write visible prose and visible structured blocks normally; other extensions may place their own independently namespaced machine payloads before or after Inventory.\n` +
`Never print the Inventory snapshot as visible narration and do not explain its bookkeeping in prose.\n${CONTEXT_END}`;
}

function insertSystemPrompt(chat, prompt) {
    let index = 0;
    while (index < chat.length && chat[index]?.role === 'system') index += 1;
    chat.splice(index, 0, { role: 'system', content: prompt });
}

export function injectInventorySnapshot(eventData, state) {
    if (!eventData || typeof eventData !== 'object' || eventData.dryRun === true) return { injected: false, reason: 'invalid-event' };
    const prompt = buildInventoryGenerationPrompt(state);

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
        const clean = sanitizeText(eventData.prompt);
        eventData.prompt = `${prompt}\n${clean}`;
        return { injected: true, kind: 'text' };
    }

    return { injected: false, reason: 'unsupported-event' };
}
