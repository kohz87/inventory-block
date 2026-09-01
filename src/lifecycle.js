const BACKGROUND_GENERATION_TYPES = new Set(['quiet', 'impersonate']);
const REPLACEMENT_GENERATION_TYPES = new Set(['swipe', 'regenerate']);
const EXISTING_MESSAGE_GENERATION_TYPES = new Set(['swipe', 'regenerate', 'continue', 'append', 'appendfinal']);

export function normalizeGenerationType(type) {
    return String(type || 'normal').trim().toLocaleLowerCase();
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

export function isBroadInventoryAdministration(text) {
    const source = String(text ?? '');
    if (!source.trim()) return false;
    const ooc = /\[\s*OOC\s*:/i.test(source);
    const inventoryNoun = /\b(inventory|inventories|item|items|category|categories|belongings|supplies|equipment|food|rations|materials|storage)\b/i.test(source);
    const adminVerb = /\b(compact|consolidat(?:e|ed|ion)|organ(?:ize|ise|ized|ised|ization|isation)|reorgan(?:ize|ise)|merge|split|categor(?:ize|ise)|group|rename|move|clean\s*up|restructure|combine|separate|create\s+(?:a\s+)?categor)/i.test(source);
    return (ooc && adminVerb) || (inventoryNoun && adminVerb);
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
    return latestUserMessageText(chat);
}

export function createReplaceCapability() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `inv-replace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}
