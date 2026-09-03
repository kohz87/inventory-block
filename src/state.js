import {
    EXTRA_KEY,
    LIMITS,
    LINEAGE_VERSION,
    META_KEY,
    ROOT_CATEGORY,
    SOURCE,
    STATE_VERSION,
} from './constants.js';

const clone = value => structuredClone(value);
const ROOT_ALIASES = new Set(['general', 'uncategorized']);
const DURABLE_SOURCES = new Set([SOURCE.SEED, SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET]);

function isDurableSource(source) {
    return DURABLE_SOURCES.has(source);
}

export function emptyInventory() {
    return { categories: [] };
}

function cleanText(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

export function identityKey(value) {
    return cleanText(value).normalize('NFKC').toLowerCase();
}

function isTextPrimitive(value, { allowNumber = false, optional = false } = {}) {
    if (optional && (value === undefined || value === null)) return true;
    return typeof value === 'string' || (allowNumber && typeof value === 'number' && Number.isFinite(value));
}

function serializedLength(input) {
    try { return JSON.stringify(input).length; }
    catch { return Number.POSITIVE_INFINITY; }
}

function serializedBytes(input) {
    try {
        const json = JSON.stringify(input);
        if (typeof TextEncoder === 'function') return new TextEncoder().encode(json).length;
        return unescape(encodeURIComponent(json)).length;
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

const lineageCache = new WeakMap();

export function invalidateLineageCache(context) {
    const chat = context?.chat;
    if (Array.isArray(chat)) lineageCache.delete(chat);
}

function isNumericQuantity(value) {
    return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(value ?? '').trim());
}

export function canonicalCategoryName(value) {
    const clean = cleanText(value);
    return ROOT_ALIASES.has(identityKey(clean)) ? ROOT_CATEGORY : clean;
}

export function normalizeQuantity(value) {
    const clean = cleanText(value);
    return clean.replace(/^[×xX]\s*(?=[+-]?(?:\d|\.\d))/, '').trim();
}

export function validateInventory(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Inventory must be an object.'];
    if (!Array.isArray(input.categories)) return ['Inventory requires a categories array.'];
    if (input.categories.length > LIMITS.categories) errors.push(`Inventory has too many categories (${input.categories.length}; maximum ${LIMITS.categories}).`);

    const categoryKeys = new Map();
    const rootItems = new Set();
    let totalItems = 0;

    input.categories.forEach((category, categoryIndex) => {
        if (!category || typeof category !== 'object' || Array.isArray(category)) {
            errors.push(`Category ${categoryIndex + 1} must be an object.`);
            return;
        }
        if (!isTextPrimitive(category.name)) {
            errors.push(`Category ${categoryIndex + 1} name must be a string.`);
            return;
        }
        const rawName = cleanText(category.name);
        if (!rawName) {
            errors.push(`Category ${categoryIndex + 1} has a blank name.`);
            return;
        }
        if (rawName.length > LIMITS.categoryName) errors.push(`Category "${rawName.slice(0, 40)}" exceeds ${LIMITS.categoryName} characters.`);
        if (!Array.isArray(category.items)) {
            errors.push(`Category "${rawName}" requires an items array.`);
            return;
        }

        totalItems += category.items.length;
        const canonical = canonicalCategoryName(rawName);
        const categoryKey = identityKey(canonical);
        const isRoot = categoryKey === identityKey(ROOT_CATEGORY);
        if (!isRoot && categoryKeys.has(categoryKey)) errors.push(`Duplicate category name: ${rawName}.`);
        else if (!isRoot) categoryKeys.set(categoryKey, categoryIndex);

        const localItems = isRoot ? rootItems : new Set();
        category.items.forEach((item, itemIndex) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                errors.push(`Item ${itemIndex + 1} in "${rawName}" must be an object.`);
                return;
            }
            if (!isTextPrimitive(item.name)) {
                errors.push(`Item ${itemIndex + 1} in "${rawName}" name must be a string.`);
                return;
            }
            if (!isTextPrimitive(item.quantity, { allowNumber: true, optional: true })) {
                errors.push(`Quantity for item ${itemIndex + 1} in "${rawName}" must be text or a number.`);
                return;
            }
            if (!isTextPrimitive(item.remark, { allowNumber: true, optional: true })) {
                errors.push(`Remark for item ${itemIndex + 1} in "${rawName}" must be text or a number.`);
                return;
            }

            const name = cleanText(item.name);
            const quantity = normalizeQuantity(item.quantity);
            const remark = cleanText(item.remark);
            if (!name) {
                errors.push(`Item ${itemIndex + 1} in "${rawName}" has a blank name.`);
                return;
            }
            if (name.length > LIMITS.itemName) errors.push(`Item "${name.slice(0, 40)}" exceeds ${LIMITS.itemName} name characters.`);
            if (quantity.length > LIMITS.quantity) errors.push(`Quantity for "${name}" exceeds ${LIMITS.quantity} characters.`);
            if (remark.length > LIMITS.remark) errors.push(`Remark for "${name}" exceeds ${LIMITS.remark} characters.`);
            if (isNumericQuantity(quantity) && Number(quantity) <= 0) errors.push(`Numeric quantity for "${name}" must be greater than zero; delete depleted items instead.`);

            const itemKey = identityKey(name);
            if (localItems.has(itemKey)) errors.push(`Duplicate item "${name}" in category "${canonical}".`);
            else localItems.add(itemKey);
        });
    });

    if (totalItems > LIMITS.items) errors.push(`Inventory has too many items (${totalItems}; maximum ${LIMITS.items}).`);
    if (serializedLength(input) > LIMITS.serializedChars) errors.push(`Inventory exceeds the ${LIMITS.serializedChars.toLocaleString()} character safety limit.`);
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
            normalizedItems.push({ name, quantity: normalizeQuantity(item?.quantity), remark: cleanText(item?.remark) });
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

function packInventory(state) {
    const inventory = normalizeInventory(state);
    return inventory.categories.map(category => [
        category.name,
        category.items.map(item => [item.name, item.quantity, item.remark]),
    ]);
}

function unpackInventory(checkpoint) {
    if (checkpoint?.state) return validateAndNormalizeInventory(checkpoint.state);
    if (!Array.isArray(checkpoint?.packed)) throw new Error('Portable checkpoint has no state.');
    return validateAndNormalizeInventory({
        categories: checkpoint.packed.map(category => ({
            name: category?.[0],
            items: Array.isArray(category?.[1]) ? category[1].map(item => ({
                name: item?.[0], quantity: item?.[1], remark: item?.[2],
            })) : [],
        })),
    });
}

function makeRoot() {
    const initial = emptyInventory();
    return {
        version: STATE_VERSION,
        activeRevision: 0,
        durableRevision: 0,
        durableLength: 0,
        resolvedLength: 0,
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
                portable: true,
            },
        },
        branchHeads: {},
    };
}

