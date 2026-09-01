import { EXTRA_KEY, META_KEY, ROOT_CATEGORY, SOURCE, STATE_VERSION } from './constants.js';

const clone = value => structuredClone(value);
const ROOT_ALIASES = new Set(['general', 'uncategorized']);

export function emptyInventory() {
    return { categories: [] };
}

function cleanText(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function keyOf(value) {
    return cleanText(value).toLocaleLowerCase();
}

export function canonicalCategoryName(value) {
    const clean = cleanText(value);
    return ROOT_ALIASES.has(clean.toLocaleLowerCase()) ? ROOT_CATEGORY : clean;
}

export function normalizeQuantity(value) {
    const clean = cleanText(value);
    return clean.replace(/^[×xX]\s*(?=\S)/, '').trim();
}

export function validateInventory(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return ['Inventory must be an object.'];
    }
    if (!Array.isArray(input.categories)) {
        return ['Inventory requires a categories array.'];
    }

    const categoryKeys = new Map();
    const rootItems = new Set();

    input.categories.forEach((category, categoryIndex) => {
        if (!category || typeof category !== 'object' || Array.isArray(category)) {
            errors.push(`Category ${categoryIndex + 1} must be an object.`);
            return;
        }
        const rawName = cleanText(category.name);
        if (!rawName) {
            errors.push(`Category ${categoryIndex + 1} has a blank name.`);
            return;
        }
        if (!Array.isArray(category.items)) {
            errors.push(`Category "${rawName}" requires an items array.`);
            return;
        }

        const canonical = canonicalCategoryName(rawName);
        const categoryKey = keyOf(canonical);
        const isRoot = categoryKey === keyOf(ROOT_CATEGORY);
        if (!isRoot && categoryKeys.has(categoryKey)) {
            errors.push(`Duplicate category name: ${rawName}.`);
        } else if (!isRoot) {
            categoryKeys.set(categoryKey, categoryIndex);
        }

        const localItems = isRoot ? rootItems : new Set();
        category.items.forEach((item, itemIndex) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                errors.push(`Item ${itemIndex + 1} in "${rawName}" must be an object.`);
                return;
            }
            const name = cleanText(item.name);
            if (!name) {
                errors.push(`Item ${itemIndex + 1} in "${rawName}" has a blank name.`);
                return;
            }
            const itemKey = keyOf(name);
            if (localItems.has(itemKey)) {
                errors.push(`Duplicate item "${name}" in category "${canonical}".`);
            } else {
                localItems.add(itemKey);
            }
        });
    });

    return errors;
}

export function normalizeInventory(input) {
    const result = emptyInventory();
    const categories = Array.isArray(input?.categories) ? input.categories : [];
    let root = null;

    for (const category of categories) {
        const canonicalName = canonicalCategoryName(category?.name) || ROOT_CATEGORY;
        const items = Array.isArray(category?.items) ? category.items : [];
        const normalizedItems = [];
        for (const item of items) {
            const name = cleanText(item?.name);
            if (!name) continue;
            normalizedItems.push({
                name,
                quantity: normalizeQuantity(item?.quantity),
                remark: cleanText(item?.remark),
            });
        }

        if (canonicalName === ROOT_CATEGORY) {
            if (!root) {
                root = { name: ROOT_CATEGORY, items: [] };
                result.categories.push(root);
            }
            root.items.push(...normalizedItems);
        } else {
            result.categories.push({ name: canonicalName, items: normalizedItems });
        }
    }

    return result;
}

export function validateAndNormalizeInventory(input) {
    const errors = validateInventory(input);
    if (errors.length) {
        const error = new Error(errors.join(' '));
        error.validationErrors = errors;
        throw error;
    }
    const normalized = normalizeInventory(input);
    const normalizedErrors = validateInventory(normalized);
    if (normalizedErrors.length) {
        const error = new Error(normalizedErrors.join(' '));
        error.validationErrors = normalizedErrors;
        throw error;
    }
    return normalized;
}

export function inventoryEquals(a, b) {
    return JSON.stringify(normalizeInventory(a)) === JSON.stringify(normalizeInventory(b));
}

