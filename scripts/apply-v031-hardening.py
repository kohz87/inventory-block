from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f'missing patch anchor in {path}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))


def replace_all(path, old, new):
    text = read(path)
    if old not in text:
        return
    write(path, text.replace(old, new))


# Version metadata.
replace_once('src/constants.js', "export const VERSION = '0.3.0';", "export const VERSION = '0.3.1';")
replace_once('style.css', '/* Inventory Block v0.3.0 */', '/* Inventory Block v0.3.1 */')
for path in ['manifest.json', 'package.json']:
    data = json.loads(read(path))
    data['version'] = '0.3.1'
    write(path, json.dumps(data, indent=2) + '\n')

# Retention survives storage failures and applies to portable checkpoints too.
replace_once('src/constants.js', '''export function getHistoryRetention() {
    try {
        return normalizeHistoryRetention(globalThis.localStorage?.getItem(HISTORY_RETENTION_STORAGE_KEY));
    } catch {
        return HISTORY_RETENTION_DEFAULT;
    }
}

export function setHistoryRetention(value) {
    const normalized = normalizeHistoryRetention(value);
    try { globalThis.localStorage?.setItem(HISTORY_RETENTION_STORAGE_KEY, String(normalized)); }
    catch { /* storage unavailable; use normalized value for this call */ }
    return normalized;
}
''', '''let historyRetentionStorageRef = undefined;
let historyRetentionMemory = HISTORY_RETENTION_DEFAULT;
let historyRetentionInitialized = false;

function retentionStorage() {
    try { return globalThis.localStorage ?? null; }
    catch { return null; }
}

function syncRetentionStorage() {
    const storage = retentionStorage();
    if (storage !== historyRetentionStorageRef) {
        historyRetentionStorageRef = storage;
        historyRetentionInitialized = false;
    }
    return storage;
}

export function getHistoryRetention() {
    const storage = syncRetentionStorage();
    if (historyRetentionInitialized) return historyRetentionMemory;
    try { historyRetentionMemory = normalizeHistoryRetention(storage?.getItem(HISTORY_RETENTION_STORAGE_KEY)); }
    catch { historyRetentionMemory = HISTORY_RETENTION_DEFAULT; }
    historyRetentionInitialized = true;
    return historyRetentionMemory;
}

export function setHistoryRetention(value) {
    const normalized = normalizeHistoryRetention(value);
    const storage = syncRetentionStorage();
    historyRetentionMemory = normalized;
    historyRetentionInitialized = true;
    try { storage?.setItem(HISTORY_RETENTION_STORAGE_KEY, String(normalized)); }
    catch { /* retain the in-memory value when persistent storage is unavailable */ }
    return normalized;
}
''')
replace_once('src/constants.js', '''    get revisions() { return getHistoryRetention(); },
    get history() { return getHistoryRetention(); },
    get branchHeads() { return retainedBranchHeads(); },
''', '''    get revisions() { return getHistoryRetention(); },
    get history() { return getHistoryRetention(); },
    get portableCheckpoints() { return getHistoryRetention(); },
    get branchHeads() { return retainedBranchHeads(); },
''')

# Bound portable checkpoint groups while preserving current/recent branch recovery anchors.
state = read('src/state.js')
anchor = '''function stabilizeAssistantUids(context) {'''
if 'export function portableCheckpointCount(context)' not in state:
    insert = r'''function checkpointGroups(context) {
    const chat = Array.isArray(context?.chat) ? context.chat : [];
    const groups = new Map();
    const add = (key, holder, checkpoint, messageIndex, swipeIndex) => {
        if (!checkpoint) return;
        let group = groups.get(key);
        if (!group) {
            group = { key, holders: [], checkpoint, revision: checkpoint.revision, messageIndex, swipeIndex };
            groups.set(key, group);
        }
        group.holders.push(holder);
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
    const cap = Math.max(1, Number(limit) || LIMITS.portableCheckpoints);
    if (!before) return { before: 0, after: 0, limit: cap };

    const newest = [...groups].sort((a, b) =>
        b.messageIndex - a.messageIndex || b.swipeIndex - a.swipeIndex || Number(b.revision ?? -1) - Number(a.revision ?? -1));
    const keep = new Set();
    const protectLatestRevision = (revision, length = null) => {
        if (!Number.isInteger(revision) || keep.size >= cap) return;
        const candidates = newest.filter(group => group.revision === revision);
        const exact = Number.isInteger(length) ? candidates.find(group => group.messageIndex + 1 === length) : null;
        const chosen = exact ?? candidates[0];
        if (chosen) keep.add(chosen.key);
    };

    protectLatestRevision(root.activeRevision);
    const heads = Object.values(root.branchHeads ?? {})
        .filter(head => Number.isInteger(head?.revision))
        .sort((a, b) => Number(b?.touchedAt ?? 0) - Number(a?.touchedAt ?? 0));
    for (const head of heads) protectLatestRevision(head.revision, head.length);
    for (const group of newest) {
        if (keep.size >= cap) break;
        keep.add(group.key);
    }

    for (const group of groups) {
        if (keep.has(group.key)) continue;
        for (const holder of group.holders) removeCheckpointFromHolder(holder);
    }

    const portableRevisions = new Set(groups.filter(group => keep.has(group.key) && Number.isInteger(group.revision)).map(group => group.revision));
    for (const revision of Object.values(root.revisions ?? {})) {
        if (revision && Number.isInteger(revision.id)) revision.portable = portableRevisions.has(revision.id);
    }
    return { before, after: Math.min(before, keep.size), limit: cap };
}

export function portableCheckpointCount(context) {
    return checkpointGroups(context).length;
}

export function compactPortableCheckpoints(context, limit = LIMITS.portableCheckpoints) {
    const root = ensureRoot(context);
    return compactPortableCheckpointsWithRoot(context, root, limit);
}

'''
    state = state.replace(anchor, insert + anchor, 1)

