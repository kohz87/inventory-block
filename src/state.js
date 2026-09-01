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

export function emptyInventory() {
    return { categories: [] };
}

function cleanText(value) {
    return String(value ?? '').replace(/\r?\n/g, ' ').trim();
}

function keyOf(value) {
    return cleanText(value).toLocaleLowerCase();
}

function isTextPrimitive(value, { allowNumber = false, optional = false } = {}) {
    if (optional && (value === undefined || value === null)) return true;
    return typeof value === 'string' || (allowNumber && typeof value === 'number' && Number.isFinite(value));
}

function serializedLength(input) {
    try {
        return JSON.stringify(input).length;
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

function isNumericQuantity(value) {
    return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(value ?? '').trim());
}

export function canonicalCategoryName(value) {
    const clean = cleanText(value);
    return ROOT_ALIASES.has(clean.toLocaleLowerCase()) ? ROOT_CATEGORY : clean;
}

export function normalizeQuantity(value) {
    const clean = cleanText(value);
    return clean.replace(/^[×xX]\s*(?=[+-]?(?:\d|\.\d))/, '').trim();
}

export function validateInventory(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return ['Inventory must be an object.'];
    }
    if (!Array.isArray(input.categories)) {
        return ['Inventory requires a categories array.'];
    }
    if (input.categories.length > LIMITS.categories) {
        errors.push(`Inventory has too many categories (${input.categories.length}; maximum ${LIMITS.categories}).`);
    }

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
        if (rawName.length > LIMITS.categoryName) {
            errors.push(`Category "${rawName.slice(0, 40)}" exceeds ${LIMITS.categoryName} characters.`);
        }
        if (!Array.isArray(category.items)) {
            errors.push(`Category "${rawName}" requires an items array.`);
            return;
        }

        totalItems += category.items.length;
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
            if (isNumericQuantity(quantity) && Number(quantity) <= 0) {
                errors.push(`Numeric quantity for "${name}" must be greater than zero; delete depleted items instead.`);
            }

            const itemKey = keyOf(name);
            if (localItems.has(itemKey)) {
                errors.push(`Duplicate item "${name}" in category "${canonical}".`);
            } else {
                localItems.add(itemKey);
            }
        });
    });

    if (totalItems > LIMITS.items) {
        errors.push(`Inventory has too many items (${totalItems}; maximum ${LIMITS.items}).`);
    }
    if (serializedLength(input) > LIMITS.serializedChars) {
        errors.push(`Inventory exceeds the ${LIMITS.serializedChars.toLocaleString()} character safety limit.`);
    }

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
    if (message.is_user) {
        return `u:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? '') }))}`;
    }
    if (message.is_system) {
        return `s:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? '') }))}`;
    }
    return `a0:${hashString(JSON.stringify({ name: String(message.name ?? ''), text: String(message.mes ?? ''), swipe }))}`;
}

