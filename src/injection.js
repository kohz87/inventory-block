import { LIMITS } from './constants.js';
import { withCurrencyTrackingRule } from './currency.js';

function textOfContent(content) {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    return content.map(part => typeof part === 'string' ? part : (typeof part?.text === 'string' ? part.text : '')).join('\n');
}

function normalizedProbeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function createPromptProbe(chat, maxChars = LIMITS.promptProbeChars) {
    const list = Array.isArray(chat) ? chat : [];
    const probes = [];
    for (let i = list.length - 1; i >= 0 && probes.length < 3; i--) {
        const text = normalizedProbeText(list[i]?.mes ?? list[i]?.content ?? '');
        if (text.length < 6) continue;
        const width = Math.max(24, Math.floor(maxChars / 2));
        const candidate = text.length <= maxChars
            ? text
            : `${text.slice(0, width)}\u241f${text.slice(-width)}`;
        if (!probes.includes(candidate)) probes.push(candidate);
    }
    return probes;
}

function eventTextValues(value, output, seen) {
    if (typeof value === 'string') {
        output.push(normalizedProbeText(value));
        return;
    }
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
        for (const item of value) eventTextValues(item, output, seen);
        return;
    }
    for (const item of Object.values(value)) eventTextValues(item, output, seen);
}

function probeMatchesText(probe, haystack) {
    if (!probe || !haystack) return false;
    if (!probe.includes('\u241f')) return haystack.includes(probe);
    const [start, end] = probe.split('\u241f');
    return haystack.includes(start) && haystack.includes(end);
}

export function promptEventMatchesProbe(eventData, probe) {
    const probes = Array.isArray(probe) ? probe.filter(Boolean) : [];
    if (!probes.length) return true;
    const values = [];
    eventTextValues(eventData, values, new WeakSet());
    return probes.some(candidate => values.some(value => probeMatchesText(candidate, value)));
}

async function tokenCount(getTokenCountAsync, text) {
    const source = String(text ?? '');
    if (typeof getTokenCountAsync === 'function') {
        try {
            const count = await getTokenCountAsync(source);
            if (Number.isFinite(count) && count >= 0) return count;
        } catch {
            // Fall through to a conservative character estimate.
        }
    }
    return source.length;
}


async function chatTokenEstimate(chat, getTokenCountAsync) {
    let total = 0;
    for (const message of chat) {
        total += await tokenCount(getTokenCountAsync, textOfContent(message?.content));
        total += 8;
    }
    return total;
}

function insertSystemPrompt(chat, prompt) {
    const message = { role: 'system', content: String(prompt ?? '') };
    let index = 0;
    while (index < chat.length && chat[index]?.role === 'system') index += 1;
    chat.splice(index, 0, message);
}

async function fitChatAfterInjection(chat, contextSize, getTokenCountAsync) {
    const budget = Number(contextSize);
    if (!Number.isFinite(budget) || budget <= 0) return true;
    return await chatTokenEstimate(chat, getTokenCountAsync) <= budget;
}

export async function injectGenerationPrompt(eventData, prompt, {
    contextSize = null,
    getTokenCountAsync = null,
    probe = null,
    requireProbe = true,
} = {}) {
    if (!eventData || typeof eventData !== 'object') return { injected: false, reason: 'invalid-event' };
    const text = withCurrencyTrackingRule(prompt);
    if (!text) return { injected: false, reason: 'empty-prompt' };
    if (requireProbe && !promptEventMatchesProbe(eventData, probe)) return { injected: false, reason: 'probe-mismatch' };

    if (Array.isArray(eventData.chat)) {
        insertSystemPrompt(eventData.chat, text);
        const fits = await fitChatAfterInjection(eventData.chat, contextSize, getTokenCountAsync);
        if (!fits) {
            const index = eventData.chat.findIndex(message => message?.role === 'system' && message?.content === text);
            if (index >= 0) eventData.chat.splice(index, 1);
            return { injected: false, reason: 'context-overflow' };
        }
        return { injected: true, kind: 'chat' };
    }

    if (typeof eventData.prompt === 'string') {
        const combined = `${text}\n${eventData.prompt}`;
        const budget = Number(contextSize);
        if (Number.isFinite(budget) && budget > 0) {
            const combinedTokens = await tokenCount(getTokenCountAsync, combined);
            if (combinedTokens > budget) return { injected: false, reason: 'context-overflow' };
        }
        eventData.prompt = combined;
        return { injected: true, kind: 'text' };
    }

    return { injected: false, reason: 'unsupported-event' };
}

export async function injectDryRunPrompt(eventData, prompt, options = {}) {
    if (!eventData || eventData.dryRun !== true) return { injected: false, reason: 'not-dry-run' };
    return injectGenerationPrompt(eventData, prompt, { ...options, requireProbe: false });
}