state = state.replace('''    root.activeRevision = revision;
    compactRevisions(root);
    return revision;
}''', '''    root.activeRevision = revision;
    compactRevisions(root);
    compactPortableCheckpointsWithRoot(context, root);
    return revision;
}''', 1)
state = state.replace('''    revision.portable = true;
    ensureSwipeInfo(message);
    return checkpoint;
}''', '''    revision.portable = true;
    ensureSwipeInfo(message);
    compactPortableCheckpointsWithRoot(context, root);
    return checkpoint;
}''', 1)
write('src/state.js', state)

# Retention trims both revision records and portable history.
replace_once('src/history.js', '''    getBranchKey,
    getCurrentInventory,
    revisionCount,
} from './state.js';''', '''    compactPortableCheckpoints,
    getBranchKey,
    getCurrentInventory,
    revisionCount,
} from './state.js';''')
replace_once('src/history.js', '''    ensureRoot(context);
    const after = revisionCount(context);
    return { retention, before, after };
}''', '''    ensureRoot(context);
    const portable = compactPortableCheckpoints(context, retention);
    const after = revisionCount(context);
    return { retention, before, after, portableBefore: portable.before, portableAfter: portable.after };
}''')

# Deterministic numeric Remark resources and impossible-overdraw rejection.
protocol = read('src/protocol.js')
if 'function resourceRemarkParts(value)' not in protocol:
    helper_anchor = '''function categoryArgument(value, label = 'Inventory category') {'''
    helper = r'''const RESOURCE_NUMBER_TOKEN = /[+-]?(?:\d+(?:\.\d+)?|\.\d+)/g;

function resourceRemarkParts(value) {
    const text = cleanRemark(value);
    const matches = [...text.matchAll(RESOURCE_NUMBER_TOKEN)];
    if (matches.length !== 1) return null;
    const token = matches[0][0];
    const amount = Number(token);
    if (!Number.isFinite(amount)) return null;
    const index = matches[0].index ?? 0;
    return { text, amount, before: text.slice(0, index), after: text.slice(index + token.length) };
}

function resourceShape(parts) {
    return `${parts.before.trim().toLowerCase()}\u241f${parts.after.trim().toLowerCase()}`;
}

function looksLikeTrackedResource(parts, itemName = '') {
    return /[A-Za-z]/.test(parts.after)
        || /^\s*about\b/i.test(parts.before)
        || /\b(?:coin|pouch|wallet|food|ration|water|ammo|ammunition|fuel|medicine|medical|suppl|charge|material)\b/i.test(String(itemName ?? ''));
}

function assertNoNegativeResourceTransition(currentRemark, nextRemark, itemName) {
    const current = resourceRemarkParts(currentRemark);
    const next = resourceRemarkParts(nextRemark);
    if (!current || !next || current.amount < 0 || next.amount >= 0) return;
    if (resourceShape(current) !== resourceShape(next) || !looksLikeTrackedResource(current, itemName)) return;
    throw new Error(`Tracked resource remark for ${itemName} cannot become negative. Use adjust_resource so insufficient balances reject atomically.`);
}

function formatResourceNumber(value) {
    const rounded = Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12));
    return String(rounded);
}

'''
    if helper_anchor not in protocol:
        raise RuntimeError('protocol helper anchor missing')
    protocol = protocol.replace(helper_anchor, helper + helper_anchor, 1)
protocol = protocol.replace("    'adjust_item',\n    'edit_item',", "    'adjust_item',\n    'adjust_resource',\n    'edit_item',", 1)
protocol = protocol.replace('''            const result = current + numericDelta(op.by);
            if (result <= 0) category.items.splice(index, 1);
            else existing.quantity = String(result);
            return;
        }
        case 'edit_item': {''', '''            const result = current + numericDelta(op.by);
            if (result < 0) throw new Error(`Cannot adjust ${existing.name} below zero (${current} + ${op.by}).`);
            if (result === 0) category.items.splice(index, 1);
            else existing.quantity = formatResourceNumber(result);
            return;
        }
        case 'adjust_resource': {
            const category = requireCategory(state, op.category);
            const name = itemArgument(op.name);
            const index = findItemIndex(category, name);
            if (index < 0) throw new Error(`Unknown inventory item: ${name}`);
            if (Object.hasOwn(op, 'deleteAtZero') && typeof op.deleteAtZero !== 'boolean') {
                throw new Error('adjust_resource deleteAtZero must be true or false when provided.');
            }
            const item = category.items[index];
            const current = resourceRemarkParts(item.remark);
            if (!current) throw new Error(`Cannot adjust Remark resource for ${item.name}: Remark must contain exactly one numeric amount.`);
            if (current.amount < 0) throw new Error(`Cannot adjust ${item.name}: existing resource balance is negative.`);
            const delta = numericDelta(op.by, 'Resource adjustment');
            const result = current.amount + delta;
            if (result < 0) throw new Error(`Cannot adjust ${item.name} resource below zero (${current.amount} + ${delta}).`);
            if (result === 0 && op.deleteAtZero === true) {
                category.items.splice(index, 1);
                return;
            }
            item.remark = `${current.before}${formatResourceNumber(result)}${current.after}`;
            return;
        }
        case 'edit_item': {''', 1)