export function getRevision(root, revisionId) {
    return root?.revisions?.[String(revisionId)] ?? null;
}

export function getInventoryAt(root, revisionId) {
    const revision = getRevision(root, revisionId);
    return revision ? clone(revision.state) : emptyInventory();
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

function activeMessageMeta(message) {
    return message?.extra?.[EXTRA_KEY] ?? null;
}

function messageFingerprintV2(message = {}) {
    const meta = activeMessageMeta(message);
    const swipe = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
    if (!message.is_user && !message.is_system && meta?.uid) return `a:${meta.uid}:${swipe}`;
    if (message.is_user) return `u:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? '') }))}`;
    if (message.is_system) return `s:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? '') }))}`;
    return `a0:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? ''), swipe }))}`;
}

function messageFingerprintLegacy(message = {}) {
    return hashString(JSON.stringify({
        user: Boolean(message.is_user), system: Boolean(message.is_system), name: String(message.name ?? ''),
        text: String(message.mes ?? ''), swipe: Number.isInteger(message.swipe_id) ? message.swipe_id : 0,
    }));
}

function rollHash(h1, h2, text) {
    const value = `${String(text ?? '')}\u241f`;
    let a = h1;
    let b = h2;
    for (let i = 0; i < value.length; i++) {
        const c = value.charCodeAt(i);
        a ^= c;
        a = Math.imul(a, 0x01000193);
        b ^= c + i;
        b = Math.imul(b, 0x85ebca6b);
    }
    return [a, b];
}

function lineageCacheToken(message = {}) {
    return {
        ref: message,
        user: Boolean(message.is_user),
        system: Boolean(message.is_system),
        name: String(message.name ?? ''),
        text: String(message.mes ?? ''),
        swipe: Number.isInteger(message.swipe_id) ? message.swipe_id : 0,
        uid: activeMessageMeta(message)?.uid ?? null,
    };
}

function lineageTokenMatches(message, token) {
    if (!token || token.ref !== message) return false;
    const meta = activeMessageMeta(message);
    return token.user === Boolean(message.is_user)
        && token.system === Boolean(message.is_system)
        && token.name === String(message.name ?? '')
        && token.text === String(message.mes ?? '')
        && token.swipe === (Number.isInteger(message.swipe_id) ? message.swipe_id : 0)
        && token.uid === (meta?.uid ?? null);
}

function lineageData(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const cached = lineageCache.get(chat);
    if (cached?.length === chat.length && cached.tokens.every((token, index) => lineageTokenMatches(chat[index], token))) return cached.data;
    const fingerprints = chat.map(messageFingerprintV2);
    const prefixKeys = ['root'];
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < fingerprints.length; i++) {
        [h1, h2] = rollHash(h1, h2, fingerprints[i]);
        prefixKeys.push(`${i + 1}:${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`);
    }
    const data = { fingerprints, prefixKeys };
    lineageCache.set(chat, { length: chat.length, tokens: chat.map(lineageCacheToken), data });
    return data;
}

