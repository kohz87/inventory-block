import { LIMITS } from './constants.js';
import { generationTypeMatches } from './lifecycle.js';
import { promptEventMatchesProbe } from './injection.js';

export class GenerationSessionStore {
    constructor({ maxAgeMs = 10 * 60 * 1000, limit = LIMITS.promptSessions } = {}) {
        this.maxAgeMs = maxAgeMs;
        this.limit = limit;
        this.nextId = 1;
        this.sessions = [];
    }

    prune(now = Date.now()) {
        const cutoff = now - this.maxAgeMs;
        this.sessions = this.sessions.filter(session => session?.startedAt >= cutoff && !session?.finished);
        while (this.sessions.length > this.limit) this.sessions.shift();
        return this.sessions;
    }

    add(session, { supersedeUnarmed = true } = {}) {
        const now = Date.now();
        this.prune(now);
        if (supersedeUnarmed) {
            this.sessions = this.sessions.filter(prior => !(
                !prior.interceptorSeen &&
                prior.chatId === session.chatId &&
                generationTypeMatches(prior.type, session.type)
            ));
        }
        const stored = { ...session, id: this.nextId++, startedAt: session.startedAt ?? now };
        this.sessions.push(stored);
        this.prune(now);
        return stored;
    }

    remove(session) {
        const index = this.sessions.indexOf(session);
        if (index >= 0) this.sessions.splice(index, 1);
    }

    activeForChat(chatId) {
        return this.prune().find(session => session.chatId === chatId) ?? null;
    }

    forMessage(chatId, messageId, eventType = '') {
        const id = Number(messageId);
        if (!Number.isInteger(id)) return null;
        return this.prune()
            .filter(session => session.chatId === chatId && session.interceptorSeen)
            .filter(session => Number.isInteger(session.targetMessageId) ? id === session.targetMessageId : id >= session.startChatLength)
            .filter(session => !eventType || generationTypeMatches(session.type, eventType))
            .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
    }

    chooseForInterceptor(chat, type) {
        const candidates = this.prune()
            .filter(session => !session.interceptorSeen && generationTypeMatches(session.type, type))
            .sort((a, b) => b.startedAt - a.startedAt);
        if (candidates.length <= 1) return candidates[0] ?? null;
        const matched = candidates.filter(session => session.preProbe?.length && promptEventMatchesProbe({ chat }, session.preProbe));
        return matched.length === 1 ? matched[0] : null;
    }

    chooseForPromptEvent(eventData, { maxReadyAgeMs = 60 * 1000, now = Date.now() } = {}) {
        const candidates = this.prune(now)
            .filter(session => session.interceptorSeen && !session.promptInjected && !session.promptInjectionFailed)
            .filter(session => now - (session.interceptorAt ?? session.startedAt) < maxReadyAgeMs)
            .sort((a, b) => (b.interceptorAt ?? b.startedAt) - (a.interceptorAt ?? a.startedAt));
        const matched = candidates.filter(session => session.promptProbe?.length && promptEventMatchesProbe(eventData, session.promptProbe));
        if (matched.length === 1) return matched[0];
        if (matched.length > 1 || candidates.length > 1) return null;
        return candidates.length === 1 && !candidates[0].promptProbe?.length ? candidates[0] : null;
    }

    snapshot() {
        return [...this.prune()];
    }

    get size() {
        return this.prune().length;
    }
}