function messageFingerprintLegacy(message = {}) {
    return hashString(JSON.stringify({
        user: Boolean(message.is_user),
        system: Boolean(message.is_system),
        name: String(message.name ?? ''),
        text: String(message.mes ?? ''),
        swipe: Number.isInteger(message.swipe_id) ? message.swipe_id : 0,
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

function lineageData(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const fingerprints = chat.map(messageFingerprintV2);
    const prefixKeys = ['root'];
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < fingerprints.length; i++) {
        [h1, h2] = rollHash(h1, h2, fingerprints[i]);
        prefixKeys.push(`${i + 1}:${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`);
    }
    return { fingerprints, prefixKeys };
}

function legacyHashLineage(list) {
    const values = Array.isArray(list) ? list : [];
    return values.length ? `${values.length}:${hashString(values.join('\u241f'))}` : 'root';
}

function legacyLineageHashThrough(context, messageId) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const last = Math.min(Number(messageId), chat.length - 1);
    if (last < 0) return 'root';
    return legacyHashLineage(chat.slice(0, last + 1).map(messageFingerprintLegacy));
}

export function chatLineage(context) {
    return lineageData(context).fingerprints;
}

export function lineageHashThrough(context, messageId = null) {
    const data = lineageData(context);
    const last = messageId === null ? data.fingerprints.length - 1 : Math.min(Number(messageId), data.fingerprints.length - 1);
    return data.prefixKeys[Math.max(0, last + 1)] ?? 'root';
}

export function getBranchKey(context) {
    const data = lineageData(context);
    return data.prefixKeys.at(-1) ?? 'root';
}

function checkpointValidForMessage(context, messageId, checkpoint) {
    if (!checkpoint?.state) return false;
    const version = checkpoint.lineageVersion ?? 1;
    const expected = version === LINEAGE_VERSION
        ? lineageHashThrough(context, messageId)
        : legacyLineageHashThrough(context, messageId);
    return !checkpoint.lineageHash || checkpoint.lineageHash === expected;
}

function appendRevisionToRoot(root, state, { parent, source, note, portable = false, countMutation = true } = {}) {
    const normalized = validateAndNormalizeInventory(state);
    const id = root.nextRevision++;
    root.revisions[String(id)] = {
        id,
        parent,
        source: source || SOURCE.PORTABLE,
        note: cleanText(note),
        createdAt: new Date().toISOString(),
        state: normalized,
        portable: Boolean(portable),
    };
    root.activeRevision = id;
    if (countMutation) root.mutationSerial += 1;
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

function hydratePortableTimeline(context, root) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    if (!chat.length) return false;

    let currentRevision = 0;
    let currentState = getInventoryAt(root, 0);
    let foundCheckpoint = false;

    for (let index = 0; index < chat.length; index++) {
        const message = chat[index];
        const meta = activeMessageMeta(message);
        const beforeRevision = currentRevision;
        const checkpoint = meta?.checkpoint;

        if (checkpoint && checkpointValidForMessage(context, index, checkpoint)) {
            try {
                const checkpointState = validateAndNormalizeInventory(checkpoint.state);
                if (!inventoryEquals(currentState, checkpointState)) {
                    currentRevision = appendRevisionToRoot(root, checkpointState, {
                        parent: currentRevision,
                        source: checkpoint.source || SOURCE.PORTABLE,
                        note: checkpoint.note || 'Recovered portable inventory checkpoint',
                        portable: true,
                        countMutation: false,
                    });
                    currentState = checkpointState;
                }
                foundCheckpoint = true;
                checkpoint.revision = currentRevision;
                checkpoint.lineageHash = lineageHashThrough(context, index);
                checkpoint.lineageVersion = LINEAGE_VERSION;
            } catch {
                // Ignore damaged portable checkpoints and keep searching later messages.
            }
        }

        if (message && !message.is_user && !message.is_system && meta) {
            const uid = meta.uid || randomUid();
            message.extra ??= {};
            message.extra[EXTRA_KEY] = {
                ...meta,
                uid,
                baseRevision: beforeRevision,
                revision: currentRevision,
                lineageHash: lineageHashThrough(context, index),
                lineageVersion: LINEAGE_VERSION,
            };
            ensureSwipeInfo(message);
        }
    }

    if (foundCheckpoint) {
        root.activeRevision = currentRevision;
        const data = lineageData(context);
        const key = data.prefixKeys.at(-1) ?? 'root';
        root.branchHeads[key] = {
            revision: currentRevision,
            length: chat.length,
            sticky: true,
            touchedAt: Date.now(),
            lineageVersion: LINEAGE_VERSION,
        };
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
    if (!Number.isInteger(root.nextRevision) || root.nextRevision < 1) {
        root.nextRevision = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isFinite)) + 1;
    }
    if (!Number.isInteger(root.mutationSerial) || root.mutationSerial < 0) root.mutationSerial = Math.max(0, root.nextRevision - 1);
    if (!root.branchHeads || typeof root.branchHeads !== 'object' || Array.isArray(root.branchHeads)) root.branchHeads = {};
    return root;
}

export function getCurrentInventory(context) {
    const root = ensureRoot(context);
    return getInventoryAt(root, root.activeRevision);
}

export function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {
    const root = ensureRoot(context);
    const parentId = parent === null ? root.activeRevision : parent;
    if (!getRevision(root, parentId)) throw new Error(`Cannot create inventory revision from missing parent ${parentId}.`);
    return appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });
}