function legacyHashLineage(list) {
    const values = Array.isArray(list) ? list : [];
    return values.length ? `${values.length}:${hashString(values.join('\u241f'))}` : 'root';
}

function legacyLineageHashThrough(context, messageId, fingerprints = null) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const values = fingerprints ?? chat.map(messageFingerprintLegacy);
    const last = Math.min(Number(messageId), chat.length - 1);
    if (last < 0) return 'root';
    return legacyHashLineage(values.slice(0, last + 1));
}

export function chatLineage(context) {
    return lineageData(context).fingerprints;
}

export function lineageHashThrough(context, messageId = null, prepared = null) {
    const data = prepared ?? lineageData(context);
    const last = messageId === null ? data.fingerprints.length - 1 : Math.min(Number(messageId), data.fingerprints.length - 1);
    return data.prefixKeys[Math.max(0, last + 1)] ?? 'root';
}

export function getBranchKey(context) {
    const data = lineageData(context);
    return data.prefixKeys.at(-1) ?? 'root';
}

function checkpointExpectedHash(context, messageId, checkpoint, prepared = null, legacyFingerprints = null) {
    const version = checkpoint?.lineageVersion ?? 1;
    return version === LINEAGE_VERSION
        ? lineageHashThrough(context, messageId, prepared)
        : legacyLineageHashThrough(context, messageId, legacyFingerprints);
}

function checkpointValidForMessage(context, messageId, checkpoint, prepared = null, legacyFingerprints = null) {
    if (!checkpoint || (!checkpoint.state && !checkpoint.packed)) return false;
    const expected = checkpointExpectedHash(context, messageId, checkpoint, prepared, legacyFingerprints);
    return !checkpoint.lineageHash || checkpoint.lineageHash === expected;
}

function compactRevisions(root) {
    const allIds = Object.keys(root.revisions).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
    const original = root.revisions;
    const totalBytes = allIds.reduce((sum, id) => sum + serializedBytes(original[String(id)]), 0);
    if (allIds.length <= LIMITS.revisions && totalBytes <= LIMITS.historyBytes) return;

    const keep = new Set();
    let usedBytes = 0;
    const tryKeep = (id, force = false) => {
        if (!Number.isInteger(id) || keep.has(id)) return false;
        const revision = original[String(id)];
        if (!revision) return false;
        const bytes = serializedBytes(revision);
        if (!force && (keep.size >= LIMITS.revisions || usedBytes + bytes > LIMITS.historyBytes)) return false;
        keep.add(id);
        usedBytes += bytes;
        return true;
    };

    tryKeep(0, true);
    tryKeep(root.activeRevision, true);
    tryKeep(root.durableRevision, true);
    const heads = Object.values(root.branchHeads ?? {})
        .filter(head => Number.isInteger(head?.revision) && original[String(head.revision)])
        .sort((a, b) => Number(Boolean(b?.sticky)) - Number(Boolean(a?.sticky)) || Number(b?.touchedAt ?? 0) - Number(a?.touchedAt ?? 0));
    for (const head of heads) tryKeep(head.revision);
    for (const id of [...allIds].sort((a, b) => b - a)) tryKeep(id);

    const nearestKeptParent = id => {
        let cursor = original[String(id)]?.parent;
        const seen = new Set();
        while (Number.isInteger(cursor) && !seen.has(cursor)) {
            if (keep.has(cursor)) return cursor;
            seen.add(cursor);
            cursor = original[String(cursor)]?.parent;
        }
        return 0;
    };
    const next = {};
    for (const id of [...keep].sort((a, b) => a - b)) {
        const revision = original[String(id)];
        if (!revision) continue;
        next[String(id)] = { ...revision, parent: id === 0 ? null : nearestKeptParent(id) };
    }
    root.revisions = next;
    root.branchHeads = Object.fromEntries(Object.entries(root.branchHeads ?? {}).filter(([, head]) => keep.has(head?.revision)));
}

