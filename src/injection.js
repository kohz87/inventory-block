const SLOT_PREFIX = '__IB_SLOT_';
const SLOT_SUFFIX = '__';

function randomToken() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, '');
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
}

function encodeReservation(text) {
    const bytes = new TextEncoder().encode(String(text ?? ''));
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

export function createPromptSlotMarker(reserveFor = '') {
    const token = randomToken();
    const encoded = reserveFor ? encodeReservation(reserveFor) : '';
    return `${SLOT_PREFIX}${token}${SLOT_SUFFIX}${encoded}${SLOT_PREFIX}END_${token}${SLOT_SUFFIX}`;
}

export function insertPromptSlot(chat, marker) {
    if (!Array.isArray(chat) || typeof marker !== 'string' || !marker) return false;
    const index = Math.max(0, chat.length - 1);
    chat.splice(index, 0, {
        name: '',
        is_user: false,
        // Match SillyTavern's own in-chat SYSTEM extension-prompt shape.
        is_system: false,
        mes: marker,
        extra: { type: 'narrator', inventoryBlockSlot: true },
    });
    return true;
}

function replaceInValue(value, marker, replacement, seen) {
    if (typeof value === 'string') {
        if (!value.includes(marker)) return { value, count: 0 };
        const count = value.split(marker).length - 1;
        return { value: value.split(marker).join(replacement), count };
    }
    if (!value || typeof value !== 'object') return { value, count: 0 };
    if (seen.has(value)) return { value, count: 0 };
    seen.add(value);

    let count = 0;
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const result = replaceInValue(value[i], marker, replacement, seen);
            if (result.count) value[i] = result.value;
            count += result.count;
        }
        return { value, count };
    }

    for (const key of Object.keys(value)) {
        const result = replaceInValue(value[key], marker, replacement, seen);
        if (result.count) value[key] = result.value;
        count += result.count;
    }
    return { value, count };
}

export function replacePromptSlot(eventData, marker, replacement) {
    if (!eventData || typeof eventData !== 'object' || typeof marker !== 'string' || !marker) return 0;
    return replaceInValue(eventData, marker, String(replacement ?? ''), new WeakSet()).count;
}

export function injectDryRunPrompt(eventData, prompt) {
    if (!eventData || typeof eventData !== 'object' || eventData.dryRun !== true) return false;
    const text = String(prompt ?? '');
    if (!text) return false;
    if (typeof eventData.prompt === 'string') {
        eventData.prompt = `${eventData.prompt}\n${text}`;
        return true;
    }
    if (Array.isArray(eventData.chat)) {
        eventData.chat.push({ role: 'system', content: text });
        return true;
    }
    return false;
}