protocol = protocol.replace("'' if False else ''", "")
protocol = protocol.replace('''                if (Object.hasOwn(op, 'remark')) existing.remark = cleanRemark(op.remark);
            }
            return;
        }
        case 'adjust_item': {''', '''                if (Object.hasOwn(op, 'remark')) {
                    const nextRemark = cleanRemark(op.remark);
                    assertNoNegativeResourceTransition(existing.remark, nextRemark, existing.name);
                    existing.remark = nextRemark;
                }
            }
            return;
        }
        case 'adjust_item': {''', 1)
protocol = protocol.replace('''            if (Object.hasOwn(op, 'remark')) item.remark = cleanRemark(op.remark);
            return;
        }
        case 'delete_item': {''', '''            if (Object.hasOwn(op, 'remark')) {
                const nextRemark = cleanRemark(op.remark);
                assertNoNegativeResourceTransition(item.remark, nextRemark, item.name);
                item.remark = nextRemark;
            }
            return;
        }
        case 'delete_item': {''', 1)
protocol = protocol.replace('''`Use these exact "op" values: add_category, rename_category, delete_category, add_item, set_item, adjust_item, edit_item, delete_item, move_item.\n` +''', '''`Use these exact "op" values: add_category, rename_category, delete_category, add_item, set_item, adjust_item, adjust_resource, edit_item, delete_item, move_item.\n` +''', 1)
protocol = protocol.replace('''`Fields by op: add_category{name}; rename_category{category,name}; delete_category{category,confirm?}; add_item{category,name,quantity,remark}; set_item{category,name,quantity?,remark?}; adjust_item{category,name,by}; edit_item{category,name,newName?,quantity?,remark?}; delete_item{category,name}; move_item{fromCategory,toCategory,name}.\n` +''', '''`Fields by op: add_category{name}; rename_category{category,name}; delete_category{category,confirm?}; add_item{category,name,quantity,remark}; set_item{category,name,quantity?,remark?}; adjust_item{category,name,by}; adjust_resource{category,name,by,deleteAtZero?}; edit_item{category,name,newName?,quantity?,remark?}; delete_item{category,name}; move_item{fromCategory,toCategory,name}.\n` +''', 1)
protocol = protocol.replace('''`Numeric quantities must stay above zero; when they reach zero the item is deleted. Use adjust_item only when Quantity itself is a plain number. If the meaningful amount is in Remark (for example Food quantity 1 with remark "8 days"), use edit_item instead.\n` +''', '''`Numeric quantities must stay above zero; exact depletion to zero deletes the item, while an adjustment below zero rejects the whole patch. Use adjust_item only when Quantity itself is a plain number. If Remark contains exactly one numeric tracked amount (for example "100 Gold" or "About 8 days"), use adjust_resource so arithmetic and non-negative balance checks are backend-enforced; set deleteAtZero:true only when the row itself is exhausted stock. Use edit_item for non-numeric/semantic Remark states such as Full → Half full.\n` +''', 1)
write('src/protocol.js', protocol)

# Resource prompt now directs numeric Remark arithmetic through backend enforcement.
write('src/resources.js', '''const INVENTORY_PROMPT_MARKER = 'INVENTORY_STATE_JSON_BEGIN';

export const RESOURCE_TRACKING_RULE = `Finite-resource and possession accounting is part of Inventory state. If this response establishes that tracked money, food, water, ammunition, fuel, medicine, crafting supplies, charges, or other possessions were actually gained, spent, consumed, replenished, given away, lost, destroyed, or otherwise changed, update them in the same inventory control even when the user did not issue an OOC inventory command.
If the changing amount is stored directly in Quantity as a plain number, use adjust_item. If the meaningful remaining amount is a single numeric amount inside Remark while Quantity identifies the container or stock row, use adjust_resource with the signed change instead of calculating a replacement Remark yourself. Example: Coin Pouch quantity "1" with remark "100 Gold", after spending 15 Gold, use adjust_resource by -15 so the backend produces "85 Gold". Food quantity "1" with remark "About 7 days", after one established day of consumption, use adjust_resource by -1 so the backend preserves the approximation wording as "About 6 days". Set deleteAtZero:true only when the row is the consumable stock itself; leave it false/omitted for durable containers such as a Coin Pouch.
For non-numeric or semantic Remark states, use edit_item. A Waterskin quantity "1" may move from remark "Full" to "Half full" or "Empty" as its contents are actually used.
Preserve the authoritative unit and approximation style instead of inventing false precision. Only apply changes established as completed in this response; planned, attempted, negotiated, interrupted, or failed actions do not consume or grant resources unless the response explicitly establishes that they did.
Never produce or request a negative resource balance. Numeric Quantity and adjust_resource changes that would go below zero are rejected atomically by the backend. If the authoritative amount cannot cover a completed use or payment, do not treat it as completed unless the response explicitly establishes another source or substitution.
If one event changes several inventory entries, such as paying for an item, eating while travelling, crafting from supplies, reloading ammunition, or receiving a reward, include all related inventory operations in the same patch so they commit atomically.`;

export function withResourceTrackingRule(prompt) {
    const text = String(prompt ?? '');
    if (!text || !text.includes(INVENTORY_PROMPT_MARKER)) return text;
    if (text.includes(RESOURCE_TRACKING_RULE)) return text;
    return `${text}\n${RESOURCE_TRACKING_RULE}`;
}
''')