function appendRevisionToRoot(root, state, { parent, source, note, portable = false, countMutation = true } = {}) {
    const normalized = validateAndNormalizeInventory(state);
    const id = root.nextRevision++;
    root.revisions[String(id)] = {
        id, parent, source: source || SOURCE.PORTABLE, note: cleanText(note),
        createdAt: new Date().toISOString(), state: normalized, portable: Boolean(portable),
        durable: isDurableSource(source),
    };
    root.activeRevision = id;
    if (isDurableSource(source)) root.durableRevision = id;
    if (countMutation) root.mutationSerial += 1;
    compactRevisions(root);
    return id;
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

function checkpointGroups(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const groups = new Map();
    const add = (key, holder, checkpoint, messageIndex, swipeIndex) => {
        if (!checkpoint) return;
        let group = groups.get(key);
        if (!group) {
            group = { key, holders: [], checkpoint, revision: checkpoint.revision, messageIndex, swipeIndex, bytes: 0 };
            groups.set(key, group);
        }
        group.holders.push(holder);
        group.bytes += serializedBytes(checkpoint);
        if (Number.isInteger(checkpoint.revision)) group.revision = checkpoint.revision;
    };
    for (let messageIndex = 0; messageIndex < chat.length; messageIndex++) {
        const message = chat[messageIndex];
        if (!message) continue;
        const activeSwipe = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;
        const messageCheckpoint = message.extra?.[EXTRA_KEY]?.checkpoint;
        if (messageCheckpoint) {
            const key = Array.isArray(message.swipes) && activeSwipe >= 0 && activeSwipe < message.swipes.length
                ? `m:${messageIndex}:s:${activeSwipe}`
                : `m:${messageIndex}:main`;
            add(key, message, messageCheckpoint, messageIndex, activeSwipe);
        }
        if (!Array.isArray(message.swipe_info)) continue;
        for (let swipeIndex = 0; swipeIndex < message.swipe_info.length; swipeIndex++) {
            const info = message.swipe_info[swipeIndex];
            const checkpoint = info?.extra?.[EXTRA_KEY]?.checkpoint;
            if (checkpoint) add(`m:${messageIndex}:s:${swipeIndex}`, info, checkpoint, messageIndex, swipeIndex);
        }
    }
    return [...groups.values()];
}

function removeCheckpointFromHolder(holder) {
    const meta = holder?.extra?.[EXTRA_KEY];
    if (!meta?.checkpoint) return;
    const next = { ...meta };
    delete next.checkpoint;
    if (Object.keys(next).length) holder.extra[EXTRA_KEY] = next;
    else delete holder.extra[EXTRA_KEY];
}

function compactPortableCheckpointsWithRoot(context, root, limit = LIMITS.portableCheckpoints) {
    const groups = checkpointGroups(context);
    const before = groups.length;
    const beforeBytes = groups.reduce((sum, group) => sum + group.bytes, 0);
    const cap = Math.max(1, Number(limit) || LIMITS.portableCheckpoints);
    const byteCap = LIMITS.portableCheckpointBytes;
    if (!before) return { before: 0, after: 0, limit: cap, beforeBytes: 0, afterBytes: 0, byteLimit: byteCap };

    const newest = [...groups].sort((a, b) =>
        b.messageIndex - a.messageIndex || b.swipeIndex - a.swipeIndex || Number(b.revision ?? -1) - Number(a.revision ?? -1));
    const keep = new Set();
    let usedBytes = 0;
    const tryKeep = (group, force = false) => {
        if (!group || keep.has(group.key)) return false;
        if (!force && (keep.size >= cap || usedBytes + group.bytes > byteCap)) return false;
        keep.add(group.key);
        usedBytes += group.bytes;
        return true;
    };
    const protectLatestRevision = (revision, length = null, force = false) => {
        if (!Number.isInteger(revision)) return;
        const candidates = newest.filter(group => group.revision === revision);
        const exact = Number.isInteger(length) ? candidates.find(group => group.messageIndex + 1 === length) : null;
        tryKeep(exact ?? candidates[0], force);
    };

    protectLatestRevision(root.activeRevision, null, true);
    protectLatestRevision(root.durableRevision, null, true);
    const heads = Object.values(root.branchHeads ?? {})
        .filter(head => Number.isInteger(head?.revision))
        .sort((a, b) => Number(Boolean(b?.sticky)) - Number(Boolean(a?.sticky)) || Number(b?.touchedAt ?? 0) - Number(a?.touchedAt ?? 0));
    for (const head of heads) protectLatestRevision(head.revision, head.length);
    for (const group of newest) tryKeep(group);

    for (const group of groups) {
        if (keep.has(group.key)) continue;
        for (const holder of group.holders) removeCheckpointFromHolder(holder);
    }

    const portableRevisions = new Set(groups.filter(group => keep.has(group.key) && Number.isInteger(group.revision)).map(group => group.revision));
    for (const revision of Object.values(root.revisions ?? {})) {
        if (revision && Number.isInteger(revision.id)) revision.portable = portableRevisions.has(revision.id);
    }
    const afterBytes = groups.filter(group => keep.has(group.key)).reduce((sum, group) => sum + group.bytes, 0);
    return { before, after: keep.size, limit: cap, beforeBytes, afterBytes, byteLimit: byteCap };
}

export function portableCheckpointCount(context) {
    return checkpointGroups(context).length;
}

export function portableCheckpointBytes(context) {
    return checkpointGroups(context).reduce((sum, group) => sum + group.bytes, 0);
}

export function compactPortableCheckpoints(context, limit = LIMITS.portableCheckpoints) {
    const root = ensureRoot(context);
    return compactPortableCheckpointsWithRoot(context, root, limit);
}

function stabilizeAssistantUids(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    let changed = false;
    for (const message of chat) {
        if (!message || message.is_user || message.is_system) continue;
        const meta = activeMessageMeta(message);
        if (!meta || meta.uid) continue;
        message.extra ??= {};
        message.extra[EXTRA_KEY] = { ...meta, uid: randomUid() };
        ensureSwipeInfo(message);
        changed = true;
    }
    if (changed) invalidateLineageCache(context);
}

function pruneBranchHeads(root) {
    const entries = Object.entries(root.branchHeads ?? {});
    if (entries.length <= LIMITS.branchHeads) return;
    const sortRecent = list => list.sort((a, b) => Number(b[1]?.touchedAt ?? 0) - Number(a[1]?.touchedAt ?? 0));
    const sticky = sortRecent(entries.filter(([, head]) => head?.sticky)).slice(0, LIMITS.stickyBranchHeads);
    const stickyKeys = new Set(sticky.map(([key]) => key));
    const others = sortRecent(entries.filter(([key]) => !stickyKeys.has(key))).slice(0, Math.max(0, LIMITS.branchHeads - sticky.length));
    root.branchHeads = Object.fromEntries([...sticky, ...others].slice(0, LIMITS.branchHeads));
}

function hydratePortableTimeline(context, root) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    if (!chat.length) return false;
    stabilizeAssistantUids(context);
    const data = lineageData(context);
    const legacyFingerprints = chat.map(messageFingerprintLegacy);
    let currentRevision = 0;
    let currentState = getInventoryAt(root, 0);
    let foundCheckpoint = false;

    for (let index = 0; index < chat.length; index++) {
        const message = chat[index];
        const meta = activeMessageMeta(message);
        const beforeRevision = currentRevision;
        const checkpoint = meta?.checkpoint;
        if (checkpoint && checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) {
            try {
                const checkpointState = unpackInventory(checkpoint);
                if (!inventoryEquals(currentState, checkpointState)) {
                    currentRevision = appendRevisionToRoot(root, checkpointState, {
                        parent: currentRevision, source: checkpoint.source || SOURCE.PORTABLE,
                        note: checkpoint.note || 'Recovered portable inventory checkpoint', portable: true, countMutation: false,
                    });
                    currentState = checkpointState;
                }
                if (checkpoint.durable === true) {
                    const recovered = getRevision(root, currentRevision);
                    if (recovered) recovered.durable = true;
                    root.durableRevision = currentRevision;
                    root.durableLength = index + 1;
                }
                foundCheckpoint = true;
                checkpoint.revision = currentRevision;
                checkpoint.lineageHash = data.prefixKeys[index + 1] ?? 'root';
                checkpoint.lineageVersion = LINEAGE_VERSION;
            } catch { /* damaged checkpoint ignored */ }
        }
        if (message && !message.is_user && !message.is_system && meta) {
            const liveMeta = activeMessageMeta(message) ?? meta;
            message.extra ??= {};
            message.extra[EXTRA_KEY] = {
                ...liveMeta, uid: liveMeta.uid || randomUid(), baseRevision: beforeRevision,
                revision: currentRevision, lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION,
            };
            ensureSwipeInfo(message);
        }
    }
    if (foundCheckpoint) {
        root.activeRevision = currentRevision;
        root.resolvedLength = chat.length;
        const key = data.prefixKeys.at(-1) ?? 'root';
        root.branchHeads[key] = { revision: currentRevision, length: chat.length, sticky: true, touchedAt: Date.now(), lineageVersion: LINEAGE_VERSION };
        pruneBranchHeads(root);
        compactRevisions(root);
    }
    return foundCheckpoint;
}

