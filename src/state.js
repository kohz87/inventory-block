import { EXTRA_KEY, META_KEY, SOURCE, STATE_VERSION } from './constants.js';

const clone = value => structuredClone(value);

export function emptyInventory() {
    return { categories: [] };
}

function cleanText(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

export function normalizeInventory(input) {
    const result = emptyInventory();
    const categories = Array.isArray(input?.categories) ? input.categories : [];

    for (const category of categories) {
        const name = cleanText(category?.name) || 'Uncategorized';
        const items = Array.isArray(category?.items) ? category.items : [];
        const normalizedItems = [];

        for (const item of items) {
            const itemName = cleanText(item?.name);
            if (!itemName) continue;
            normalizedItems.push({
                name: itemName,
                quantity: cleanText(item?.quantity),
                remark: cleanText(item?.remark),
            });
        }

        result.categories.push({ name, items: normalizedItems });
    }

    return result;
}

export function inventoryEquals(a, b) {
    return JSON.stringify(normalizeInventory(a)) === JSON.stringify(normalizeInventory(b));
}

function makeRoot() {
    const initial = normalizeInventory(emptyInventory());
    return {
        version: STATE_VERSION,
        activeRevision: 0,
        nextRevision: 1,
        revisions: {
            '0': {
                id: 0,
                parent: null,
                source: SOURCE.INIT,
                note: 'Initial inventory',
                createdAt: new Date().toISOString(),
                state: initial,
            },
        },
        branchHeads: {},
    };
}

export function ensureRoot(context) {
    if (!context?.chatMetadata) throw new Error('No active SillyTavern chat metadata.');

    let root = context.chatMetadata[META_KEY];
    if (!root || root.version !== STATE_VERSION || !root.revisions || !root.revisions['0']) {
        root = makeRoot();
        context.chatMetadata[META_KEY] = root;
    }

    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) {
        root.activeRevision = 0;
    }
    if (!Number.isInteger(root.nextRevision) || root.nextRevision < 1) {
        root.nextRevision = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isFinite)) + 1;
    }
    if (!root.branchHeads || typeof root.branchHeads !== 'object') root.branchHeads = {};

    return root;
}

export function getRevision(root, revisionId) {
    return root?.revisions?.[String(revisionId)] ?? null;
}

export function getInventoryAt(root, revisionId) {
    const revision = getRevision(root, revisionId);
    return revision ? clone(revision.state) : emptyInventory();
}

export function getCurrentInventory(context) {
    const root = ensureRoot(context);
    return getInventoryAt(root, root.activeRevision);
}

export function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {
    const root = ensureRoot(context);
    const normalized = normalizeInventory(state);
    const id = root.nextRevision++;
    const parentId = parent === null ? root.activeRevision : parent;

    root.revisions[String(id)] = {
        id,
        parent: Number.isInteger(parentId) ? parentId : null,
        source,
        note: cleanText(note),
        createdAt: new Date().toISOString(),
        state: normalized,
    };
    root.activeRevision = id;
    return id;
}

function randomUid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function activeMessageMeta(message) {
    return message?.extra?.[EXTRA_KEY] ?? null;
}

function branchParts(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const parts = [];

    for (let index = 0; index < chat.length; index++) {
        const message = chat[index];
        if (!message || message.is_user || message.is_system) continue;
        const meta = activeMessageMeta(message);
        if (meta?.uid) {
            parts.push(meta.uid);
            continue;
        }
        const swipe = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
        const sample = String(message.mes ?? '').slice(0, 48);
        parts.push(`m${index}:s${swipe}:${sample}`);
    }

    return parts;
}

function hashString(text) {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        h1 ^= c;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= c + i;
        h2 = Math.imul(h2, 0x85ebca6b);
    }
    return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

export function getBranchKey(context) {
    const parts = branchParts(context);
    return parts.length ? `${parts.length}:${hashString(parts.join('\u241f'))}` : 'root';
}

export function rememberBranchHead(context, revisionId = null) {
    const root = ensureRoot(context);
    const id = revisionId === null ? root.activeRevision : revisionId;
    if (!getRevision(root, id)) return;
    root.branchHeads[getBranchKey(context)] = id;
}

export function resolveActiveRevision(context) {
    const root = ensureRoot(context);
    const key = getBranchKey(context);
    const branchRevision = root.branchHeads[key];
    if (Number.isInteger(branchRevision) && getRevision(root, branchRevision)) {
        root.activeRevision = branchRevision;
        return branchRevision;
    }

    const chat = Array.isArray(context.chat) ? context.chat : [];
    for (let index = chat.length - 1; index >= 0; index--) {
        const message = chat[index];
        if (!message || message.is_user || message.is_system) continue;
        const revisionId = activeMessageMeta(message)?.revision;
        if (Number.isInteger(revisionId) && getRevision(root, revisionId)) {
            root.activeRevision = revisionId;
            return revisionId;
        }
    }

    root.activeRevision = 0;
    return 0;
}

function ensureSwipeInfo(message) {
    if (!Array.isArray(message.swipes) || !Array.isArray(message.swipe_info)) return;
    const swipeId = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
    if (swipeId < 0 || swipeId >= message.swipes.length) return;
    while (message.swipe_info.length < message.swipes.length) message.swipe_info.push({});
    if (!message.swipe_info[swipeId] || typeof message.swipe_info[swipeId] !== 'object') {
        message.swipe_info[swipeId] = {};
    }
    message.swipe_info[swipeId].extra = clone(message.extra ?? {});
    message.swipes[swipeId] = String(message.mes ?? '');
}

export function attachMessageRevision(context, messageId, {
    baseRevision,
    revision,
    newUid = false,
} = {}) {
    const message = context?.chat?.[messageId];
    if (!message) return null;

    message.extra ??= {};
    const current = message.extra[EXTRA_KEY] ?? {};
    const uid = newUid || !current.uid ? randomUid() : current.uid;
    message.extra[EXTRA_KEY] = {
        uid,
        baseRevision: Number.isInteger(baseRevision) ? baseRevision : 0,
        revision: Number.isInteger(revision) ? revision : 0,
    };

    ensureSwipeInfo(message);
    return message.extra[EXTRA_KEY];
}

export function commitManualState(context, state, { source = SOURCE.MANUAL, note = 'Manual inventory edit' } = {}) {
    const root = ensureRoot(context);
    const previous = getInventoryAt(root, root.activeRevision);
    const normalized = normalizeInventory(state);
    if (inventoryEquals(previous, normalized)) return root.activeRevision;

    const revision = createRevision(context, normalized, {
        parent: root.activeRevision,
        source,
        note,
    });
    rememberBranchHead(context, revision);
    return revision;
}

export function restoreRevisionAsNew(context, revisionId) {
    const root = ensureRoot(context);
    const target = getRevision(root, revisionId);
    if (!target) throw new Error(`Inventory revision ${revisionId} does not exist.`);

    return commitManualState(context, target.state, {
        source: SOURCE.RESTORE,
        note: `Restored revision ${revisionId}`,
    });
}

export function listRevisions(context) {
    const root = ensureRoot(context);
    return Object.values(root.revisions)
        .filter(revision => revision && Number.isInteger(revision.id))
        .sort((a, b) => b.id - a.id)
        .map(revision => ({
            id: revision.id,
            parent: revision.parent,
            source: revision.source,
            note: revision.note,
            createdAt: revision.createdAt,
        }));
}