function pruneBranchHeads(root) {
    const entries = Object.entries(root.branchHeads);
    if (entries.length <= LIMITS.branchHeads) return;

    const sortRecent = list => list.sort((a, b) => Number(b[1]?.touchedAt ?? 0) - Number(a[1]?.touchedAt ?? 0));
    const sticky = sortRecent(entries.filter(([, head]) => head?.sticky)).slice(0, LIMITS.stickyBranchHeads);
    const stickyKeys = new Set(sticky.map(([key]) => key));
    const others = sortRecent(entries.filter(([key]) => !stickyKeys.has(key))).slice(0, Math.max(0, LIMITS.branchHeads - sticky.length));
    root.branchHeads = Object.fromEntries([...sticky, ...others].slice(0, LIMITS.branchHeads));
}

export function rememberBranchHead(context, revisionId = null) {
    const root = ensureRoot(context);
    const id = revisionId === null ? root.activeRevision : revisionId;
    if (!getRevision(root, id)) return;
    const data = lineageData(context);
    const key = data.prefixKeys.at(-1) ?? 'root';
    const revision = getRevision(root, id);
    const sticky = [SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET].includes(revision?.source);
    root.branchHeads[key] = {
        revision: id,
        length: data.fingerprints.length,
        sticky,
        touchedAt: Date.now(),
        lineageVersion: LINEAGE_VERSION,
    };
    pruneBranchHeads(root);
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

function expectedMetaHash(context, index, meta, v2Data) {
    return (meta?.lineageVersion ?? 1) === LINEAGE_VERSION
        ? v2Data.prefixKeys[index + 1]
        : legacyLineageHashThrough(context, index);
}

function validMessageRevision(root, meta, currentRevision, expectedLineageHash) {
    if (!meta || !Number.isInteger(meta.baseRevision) || !Number.isInteger(meta.revision)) return false;
    if (meta.baseRevision !== currentRevision) return false;
    if (meta.lineageHash && meta.lineageHash !== expectedLineageHash) return false;
    if (!getRevision(root, meta.revision)) return false;
    return revisionDescendsFrom(root, meta.revision, meta.baseRevision);
}

function materializePortableAssistant(context, root, index, currentRevision, meta) {
    const message = context?.chat?.[index];
    if (!message || message.is_user || message.is_system || !meta) return null;
    const checkpoint = meta.checkpoint;
    if (checkpoint && checkpointValidForMessage(context, index, checkpoint)) {
        try {
            const state = validateAndNormalizeInventory(checkpoint.state);
            const currentState = getInventoryAt(root, currentRevision);
            const revision = inventoryEquals(currentState, state)
                ? currentRevision
                : appendRevisionToRoot(root, state, {
                    parent: currentRevision,
                    source: checkpoint.source || SOURCE.PORTABLE,
                    note: checkpoint.note || 'Recovered portable swipe checkpoint',
                    portable: true,
                    countMutation: false,
                });
            message.extra ??= {};
            message.extra[EXTRA_KEY] = {
                ...meta,
                baseRevision: currentRevision,
                revision,
                lineageHash: lineageHashThrough(context, index),
                lineageVersion: LINEAGE_VERSION,
                checkpoint: {
                    ...checkpoint,
                    state: clone(state),
                    revision,
                    lineageHash: lineageHashThrough(context, index),
                    lineageVersion: LINEAGE_VERSION,
                },
            };
            ensureSwipeInfo(message);
            return revision;
        } catch {
            return null;
        }
    }

    if ((meta.lineageVersion ?? 1) === LINEAGE_VERSION && meta.revision === meta.baseRevision) {
        message.extra ??= {};
        message.extra[EXTRA_KEY] = {
            ...meta,
            baseRevision: currentRevision,
            revision: currentRevision,
            lineageHash: lineageHashThrough(context, index),
            lineageVersion: LINEAGE_VERSION,
        };
        ensureSwipeInfo(message);
        return currentRevision;
    }
    return null;
}

function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant = false) {
    const message = context?.chat?.[index];
    const checkpoint = activeMessageMeta(message)?.checkpoint;
    if (!checkpoint || !checkpointValidForMessage(context, index, checkpoint)) return currentRevision;
    const id = checkpoint.revision;
    if (!Number.isInteger(id) || !getRevision(root, id)) return currentRevision;
    if (id === currentRevision) return currentRevision;
    if (!revisionDescendsFrom(root, id, currentRevision)) return currentRevision;
    if (afterAssistant || message?.is_user || message?.is_system) return id;
    return currentRevision;
}