export function ensureRoot(context) {
    if (!context?.chatMetadata) throw new Error('No active SillyTavern chat metadata.');
    let root = context.chatMetadata[META_KEY];
    if (!root) {
        root = makeRoot();
        context.chatMetadata[META_KEY] = root;
        hydratePortableTimeline(context, root);
    } else if (root.version !== STATE_VERSION) {
        throw new Error(`Unsupported Inventory Block state version ${root.version ?? 'unknown'}; expected ${STATE_VERSION}. State was not reset.`);
    } else if (!root.revisions || !root.revisions['0']) {
        throw new Error('Inventory Block state is damaged: initial revision is missing. State was not reset.');
    }
    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;
    for (const revision of Object.values(root.revisions)) {
        if (revision && isDurableSource(revision.source)) revision.durable = true;
    }
    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {
        const durableIds = Object.values(root.revisions)
            .filter(revision => revision && Number.isInteger(revision.id) && revision.durable === true)
            .map(revision => revision.id)
            .sort((a, b) => a - b);
        root.durableRevision = durableIds.at(-1) ?? 0;
    }
    if (!Number.isInteger(root.durableLength) || root.durableLength < 0) {
        root.durableLength = root.durableRevision === 0 ? 0 : (Array.isArray(context.chat) ? context.chat.length : 0);
    }
    if (!Number.isInteger(root.resolvedLength) || root.resolvedLength < 0) {
        root.resolvedLength = Array.isArray(context.chat) ? context.chat.length : 0;
    }
    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));
    if (!Number.isInteger(root.nextRevision) || root.nextRevision <= maxRevisionId) root.nextRevision = maxRevisionId + 1;
    if (!Number.isInteger(root.mutationSerial) || root.mutationSerial < 0) root.mutationSerial = Math.max(0, root.nextRevision - 1);
    if (!root.branchHeads || typeof root.branchHeads !== 'object' || Array.isArray(root.branchHeads)) root.branchHeads = {};
    pruneBranchHeads(root);
    compactRevisions(root);
    return root;
}