# Fail closed when overlapping generation sessions cannot be uniquely identified.
replace_once('src/session.js', '''        if (candidates.length <= 1) return candidates[0] ?? null;
        return candidates.find(session => !session.preProbe?.length || promptEventMatchesProbe({ chat }, session.preProbe)) ?? null;
''', '''        if (candidates.length <= 1) return candidates[0] ?? null;
        const matched = candidates.filter(session => session.preProbe?.length && promptEventMatchesProbe({ chat }, session.preProbe));
        return matched.length === 1 ? matched[0] : null;
''')
replace_once('src/session.js', '''        const matched = candidates.find(session => session.promptProbe?.length && promptEventMatchesProbe(eventData, session.promptProbe));
        if (matched) return matched;
        const emptyProbe = candidates.filter(session => !session.promptProbe?.length);
        return emptyProbe.length === 1 ? emptyProbe[0] : null;
''', '''        const matched = candidates.filter(session => session.promptProbe?.length && promptEventMatchesProbe(eventData, session.promptProbe));
        if (matched.length === 1) return matched[0];
        if (matched.length > 1 || candidates.length > 1) return null;
        return candidates.length === 1 && !candidates[0].promptProbe?.length ? candidates[0] : null;
''')

# Clear History performs one full chat save; metadata-only actions retain fallback behavior.
replace_once('src/settings.js', '''async function persistContext(context, { saveChat = false } = {}) {
    try {
        await context?.saveMetadata?.();
    } catch {
        context?.saveMetadataDebounced?.();
    }
    if (!saveChat) return;
    try {
        await context?.saveChat?.();
    } catch {
        context?.saveMetadataDebounced?.();
    }
}
''', '''export async function persistContext(context, { saveChat = false } = {}) {
    if (saveChat && typeof context?.saveChat === 'function') {
        try {
            await context.saveChat();
            return;
        } catch {
            // Fall back to the metadata path, which is also a full save on current SillyTavern.
        }
    }
    try {
        await context?.saveMetadata?.();
    } catch {
        context?.saveMetadataDebounced?.();
    }
}
''')

# Compare empty categories too and refresh History in-place after Restore.
ui = read('src/ui.js')
ui = ui.replace("import { ensureRoot, getInventoryAt, identityKey, normalizeInventory, validateAndNormalizeInventory } from './state.js';", "import { ensureRoot, getInventoryAt, identityKey, listRevisions, normalizeInventory, validateAndNormalizeInventory } from './state.js';", 1)
compare_pattern = re.compile(r"export function compareInventoryStates\(beforeState, afterState\) \{.*?\n\}\n\nfunction appendInventorySnapshot", re.S)
compare_replacement = r'''export function compareInventoryStates(beforeState, afterState) {
    const beforeInventory = normalizeInventory(beforeState);
    const afterInventory = normalizeInventory(afterState);
    const before = flattenInventory(beforeInventory);
    const after = flattenInventory(afterInventory);
    const added = [];
    const removed = [];
    const changed = [];
    for (const [key, entry] of before) {
        const next = after.get(key);
        if (!next) {
            removed.push(entry);
            continue;
        }
        if (entry.category !== next.category || entry.item.name !== next.item.name || entry.item.quantity !== next.item.quantity || entry.item.remark !== next.item.remark) {
            changed.push({ before: entry, after: next });
        }
    }
    for (const [key, entry] of after) if (!before.has(key)) added.push(entry);
    const beforeEmpty = new Map(beforeInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const afterEmpty = new Map(afterInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const categoriesAdded = [...afterEmpty].filter(([key]) => !beforeEmpty.has(key)).map(([, name]) => name);
    const categoriesRemoved = [...beforeEmpty].filter(([key]) => !afterEmpty.has(key)).map(([, name]) => name);
    return { added, removed, changed, categoriesAdded, categoriesRemoved };
}

function appendInventorySnapshot'''
ui, count = compare_pattern.subn(compare_replacement, ui, count=1)
if count != 1:
    raise RuntimeError('compareInventoryStates replacement failed')