function makeRoot() {
    const initial = emptyInventory();
    return {
        version: STATE_VERSION,
        activeRevision: 0,
        nextRevision: 1,
        mutationSerial: 0,
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
    if (!root) {
        root = makeRoot();
        context.chatMetadata[META_KEY] = root;
    } else if (root.version !== STATE_VERSION) {
        throw new Error(`Unsupported Inventory Block state version ${root.version ?? 'unknown'}; expected ${STATE_VERSION}. State was not reset.`);
    } else if (!root.revisions || !root.revisions['0']) {
        throw new Error('Inventory Block state is damaged: initial revision is missing. State was not reset.');
    }

    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;
    if (!Number.isInteger(root.nextRevision) || root.nextRevision < 1) {
        root.nextRevision = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isFinite)) + 1;
    }
    if (!Number.isInteger(root.mutationSerial) || root.mutationSerial < 0) root.mutationSerial = Math.max(0, root.nextRevision - 1);
    if (!root.branchHeads || typeof root.branchHeads !== 'object' || Array.isArray(root.branchHeads)) root.branchHeads = {};
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
    const normalized = validateAndNormalizeInventory(state);
    const id = root.nextRevision++;
    const parentId = parent === null ? root.activeRevision : parent;
    if (!getRevision(root, parentId)) throw new Error(`Cannot create inventory revision from missing parent ${parentId}.`);

    root.revisions[String(id)] = {
        id,
        parent: parentId,
        source,
        note: cleanText(note),
        createdAt: new Date().toISOString(),
        state: normalized,
    };
    root.activeRevision = id;
    root.mutationSerial += 1;
    return id;
}