export function getCurrentInventory(context) {
    const root = ensureRoot(context);
    return getInventoryAt(root, root.activeRevision);
}

export function markDurableRevision(context, revisionId = null) {
    const root = ensureRoot(context);
    const id = revisionId === null ? root.activeRevision : Number(revisionId);
    if (!Number.isInteger(id) || !getRevision(root, id)) throw new Error(`Cannot mark missing inventory revision ${revisionId} as durable.`);
    const revision = getRevision(root, id);
    revision.durable = true;
    root.durableRevision = id;
    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;
    root.resolvedLength = root.durableLength;
    compactRevisions(root);
    return id;
}

export function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {
    const root = ensureRoot(context);
    const parentId = parent === null ? root.activeRevision : parent;
    if (!getRevision(root, parentId)) throw new Error(`Cannot create inventory revision from missing parent ${parentId}.`);
    const revision = appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });
    root.resolvedLength = Array.isArray(context?.chat) ? context.chat.length : 0;
    if (isDurableSource(source)) root.durableLength = root.resolvedLength;
    return revision;
}

export function rememberBranchHead(context, revisionId = null) {
    const root = ensureRoot(context);
    const id = revisionId === null ? root.activeRevision : revisionId;
    if (!getRevision(root, id)) return;
    const data = lineageData(context);
    const key = data.prefixKeys.at(-1) ?? 'root';
    const revision = getRevision(root, id);
    const sticky = revision?.durable === true
        || [SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET].includes(revision?.source);
    root.branchHeads[key] = { revision: id, length: data.fingerprints.length, sticky, touchedAt: Date.now(), lineageVersion: LINEAGE_VERSION };
    pruneBranchHeads(root);
    compactRevisions(root);
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

function nearestDurableAncestor(root, revisionId) {
    const seen = new Set();
    let cursor = revisionId;
    while (Number.isInteger(cursor) && !seen.has(cursor)) {
        seen.add(cursor);
        const revision = getRevision(root, cursor);
        if (!revision) return null;
        if (revision.durable === true || isDurableSource(revision.source)) return cursor;
        cursor = revision.parent;
    }
    return null;
}

function expectedMetaHash(context, index, meta, data, legacyFingerprints) {
    return (meta?.lineageVersion ?? 1) === LINEAGE_VERSION
        ? data.prefixKeys[index + 1]
        : legacyLineageHashThrough(context, index, legacyFingerprints);
}

function validMessageRevision(root, meta, currentRevision, expectedLineageHash) {
    if (!meta || !Number.isInteger(meta.baseRevision) || !Number.isInteger(meta.revision)) return false;
    if (meta.baseRevision !== currentRevision) return false;
    if (meta.lineageHash && meta.lineageHash !== expectedLineageHash) return false;
    if (!getRevision(root, meta.revision)) return false;
    return revisionDescendsFrom(root, meta.revision, meta.baseRevision);
}

function updateCheckpointReference(checkpoint, revision, data, index) {
    checkpoint.revision = revision;
    checkpoint.lineageHash = data.prefixKeys[index + 1] ?? 'root';
    checkpoint.lineageVersion = LINEAGE_VERSION;
}

function materializeCheckpoint(context, root, index, currentRevision, checkpoint, data, legacyFingerprints) {
    if (!checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return null;
    try {
        const state = unpackInventory(checkpoint);
        const currentState = getInventoryAt(root, currentRevision);
        const revision = inventoryEquals(currentState, state)
            ? currentRevision
            : appendRevisionToRoot(root, state, {
                parent: currentRevision, source: checkpoint.source || SOURCE.PORTABLE,
                note: checkpoint.note || 'Recovered portable inventory checkpoint', portable: true, countMutation: false,
            });
        if (checkpoint.durable === true) {
            const recovered = getRevision(root, revision);
            if (recovered) recovered.durable = true;
            root.durableRevision = revision;
            root.durableLength = index + 1;
        }
        updateCheckpointReference(checkpoint, revision, data, index);
        return revision;
    } catch { return null; }
}

function materializePortableAssistant(context, root, index, currentRevision, meta, data, legacyFingerprints) {
    const message = context?.chat?.[index];
    if (!message || message.is_user || message.is_system || !meta) return null;
    const checkpoint = meta.checkpoint;
    if (checkpoint) {
        const revision = materializeCheckpoint(context, root, index, currentRevision, checkpoint, data, legacyFingerprints);
        if (revision !== null) {
            message.extra ??= {};
            message.extra[EXTRA_KEY] = {
                ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision,
                lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION, checkpoint,
            };
            ensureSwipeInfo(message);
            return revision;
        }
    }
    if ((meta.lineageVersion ?? 1) === LINEAGE_VERSION && meta.revision === meta.baseRevision) {
        message.extra ??= {};
        message.extra[EXTRA_KEY] = {
            ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision: currentRevision,
            lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION,
        };
        ensureSwipeInfo(message);
        return currentRevision;
    }
    return null;
}

function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant, data, legacyFingerprints) {
    const message = context?.chat?.[index];
    const checkpoint = activeMessageMeta(message)?.checkpoint;
    if (!checkpoint || !checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return currentRevision;
    const id = checkpoint.revision;
    if (Number.isInteger(id) && getRevision(root, id) && (id === currentRevision || revisionDescendsFrom(root, id, currentRevision))) {
        if (afterAssistant || message?.is_user || message?.is_system) return id;
        return currentRevision;
    }
    if (!(afterAssistant || message?.is_user || message?.is_system)) return currentRevision;
    const recovered = materializeCheckpoint(context, root, index, currentRevision, checkpoint, data, legacyFingerprints);
    return recovered === null ? currentRevision : recovered;
}

function resolveRevisionThrough(context, maxLength, { commitActive = false, allowDurableFallback = true } = {}) {
    const root = ensureRoot(context);
    stabilizeAssistantUids(context);
    const data = lineageData(context);
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const end = Math.max(0, Math.min(chat.length, Number.isInteger(Number(maxLength)) ? Number(maxLength) : chat.length));
    const legacyFingerprints = chat.map(messageFingerprintLegacy);
    const legacyPrefix = length => legacyHashLineage(legacyFingerprints.slice(0, length));
    const previousActive = root.activeRevision;
    const previousLength = Number.isInteger(root.resolvedLength) && root.resolvedLength >= 0 ? root.resolvedLength : end;

    let bestHead = null;
    let bestLength = -1;
    for (const [branchKey, head] of Object.entries(root.branchHeads)) {
        if (!Number.isInteger(head?.revision) || !getRevision(root, head.revision)) continue;
        const length = Number.isInteger(head.length) ? head.length : Number.parseInt(String(branchKey).split(':', 1)[0], 10);
        if (!Number.isInteger(length) || length < 0 || length > end || length <= bestLength) continue;
        const expectedKey = (head.lineageVersion ?? 1) === LINEAGE_VERSION ? data.prefixKeys[length] : legacyPrefix(length);
        if (expectedKey !== branchKey) continue;
        bestHead = head;
        bestLength = length;
    }

    let revision = bestHead?.revision ?? 0;
    const startIndex = bestLength >= 0 ? bestLength : 0;
    if (bestHead && commitActive) bestHead.touchedAt = Date.now();
    for (let index = startIndex; index < end; index++) {
        const message = chat[index];
        if (!message) continue;
        if (message.is_user || message.is_system) {
            revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints);
            continue;
        }
        const meta = activeMessageMeta(message);
        if (!meta) continue;
        const expectedLineageHash = expectedMetaHash(context, index, meta, data, legacyFingerprints);
        if (!validMessageRevision(root, meta, revision, expectedLineageHash)) {
            const recovered = materializePortableAssistant(context, root, index, revision, meta, data, legacyFingerprints);
            if (recovered === null) break;
            revision = recovered;
            continue;
        }
        revision = meta.revision;
        revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints);
    }

    // Deleting messages shortens the active timeline. Preserve the nearest explicit
    // seed/admin ancestor of the branch that was active immediately before deletion,
    // but only if normal reconstruction landed on that ancestor or one of its parents.
    // This is branch-specific: switching swipes at the same length never triggers it.
    const branchDurable = commitActive && end < previousLength
        ? nearestDurableAncestor(root, previousActive)
        : null;
    if (branchDurable !== null
        && (revision === 0 || revision === branchDurable || revisionDescendsFrom(root, branchDurable, revision))) {
        revision = branchDurable;
    }

    const durableRevision = Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)
        ? root.durableRevision
        : null;
    const durableLength = Number.isInteger(root.durableLength) && root.durableLength >= 0 ? root.durableLength : 0;
    if (allowDurableFallback && durableRevision !== null && branchDurable === null) {
        // Generic anti-empty recovery is allowed only if the durable state already
        // existed by this boundary. Later admin changes never leak backward.
        if (revision === 0 && durableLength <= end) revision = durableRevision;
    }

    if (commitActive) {
        root.activeRevision = revision;
        root.resolvedLength = end;
        compactRevisions(root);
        compactPortableCheckpointsWithRoot(context, root);
    } else {
        root.activeRevision = getRevision(root, previousActive) ? previousActive : revision;
    }
    return revision;
}