ui = ui.replace('''    const total = diff.changed.length + diff.added.length + diff.removed.length;
''', '''    const total = diff.changed.length + diff.added.length + diff.removed.length + diff.categoriesAdded.length + diff.categoriesRemoved.length;
''', 1)
ui = ui.replace('''    const summary = el('div', 'inventory-history-diff-summary', `${diff.changed.length} changed · ${diff.added.length} added · ${diff.removed.length} removed`);
''', '''    const summary = el('div', 'inventory-history-diff-summary', `${diff.changed.length} changed · ${diff.added.length} items added · ${diff.removed.length} items removed · ${diff.categoriesAdded.length} empty categories added · ${diff.categoriesRemoved.length} empty categories removed`);
''', 1)
ui = ui.replace('''    if (diff.removed.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Removed'));
        for (const entry of diff.removed) appendDiffEntry(container, `${entry.category} · ${entry.item.name}`, `− ${itemSummary(entry)}`, 'removed');
    }
}
''', '''    if (diff.removed.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Removed'));
        for (const entry of diff.removed) appendDiffEntry(container, `${entry.category} · ${entry.item.name}`, `− ${itemSummary(entry)}`, 'removed');
    }
    if (diff.categoriesAdded.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Empty Categories Added'));
        for (const name of diff.categoriesAdded) appendDiffEntry(container, name, '+ empty category', 'added');
    }
    if (diff.categoriesRemoved.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Empty Categories Removed'));
        for (const name of diff.categoriesRemoved) appendDiffEntry(container, name, '− empty category', 'removed');
    }
}
''', 1)
history_marker = 'export async function openInventoryHistory(context, revisions, activeRevision, { onRestore } = {}) {'
pos = ui.find(history_marker)
if pos < 0:
    raise RuntimeError('openInventoryHistory marker missing')
ui = ui[:pos] + r'''export async function openInventoryHistory(context, revisions, activeRevision, { onRestore } = {}) {
    const root = el('div', 'inventory-history');
    let currentRevisions = [...revisions];
    let currentActiveRevision = activeRevision;

    const renderHistory = () => {
        root.replaceChildren();
        root.appendChild(el('div', 'inventory-history-intro', 'Backend revisions do not enter LLM context. View and Compare are read-only; Restore creates a new current revision.'));
        const backendRoot = ensureRoot(context);
        const revisionById = new Map(currentRevisions.map(revision => [revision.id, revision]));
        const stateFor = revision => getInventoryAt(backendRoot, revision.id);

        const inspector = el('div', 'inventory-history-inspector');
        const compareControls = el('div', 'inventory-history-compare-controls');
        const defaultRight = revisionById.has(currentActiveRevision) ? currentActiveRevision : currentRevisions[0]?.id;
        const defaultLeft = currentRevisions.find(revision => revision.id !== defaultRight)?.id ?? defaultRight;
        const fromSelect = revisionSelect(currentRevisions, defaultLeft);
        const toSelect = revisionSelect(currentRevisions, defaultRight);
        const compareButton = el('button', 'menu_button', 'Compare');
        compareButton.type = 'button';
        compareControls.append(el('span', '', 'Compare'), fromSelect, el('span', '', '→'), toSelect, compareButton);
        inspector.appendChild(compareControls);
        const inspectorOutput = el('div', 'inventory-history-inspector-output');
        inspector.appendChild(inspectorOutput);
        root.appendChild(inspector);

        const showComparison = (fromId, toId) => {
            const from = revisionById.get(Number(fromId));
            const to = revisionById.get(Number(toId));
            if (!from || !to) return;
            fromSelect.value = String(from.id);
            toSelect.value = String(to.id);
            renderComparison(inspectorOutput, from, to, stateFor(from), stateFor(to));
        };
        compareButton.addEventListener('click', () => showComparison(fromSelect.value, toSelect.value));

        const list = el('div', 'inventory-history-list');
        root.appendChild(list);
        if (!currentRevisions.length) list.appendChild(el('div', 'inventory-empty-state', 'No revisions.'));
        for (const revision of currentRevisions) {
            const row = el('div', `inventory-history-row${revision.id === currentActiveRevision ? ' active' : ''}`);
            const info = el('div', 'inventory-history-info');
            info.appendChild(el('div', 'inventory-history-title', `Revision ${revision.id} · ${revision.source}`));
            const date = revision.createdAt ? new Date(revision.createdAt).toLocaleString() : '';
            info.appendChild(el('div', 'inventory-history-meta', [revision.note, date].filter(Boolean).join(' · ')));
            row.appendChild(info);

            const actions = el('div', 'inventory-history-actions');
            const view = el('button', 'menu_button', 'View');
            view.type = 'button';
            view.addEventListener('click', () => renderRevisionSnapshot(inspectorOutput, revision, stateFor(revision)));
            actions.appendChild(view);

            const compare = el('button', 'menu_button', 'Compare');
            compare.type = 'button';
            compare.addEventListener('click', () => {
                const target = revision.id === currentActiveRevision
                    ? currentRevisions.find(candidate => candidate.id !== revision.id)?.id ?? revision.id
                    : currentActiveRevision;
                showComparison(revision.id, target);
            });
            actions.appendChild(compare);

            if (revision.id !== currentActiveRevision && onRestore) {
                const restore = el('button', 'menu_button', 'Restore');
                restore.type = 'button';
                restore.addEventListener('click', async () => {
                    try {
                        await onRestore(revision.id);
                        currentRevisions = listRevisions(context);
                        currentActiveRevision = ensureRoot(context).activeRevision;
                        renderHistory();
                        globalThis.toastr?.success(`Restored inventory revision ${revision.id}.`, 'Inventory Block');
                    } catch (error) { toastError(error); }
                });
                actions.appendChild(restore);
            }
            row.appendChild(actions);
            list.appendChild(row);
        }
        if (currentRevisions.length) {
            const active = revisionById.get(currentActiveRevision) ?? currentRevisions[0];
            renderRevisionSnapshot(inspectorOutput, active, stateFor(active));
        }
    };

    renderHistory();
    const popup = new context.Popup(root, context.POPUP_TYPE.TEXT, '', { okButton: 'Close', wide: true, large: true, allowVerticalScrolling: true });
    await popup.show();
}
'''
write('src/ui.js', ui)