export function resolveActiveRevision(context) {
    const root = ensureRoot(context);
    const data = lineageData(context);
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    let legacyFingerprints = null;
    const legacyPrefix = length => {
        if (!legacyFingerprints) legacyFingerprints = chat.map(messageFingerprintLegacy);
        return legacyHashLineage(legacyFingerprints.slice(0, length));
    };

    let bestHead = null;
    let bestLength = -1;
    for (const [key, head] of Object.entries(root.branchHeads)) {
        if (!Number.isInteger(head?.revision) || !getRevision(root, head.revision)) continue;
        const length = Number.isInteger(head.length) ? head.length : Number.parseInt(String(key).split(':', 1)[0], 10);
        if (!Number.isInteger(length) || length < 0 || length > data.fingerprints.length || length <= bestLength) continue;
        const expectedKey = (head.lineageVersion ?? 1) === LINEAGE_VERSION ? data.prefixKeys[length] : legacyPrefix(length);
        if (expectedKey !== key) continue;
        bestHead = head;
        bestLength = length;
    }

    let revision = bestHead?.revision ?? 0;
    let startIndex = bestLength >= 0 ? bestLength : 0;
    if (bestHead) bestHead.touchedAt = Date.now();

    for (let index = startIndex; index < chat.length; index++) {
        const message = chat[index];
        if (!message) continue;

        if (message.is_user || message.is_system) {
            revision = checkpointRevisionIfValid(context, root, index, revision, true);
            continue;
        }

        const meta = activeMessageMeta(message);
        if (!meta) continue;
        const expectedLineageHash = expectedMetaHash(context, index, meta, data);
        if (!validMessageRevision(root, meta, revision, expectedLineageHash)) {
            const recovered = materializePortableAssistant(context, root, index, revision, meta);
            if (recovered === null) break;
            revision = recovered;
            continue;
        }
        revision = meta.revision;
        revision = checkpointRevisionIfValid(context, root, index, revision, true);
    }

    root.activeRevision = revision;
    return revision;
}

export function attachPortableCheckpoint(context, messageId, revisionId, { source = null, note = '' } = {}) {
    const root = ensureRoot(context);
    const message = context?.chat?.[messageId];
    const revision = getRevision(root, revisionId);
    if (!message || !revision) return null;
    message.extra ??= {};
    const current = message.extra[EXTRA_KEY] ?? {};
    const checkpoint = {
        state: clone(revision.state),
        revision: revisionId,
        source: source || revision.source || SOURCE.PORTABLE,
        note: cleanText(note || revision.note),
        lineageHash: lineageHashThrough(context, messageId),
        lineageVersion: LINEAGE_VERSION,
    };
    message.extra[EXTRA_KEY] = { ...current, checkpoint };
    revision.portable = true;
    ensureSwipeInfo(message);
    return checkpoint;
}

export function attachMessageRevision(context, messageId, { baseRevision, revision, newUid = false, portable = false } = {}) {
    const message = context?.chat?.[messageId];
    if (!message) return null;
    message.extra ??= {};
    const current = message.extra[EXTRA_KEY] ?? {};
    const preserved = { ...current };
    if (newUid) delete preserved.checkpoint;
    const uid = newUid || !current.uid ? randomUid() : current.uid;
    message.extra[EXTRA_KEY] = {
        ...preserved,
        uid,
        baseRevision: Number.isInteger(baseRevision) ? baseRevision : 0,
        revision: Number.isInteger(revision) ? revision : 0,
        lineageVersion: LINEAGE_VERSION,
    };
    message.extra[EXTRA_KEY].lineageHash = lineageHashThrough(context, messageId);
    if (portable) attachPortableCheckpoint(context, messageId, revision, { source: getRevision(ensureRoot(context), revision)?.source });
    ensureSwipeInfo(message);
    return message.extra[EXTRA_KEY];
}

function attachCurrentRevisionToTail(context, revisionId, source, note) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    if (!chat.length) return;
    attachPortableCheckpoint(context, chat.length - 1, revisionId, { source, note });
}

export function commitManualState(context, state, { source = SOURCE.MANUAL, note = 'Manual inventory edit' } = {}) {
    const root = ensureRoot(context);
    const normalized = validateAndNormalizeInventory(state);
    const previous = getInventoryAt(root, root.activeRevision);
    if (inventoryEquals(previous, normalized)) return root.activeRevision;
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