export function resolveRevisionBeforeMessage(context, messageId) {
    const id = Number(messageId);
    const length = Number.isInteger(id) ? Math.max(0, id) : 0;
    return resolveRevisionThrough(context, length, { commitActive: false });
}

export function resolveActiveRevision(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    return resolveRevisionThrough(context, chat.length, { commitActive: true });
}

export function attachPortableCheckpoint(context, messageId, revisionId, { source = null, note = '' } = {}) {
    const root = ensureRoot(context);
    const message = context?.chat?.[messageId];
    const revision = getRevision(root, revisionId);
    if (!message || !revision) return null;
    message.extra ??= {};
    let current = message.extra[EXTRA_KEY] ?? {};
    if (!message.is_user && !message.is_system && !current.uid) {
        current = { ...current, uid: randomUid() };
        message.extra[EXTRA_KEY] = current;
        invalidateLineageCache(context);
    }
    const data = lineageData(context);
    const checkpoint = {
        packed: packInventory(revision.state),
        revision: revisionId,
        source: source || revision.source || SOURCE.PORTABLE,
        durable: revision.durable === true,
        note: cleanText(note || revision.note),
        lineageHash: data.prefixKeys[Math.min(messageId + 1, data.prefixKeys.length - 1)] ?? 'root',
        lineageVersion: LINEAGE_VERSION,
    };
    message.extra[EXTRA_KEY] = { ...current, checkpoint };
    revision.portable = true;
    ensureSwipeInfo(message);
    compactPortableCheckpointsWithRoot(context, root);
    return checkpoint;
}