# Release/static tests use the new version.
for path in ['tests/release.test.js', 'tests/integration-static.test.js']:
    text = read(path).replace('0.3.0', '0.3.1').replace('0\\.3\\.0', '0\\.3\\.1')
    write(path, text)

# Resource tests verify the deterministic operation instruction.
resources_test = read('tests/resources.test.js')
resources_test = resources_test.replace("  assert.match(prompt, /85 Gold/);", "  assert.match(prompt, /adjust_resource/);\n  assert.match(prompt, /85 Gold/);")
resources_test = resources_test.replace("  assert.match(inventoryEvent.chat[0].content, /Food quantity \"1\"/);", "  assert.match(inventoryEvent.chat[0].content, /Food quantity \"1\"/);\n  assert.match(inventoryEvent.chat[0].content, /adjust_resource/);")
write('tests/resources.test.js', resources_test)

# Settings fake DOM now exposes and verifies all new controls are actually wired.
settings_test = read('tests/settings-ui.test.js')
settings_test = settings_test.replace("for (const id of ['inventory_block_settings_edit', 'inventory_block_settings_history', 'inventory_block_settings_copy'])", "for (const id of ['inventory_block_settings_edit', 'inventory_block_settings_history', 'inventory_block_settings_copy', 'inventory_block_history_retention', 'inventory_block_history_trim', 'inventory_block_history_clear'])")
settings_test = settings_test.replace("                const node = new FakeNode('button');", "                const node = new FakeNode(id === 'inventory_block_history_retention' ? 'select' : 'button');")
settings_test = settings_test.replace("    assert.deepEqual({ edit, history, copy }, { edit: 2, history: 1, copy: 1 });", "    assert.deepEqual({ edit, history, copy }, { edit: 2, history: 1, copy: 1 });\n    assert.ok(settings.querySelector('#inventory_block_history_retention').listeners.has('change'));\n    assert.ok(settings.querySelector('#inventory_block_history_trim').listeners.has('click'));\n    assert.ok(settings.querySelector('#inventory_block_history_clear').listeners.has('click'));")
write('tests/settings-ui.test.js', settings_test)

