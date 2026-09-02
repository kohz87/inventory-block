const BACKGROUND_GENERATION_TYPES = new Set(['quiet', 'impersonate']);
const REPLACEMENT_GENERATION_TYPES = new Set(['swipe', 'regenerate']);
const EXISTING_MESSAGE_GENERATION_TYPES = new Set(['swipe', 'regenerate', 'continue', 'append', 'appendfinal']);

export function normalizeGenerationType(type) {
    return String(type || 'normal').trim().toLowerCase();
}

export function isBackgroundGeneration(type) {
    return BACKGROUND_GENERATION_TYPES.has(normalizeGenerationType(type));
}

export function isTrackedGeneration(type, isDryRun = false) {
    if (isDryRun) return false;
    return !isBackgroundGeneration(type);
}

export function isReplacementGeneration(type) {
    return REPLACEMENT_GENERATION_TYPES.has(normalizeGenerationType(type));
}

export function targetMessageForGeneration(type, latestAssistantMessageId) {
    return EXISTING_MESSAGE_GENERATION_TYPES.has(normalizeGenerationType(type))
        ? (Number.isInteger(latestAssistantMessageId) && latestAssistantMessageId >= 0 ? latestAssistantMessageId : null)
        : null;
}

export function generationTypeMatches(expected, actual) {
    const want = normalizeGenerationType(expected);
    const got = normalizeGenerationType(actual);
    if (want === got) return true;
    if (want === 'continue' && ['append', 'appendfinal', 'continue'].includes(got)) return true;
    if (want === 'regenerate' && ['regenerate', 'normal'].includes(got)) return true;
    if (want === 'group' && got === 'normal') return true;
    return false;
}

function bracketDirectives(text) {
    const source = String(text ?? '');
    const matches = [];
    const re = /\[([^\]]{1,2000})\]/g;
    for (const match of source.matchAll(re)) matches.push(match[1]);
    return matches;
}

export function isBroadInventoryAdministration(text) {
    const source = String(text ?? '');
    if (!source.trim()) return false;
    const inventoryNoun = /\b(inventory|inventories|item|items|category|categories|belongings|supplies|equipment|food|rations|materials|storage|possessions|gear)\b/i;
    const adminVerb = /\b(compact|consolidat(?:e|ed|ion)|organ(?:ize|ise|ized|ised|ization|isation)|reorgan(?:ize|ise)|merge|split|categor(?:ize|ise)|group|rename|move|clean\s*up|restructure|combine|separate|create\s+(?:a\s+)?categor(?:y|ies)|delete\s+(?:a\s+)?categor(?:y|ies)|rebuild|rewrite)\b/i;
    const adminStart = /^\s*(?:compact|consolidat(?:e|ed)|organ(?:ize|ise)|reorgan(?:ize|ise)|merge|split|categor(?:ize|ise)|group|rename|move|clean\s*up|restructure|combine|separate|create\s+(?:a\s+)?categor(?:y|ies)|delete\s+(?:a\s+)?categor(?:y|ies)|rebuild|rewrite)\b/i;
    for (const directive of bracketDirectives(source)) {
        const isOoc = /^\s*OOC\s*:/i.test(directive);
        let body = directive.replace(/^\s*OOC\s*:\s*/i, '').trim();
        if (!isOoc) body = body.replace(/^\s*Inventory\s*:\s*/i, '').trim();
        if (!inventoryNoun.test(body)) continue;
        if (isOoc ? adminVerb.test(body) : adminStart.test(body)) return true;
    }
    return false;
}

export function latestUserMessageText(chat) {
    const list = Array.isArray(chat) ? chat : [];
    for (let i = list.length - 1; i >= 0; i--) {
        const message = list[i];
        if (message?.is_user && !message?.is_system) return String(message.mes ?? '');
    }
    return '';
}

export function userInstructionForGeneration(type, chat, composerText = '') {
    const lower = normalizeGenerationType(type);
    const composer = String(composerText ?? '').trim();
    if ((lower === 'normal' || lower === 'group') && composer) return composer;
    if (['continue', 'append', 'appendfinal'].includes(lower)) return '';
    return latestUserMessageText(chat);
}

export function generationGuardLength(type, startChatLength, targetMessageId = null) {
    const lower = normalizeGenerationType(type);
    if (isReplacementGeneration(lower) && Number.isInteger(targetMessageId)) return Math.max(0, targetMessageId);
    return Math.max(0, Number.isInteger(startChatLength) ? startChatLength : 0);
}

export function createReplaceCapability() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `inv-replace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