export function attachMessageRevision(context, messageId, { baseRevision, revision, newUid = false, portable = false } = {}) {
    const message = context?.chat?.[messageId];
    if (!message) return null;
    message.extra ??= {};
    const current = message.extra[EXTRA_KEY] ?? {};
    const preserved = { ...current };
    if (newUid) {
        delete preserved.checkpoint;
        delete preserved.reconcile;
    }
    const uid = newUid || !current.uid ? randomUid() : current.uid;
    message.extra[EXTRA_KEY] = {
        ...preserved, uid,
        baseRevision: Number.isInteger(baseRevision) ? baseRevision : 0,
        revision: Number.isInteger(revision) ? revision : 0,
        lineageVersion: LINEAGE_VERSION,
    };
    if (uid !== current.uid) invalidateLineageCache(context);
    const data = lineageData(context);
    message.extra[EXTRA_KEY].lineageHash = data.prefixKeys[Math.min(messageId + 1, data.prefixKeys.length - 1)] ?? 'root';
    if (portable) attachPortableCheckpoint(context, messageId, revision, { source: getRevision(ensureRoot(context), revision)?.source });
    ensureSwipeInfo(message);
    return message.extra[EXTRA_KEY];
}

function attachCurrentRevisionToTail(context, revisionId, source, note) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    if (!chat.length) return;
    attachPortableCheckpoint(context, chat.length - 1, revisionId, { source, note });
}

export function commitManualState(context, state, {
    source = SOURCE.MANUAL,
    note = 'Manual inventory edit',
    expectedRevision = null,
    expectedMutationSerial = null,
} = {}) {
    const root = ensureRoot(context);
    if (expectedRevision !== null && root.activeRevision !== expectedRevision) {
        throw new Error('Inventory changed while the editor was open. Reopen the editor to avoid overwriting newer state.');
    }
    if (expectedMutationSerial !== null && root.mutationSerial !== expectedMutationSerial) {
        throw new Error('Inventory changed while the editor was open. Reopen the editor to avoid overwriting newer state.');
    }
    const normalized = validateAndNormalizeInventory(state);
    const previous = getInventoryAt(root, root.activeRevision);
    if (inventoryEquals(previous, normalized)) {
        const active = getRevision(root, root.activeRevision);
        if (active) active.durable = true;
        root.durableRevision = root.activeRevision;
        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;
        root.resolvedLength = root.durableLength;
        compactRevisions(root);
        return root.activeRevision;
    }
    const revision = createRevision(context, normalized, { parent: root.activeRevision, source, note });
    attachCurrentRevisionToTail(context, revision, source, note);
    rememberBranchHead(context, revision);
    return revision;
}

export function restoreRevisionAsNew(context, revisionId) {
    const root = ensureRoot(context);
    const target = getRevision(root, revisionId);
    if (!target) throw new Error(`Inventory revision ${revisionId} does not exist.`);
    return commitManualState(context, target.state, { source: SOURCE.RESTORE, note: `Restored revision ${revisionId}` });
}

export function listRevisions(context, limit = LIMITS.history) {
    const root = ensureRoot(context);
    const capped = Math.min(LIMITS.history, Math.max(1, Number(limit) || LIMITS.history));
    return Object.values(root.revisions)
        .filter(revision => revision && Number.isInteger(revision.id))
        .sort((a, b) => b.id - a.id)
        .slice(0, capped)
        .map(revision => ({ id: revision.id, parent: revision.parent, source: revision.source, note: revision.note, createdAt: revision.createdAt }));
}

export function revisionCount(context) {
    return Object.keys(ensureRoot(context).revisions).length;
}

export function revisionHistoryBytes(context) {
    const root = ensureRoot(context);
    return Object.values(root.revisions).reduce((sum, revision) => sum + serializedBytes(revision), 0);
}