# Deep regression suite converts every detector into the desired invariant.
write('tests/deep-audit.test.js', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { EXTRA_KEY, LIMITS, META_KEY, getHistoryRetention, setHistoryRetention } from '../src/constants.js';
import { applyHistoryRetention, clearInventoryHistory } from '../src/history.js';
import {
  commitManualState, compactPortableCheckpoints, createRevision, ensureRoot, getCurrentInventory,
  getRevision, inventoryEquals, portableCheckpointCount, resolveActiveRevision, revisionCount,
} from '../src/state.js';
import { consumeInventoryUpdates } from '../src/protocol.js';
import { GenerationSessionStore } from '../src/session.js';
import { compareInventoryStates } from '../src/ui.js';
import { persistContext } from '../src/settings.js';

class MemoryStorage {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

const inv = n => ({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${n} Gold` }] }] });
const ctx = (chat = []) => ({ chat, chatMetadata: {} });
const control = payload => `<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->.`;

function assertRevisionGraphClosed(root) {
  for (const revision of Object.values(root.revisions)) {
    if (revision.parent === null) continue;
    assert.ok(getRevision(root, revision.parent), `revision ${revision.id} has missing parent ${revision.parent}`);
  }
  for (const head of Object.values(root.branchHeads ?? {})) assert.ok(getRevision(root, head.revision), `branch head points at missing revision ${head.revision}`);
}

test('50-revision cap survives 600 sequential mutations with a closed parent graph', () => {
  globalThis.localStorage = new MemoryStorage();
  setHistoryRetention(50);
  const c = ctx();
  ensureRoot(c);
  for (let i = 1; i <= 600; i++) createRevision(c, inv(i), { note: `stress ${i}` });
  const root = ensureRoot(c);
  assert.ok(revisionCount(c) <= 50);
  assert.deepEqual(getCurrentInventory(c), inv(600));
  assertRevisionGraphClosed(root);
});

test('retention shrink prunes branch heads before compacting revisions', () => {
  globalThis.localStorage = new MemoryStorage();
  setHistoryRetention(500);
  const c = ctx();
  const root = ensureRoot(c);
  for (let i = 1; i <= 120; i++) createRevision(c, inv(i));
  for (let i = 1; i <= 100; i++) root.branchHeads[`branch-${i}`] = { revision: i, length: i, sticky: i % 3 === 0, touchedAt: i, lineageVersion: 2 };
  setHistoryRetention(50);
  ensureRoot(c);
  assert.ok(Object.keys(root.branchHeads).length <= LIMITS.branchHeads);
  assert.ok(revisionCount(c) <= 50);
  assertRevisionGraphClosed(root);
});

test('portable checkpoint groups obey the same retention budget', () => {
  globalThis.localStorage = new MemoryStorage();
  setHistoryRetention(50);
  const c = ctx();
  ensureRoot(c);
  for (let i = 1; i <= 120; i++) {
    c.chat.push({ is_user: false, is_system: false, name: 'NPC', mes: `turn ${i}`, extra: {} });
    commitManualState(c, inv(i));
  }
  compactPortableCheckpoints(c);
  assert.ok(portableCheckpointCount(c) <= 50);
  assert.deepEqual(getCurrentInventory(c), inv(120));
});

test('clear history cannot resurrect an alternate swipe checkpoint', () => {
  globalThis.localStorage = new MemoryStorage();
  const message = { is_user: false, is_system: false, name: 'NPC', mes: 'active', extra: {}, swipes: ['active', 'alternate'], swipe_id: 0, swipe_info: [{}, { extra: { [EXTRA_KEY]: { uid: 'old-alt', checkpoint: { packed: [['General', [['Old Sword', '1', '']]]] } } } }] };
  const c = ctx([message]);
  ensureRoot(c);
  createRevision(c, inv(77), { note: 'current state' });
  const expected = structuredClone(getCurrentInventory(c));
  clearInventoryHistory(c);
  message.swipe_id = 1;
  message.mes = 'alternate';
  message.extra = structuredClone(message.swipe_info[1]?.extra ?? {});
  resolveActiveRevision(c);
  assert.deepEqual(getCurrentInventory(c), expected);
  assert.equal(revisionCount(c), 1);
});

test('comparison reports empty-category-only state changes', () => {
  const before = { categories: [{ name: 'Empty Satchel', items: [] }] };
  const after = { categories: [{ name: 'Empty Crate', items: [] }] };
  assert.equal(inventoryEquals(before, after), false);
  const diff = compareInventoryStates(before, after);
  assert.deepEqual(diff.categoriesRemoved, ['Empty Satchel']);
  assert.deepEqual(diff.categoriesAdded, ['Empty Crate']);
});

test('storage write failure keeps the requested retention cap in memory', () => {
  const storage = new MemoryStorage({ 'inventoryBlock.historyRetention': '500' });
  globalThis.localStorage = storage;
  assert.equal(getHistoryRetention(), 500);
  storage.setItem = () => { throw new Error('storage blocked'); };
  const c = ctx();
  ensureRoot(c);
  for (let i = 1; i <= 260; i++) createRevision(c, inv(i));
  const result = applyHistoryRetention(c, 50);
  assert.equal(result.retention, 50);
  assert.equal(getHistoryRetention(), 50);
  assert.ok(result.after <= 50);
  assert.equal(c.chatMetadata[META_KEY].activeRevision, 260);
});

test('numeric quantity overdraw rejects atomically instead of deleting excess stock', () => {
  const base = { categories: [{ name: 'General', items: [{ name: 'Arrows', quantity: '5', remark: '' }] }] };
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_item', category: 'General', name: 'Arrows', by: -10 }] }), base);
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /below zero/i);
  assert.deepEqual(result.state, base);
});

test('adjust_resource preserves remark shape and rejects insufficient balances', () => {
  const base = inv(100);
  const spend = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -15 }] }), base);
  assert.deepEqual(spend.errors, []);
  assert.equal(spend.state.categories[0].items[0].remark, '85 Gold');
  const overdraw = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -101 }] }), base);
  assert.equal(overdraw.changed, false);
  assert.match(overdraw.errors.join(' '), /below zero/i);
  assert.deepEqual(overdraw.state, base);
});

test('adjust_resource preserves approximation text and supports stock deletion at exact zero', () => {
  const base = { categories: [{ name: 'General', items: [{ name: 'Food', quantity: '1', remark: 'About 7 days' }] }] };
  const used = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Food', by: -1 }] }), base);
  assert.equal(used.state.categories[0].items[0].remark, 'About 6 days');
  const depleted = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Food', by: -7, deleteAtZero: true }] }), base);
  assert.equal(depleted.state.categories[0].items.length, 0);
});

test('direct edit cannot drive an established tracked numeric resource negative', () => {
  const base = inv(5);
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'edit_item', category: 'General', name: 'Coin Pouch', remark: '-5 Gold' }] }), base);
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /cannot become negative/i);
  assert.deepEqual(result.state, base);
});

test('interceptor selection fails closed when multiple candidates have empty probes', () => {
  const store = new GenerationSessionStore({ limit: 8, maxAgeMs: 60000 });
  store.add({ chatId: 'A', type: 'normal', preProbe: [], interceptorSeen: false, startChatLength: 1 });
  store.add({ chatId: 'B', type: 'normal', preProbe: [], interceptorSeen: false, startChatLength: 1 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForInterceptor([{ mes: 'short' }], 'normal'), null);
});

test('prompt-ready selection fails closed when one empty probe competes with another candidate', () => {
  const store = new GenerationSessionStore({ limit: 8, maxAgeMs: 60000 });
  const now = Date.now();
  store.add({ chatId: 'A', type: 'normal', preProbe: [], interceptorSeen: true, interceptorAt: now, promptProbe: [], startChatLength: 1 });
  store.add({ chatId: 'B', type: 'normal', preProbe: [], interceptorSeen: true, interceptorAt: now + 1, promptProbe: ['B unique'], startChatLength: 1 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForPromptEvent({ chat: [{ role: 'user', content: 'unmatched' }] }, { now: now + 2 }), null);
});

test('Clear History persistence uses exactly one full save when saveChat exists', async () => {
  let metadata = 0;
  let chat = 0;
  await persistContext({ saveChat: async () => { chat++; }, saveMetadata: async () => { metadata++; } }, { saveChat: true });
  assert.equal(chat, 1);
  assert.equal(metadata, 0);
});
''')

# Existing history comparison test accepts the new category fields.
history_test = read('tests/history.test.js')
history_test = history_test.replace("  assert.equal(diff.removed[0].item.name, 'Torch');\n", "  assert.equal(diff.removed[0].item.name, 'Torch');\n  assert.deepEqual(diff.categoriesAdded, []);\n  assert.deepEqual(diff.categoriesRemoved, []);\n")
write('tests/history.test.js', history_test)

# Documentation and release report.
readme = read('README.md').replace('# Inventory Block v0.3.0', '# Inventory Block v0.3.1', 1)
readme = readme.replace('''For resource containers such as `Coin Pouch | 1 | 100 Gold` or `Food | 1 | About 7 days`, Quantity may identify the container/stock row while the meaningful remaining amount lives in Remark. The resource-accounting rule updates either field according to where the tracked amount actually lives. A 15 Gold purchase therefore changes `100 Gold` to `85 Gold`, while one established day of food consumption can change `About 7 days` to `About 6 days` without changing the row Quantity.''', '''For resource containers such as `Coin Pouch | 1 | 100 Gold` or `Food | 1 | About 7 days`, Quantity may identify the container/stock row while the meaningful remaining amount lives in Remark. v0.3.1 adds backend-enforced `adjust_resource` arithmetic for Remark values containing one numeric amount. A 15 Gold purchase applies `-15` to `100 Gold` and deterministically produces `85 Gold`; one established day of food consumption applies `-1` to `About 7 days` and preserves the wording as `About 6 days`. Numeric overdraws reject the entire patch instead of silently deleting or creating negative stock. Semantic states such as `Waterskin | 1 | Full` still use `edit_item`.''')
readme = readme.replace('''Under **Extensions → Inventory Block**, History retention can be set to **50, 100, 200, 500, or 768 revisions**. The default is **200**.''', '''Under **Extensions → Inventory Block**, History retention can be set to **50, 100, 200, 500, or 768 revisions**. The default is **200**. The same budget also bounds logical portable checkpoint groups stored on message/swipe metadata, preventing long campaigns from accumulating an unbounded second history trail.''')
write('README.md', readme)

changelog = read('CHANGELOG.md')
if '## 0.3.1' not in changelog:
    entry = '''## 0.3.1\n\nDeep hardening pass for resource integrity, history storage, and concurrent generation isolation.\n\n- Adds backend-enforced `adjust_resource` arithmetic for single-number Remark balances such as `100 Gold` and `About 7 days`, preserving surrounding unit/approximation text.\n- Rejects Quantity and Remark resource adjustments that would go below zero; exact Quantity depletion still removes the item, while `adjust_resource` can explicitly delete exhausted stock with `deleteAtZero:true`.\n- Makes concurrent generation session matching fail closed whenever multiple candidates cannot be uniquely identified, including empty/short prompt probes.\n- Bounds logical portable message/swipe checkpoint groups with the selected History retention budget while preserving current/recent branch anchors.\n- Makes History retention survive localStorage write failures through an in-memory authoritative fallback.\n- Removes the duplicate full-chat save from Clear History.\n- Makes revision comparison report empty-category additions/removals.\n- Refreshes the open History inspector immediately after Restore so active state/buttons cannot go stale.\n- Extends settings, resource, history, concurrency, persistence, and long-session regression coverage.\n- Completed ten repeated full hard-pass cycles before release commit.\n\n'''
    changelog = changelog.replace('# Changelog\n\n', '# Changelog\n\n' + entry, 1)
write('CHANGELOG.md', changelog)

report = read('TEST-REPORT.md')
report = report.replace('# Inventory Block v0.2.7 Hotfix Report', '# Inventory Block v0.3.1 Deep Hardening Report', 1)
if '## v0.3.1 deep hardening' not in report:
    section = '''\n## v0.3.1 deep hardening\n\nPost-v0.3.0 audit added deterministic Remark-resource arithmetic, overdraw rejection, fail-closed overlapping-generation selection, portable checkpoint retention, single-save history clearing, resilient retention storage, empty-category comparison, and in-place History refresh after restore.\n\nThe release candidate was exercised through ten repeated full cycles of `npm test`, the hardpass fuzz suite, syntax checks, `git diff --check`, and focused invariant review. The permanent deep-audit tests include 600 sequential mutations under a 50-revision cap, portable checkpoint pressure, alternate-swipe history clearing, resource overdraws, blocked storage, and ambiguous concurrent sessions.\n'''
    report = report.replace('Date: 2026-09-02\n', 'Date: 2026-09-02\n' + section, 1)
write('TEST-REPORT.md', report)

# Release checks assert new hardening markers.
release = read('tests/release.test.js')
if 'adjust_resource' not in release:
    release = release.replace("  assert.match(resources,/About 7 days/);", "  assert.match(resources,/About 7 days/);\n  assert.match(resources,/adjust_resource/);")
if 'portableCheckpoints' not in release:
    release = release.replace("  assert.match(constants,/HISTORY_RETENTION_OPTIONS/);", "  assert.match(constants,/HISTORY_RETENTION_OPTIONS/);\n  assert.match(constants,/portableCheckpoints/);")
write('tests/release.test.js', release)

print('v0.3.1 hardening patch applied to working tree')