function randomUid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function hashString(text) {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    const value = String(text ?? '');
    for (let i = 0; i < value.length; i++) {
        const c = value.charCodeAt(i);
        h1 ^= c;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= c + i;
        h2 = Math.imul(h2, 0x85ebca6b);
    }
    return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

function messageFingerprint(message = {}) {
    return hashString(JSON.stringify({
        user: Boolean(message.is_user),
        system: Boolean(message.is_system),
        name: String(message.name ?? ''),
        text: String(message.mes ?? ''),
        swipe: Number.isInteger(message.swipe_id) ? message.swipe_id : 0,
    }));
}

export function chatLineage(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    return chat.map(messageFingerprint);
}

function hashLineage(lineage) {
    const list = Array.isArray(lineage) ? lineage : [];
    return list.length ? `${list.length}:${hashString(list.join('\u241f'))}` : 'root';
}

export function lineageHashThrough(context, messageId = null) {
    const lineage = chatLineage(context);
    const last = messageId === null ? lineage.length - 1 : Math.min(Number(messageId), lineage.length - 1);
    return hashLineage(last < 0 ? [] : lineage.slice(0, last + 1));
}

export function getBranchKey(context) {
    return hashLineage(chatLineage(context));
}

function activeMessageMeta(message) {
    return message?.extra?.[EXTRA_KEY] ?? null;
}

export function rememberBranchHead(context, revisionId = null) {
    const root = ensureRoot(context);
    const id = revisionId === null ? root.activeRevision : revisionId;
    if (!getRevision(root, id)) return;
    const lineage = chatLineage(context);
    const key = hashLineage(lineage);
    const revision = getRevision(root, id);
    const sticky = [SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET].includes(revision?.source);
    root.branchHeads[key] = { revision: id, length: lineage.length, sticky, touchedAt: Date.now() };

    const entries = Object.entries(root.branchHeads);
    if (entries.length > 512) {
        const stickyEntries = entries.filter(([, head]) => head?.sticky);
        const recent = entries.filter(([, head]) => !head?.sticky)
            .sort((a, b) => Number(b[1]?.touchedAt ?? 0) - Number(a[1]?.touchedAt ?? 0))
            .slice(0, Math.max(0, 512 - stickyEntries.length));
        root.branchHeads = Object.fromEntries([...stickyEntries, ...recent]);
    }
}

function revisionDescendsFrom(root, revisionId, baseRevision) {
    if (revisionId === baseRevision) return true;
    const seen = new Set();
    let cursor = revisionId;
    while (Number.isInteger(cursor) && !seen.has(cursor)) {
        seen.add(cursor);
        const revision = getRevision(root, cursor);
        if (!revision) return false;
        if (revision.parent === baseRevision) return true;
        cursor = revision.parent;
    }
    return false;
}

function validMessageRevision(root, meta, currentRevision, expectedLineageHash) {
    if (!meta || !Number.isInteger(meta.baseRevision) || !Number.isInteger(meta.revision)) return false;
    if (meta.baseRevision !== currentRevision) return false;
    if (meta.lineageHash && meta.lineageHash !== expectedLineageHash) return false;
    if (!getRevision(root, meta.revision)) return false;
    return revisionDescendsFrom(root, meta.revision, meta.baseRevision);
}

export function resolveActiveRevision(context) {
    const root = ensureRoot(context);
    const lineage = chatLineage(context);
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const prefixKeyCache = new Map();
    const prefixKey = length => {
        if (!prefixKeyCache.has(length)) prefixKeyCache.set(length, hashLineage(lineage.slice(0, length)));
        return prefixKeyCache.get(length);
    };

    let bestHead = null;
    let bestLength = -1;
    for (const [key, head] of Object.entries(root.branchHeads)) {
        if (!Number.isInteger(head?.revision) || !getRevision(root, head.revision)) continue;
        const length = Number.isInteger(head.length) ? head.length : Number.parseInt(String(key).split(':', 1)[0], 10);
        if (!Number.isInteger(length) || length < 0 || length > lineage.length || length <= bestLength) continue;
        if (prefixKey(length) !== key) continue;
        bestHead = head;
        bestLength = length;
    }

    let revision = bestHead?.revision ?? 0;
    let startIndex = bestLength >= 0 ? bestLength : 0;
    if (bestHead) bestHead.touchedAt = Date.now();

    const prefix = lineage.slice(0, startIndex);
    for (let index = startIndex; index < chat.length; index++) {
        const message = chat[index];
        prefix.push(lineage[index]);
        if (!message || message.is_user || message.is_system) continue;
        const meta = activeMessageMeta(message);
        if (!meta) continue;
        const expectedLineageHash = hashLineage(prefix);
        if (!validMessageRevision(root, meta, revision, expectedLineageHash)) break;
        revision = meta.revision;
    }

    root.activeRevision = revision;
    return revision;
}

function ensureSwipeInfo(message) {
    if (!Array.isArray(message?.swipes)) return;
    if (!Array.isArray(message.swipe_info)) message.swipe_info = message.swipes.map(() => ({}));
    while (message.swipe_info.length < message.swipes.length) message.swipe_info.push({});
    const swipeId = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
    if (swipeId < 0 || swipeId >= message.swipes.length) return;
    if (!message.swipe_info[swipeId] || typeof message.swipe_info[swipeId] !== 'object') message.swipe_info[swipeId] = {};
    message.swipe_info[swipeId].extra = clone(message.extra ?? {});
    message.swipes[swipeId] = String(message.mes ?? '');
}

export function attachMessageRevision(context, messageId, { baseRevision, revision, newUid = false } = {}) {
    const message = context?.chat?.[messageId];
    if (!message) return null;
    message.extra ??= {};
    const current = message.extra[EXTRA_KEY] ?? {};
    const uid = newUid || !current.uid ? randomUid() : current.uid;
    message.extra[EXTRA_KEY] = {
        uid,
        baseRevision: Number.isInteger(baseRevision) ? baseRevision : 0,
        revision: Number.isInteger(revision) ? revision : 0,
        lineageHash: lineageHashThrough(context, messageId),
    };
    ensureSwipeInfo(message);
    return message.extra[EXTRA_KEY];
}

export function commitManualState(context, state, { source = SOURCE.MANUAL, note = 'Manual inventory edit' } = {}) {
    const root = ensureRoot(context);
    const normalized = validateAndNormalizeInventory(state);
    const previous = getInventoryAt(root, root.activeRevision);
    if (inventoryEquals(previous, normalized)) return root.activeRevision;
    const revision = createRevision(context, normalized, { parent: root.activeRevision, source, note });
    rememberBranchHead(context, revision);
    return revision;
}

export function restoreRevisionAsNew(context, revisionId) {
    const root = ensureRoot(context);
    const target = getRevision(root, revisionId);
    if (!target) throw new Error(`Inventory revision ${revisionId} does not exist.`);
    return commitManualState(context, target.state, { source: SOURCE.RESTORE, note: `Restored revision ${revisionId}` });
}

export function listRevisions(context, limit = 200) {
    const root = ensureRoot(context);
    return Object.values(root.revisions)
        .filter(revision => revision && Number.isInteger(revision.id))
        .sort((a, b) => b.id - a.id)
        .slice(0, Math.max(1, Number(limit) || 200))
        .map(revision => ({
            id: revision.id,
            parent: revision.parent,
            source: revision.source,
            note: revision.note,
            createdAt: revision.createdAt,
        }));
}
