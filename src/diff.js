import { normalizeInventory } from './snapshot.js';
import { inventoryItemKey } from './tree.js';

function entries(state) {
    const list = [];
    for (const category of normalizeInventory(state).categories) {
        for (const item of category.items) {
            list.push({ key: inventoryItemKey(category.name, item.name), nameKey: item.name.normalize('NFKC').toLowerCase(), category: category.name, item });
        }
    }
    return list;
}

function sameValues(a, b) {
    return a.quantity === b.quantity && a.remark === b.remark;
}

/**
 * Compare two full snapshots. Items are matched by category + name; an item that
 * disappears from one category and appears under the same name in another is a move.
 */
export function diffInventories(previous, next) {
    if (!previous || !next) return [];
    const before = entries(previous);
    const after = entries(next);
    const beforeByKey = new Map(before.map(entry => [entry.key, entry]));
    const afterKeys = new Set(after.map(entry => entry.key));

    const changes = [];
    const added = [];
    for (const entry of after) {
        const old = beforeByKey.get(entry.key);
        if (!old) {
            added.push(entry);
            continue;
        }
        if (!sameValues(old.item, entry.item)) {
            changes.push({ type: 'changed', name: entry.item.name, category: entry.category, before: old.item, after: entry.item });
        }
    }

    const removed = before.filter(entry => !afterKeys.has(entry.key));
    for (const entry of added) {
        const index = removed.findIndex(candidate => candidate.nameKey === entry.nameKey);
        if (index >= 0) {
            const [old] = removed.splice(index, 1);
            changes.push({ type: 'moved', name: entry.item.name, category: entry.category, previousCategory: old.category, before: old.item, after: entry.item });
        } else {
            changes.push({ type: 'added', name: entry.item.name, category: entry.category, after: entry.item });
        }
    }
    for (const entry of removed) {
        changes.push({ type: 'removed', name: entry.item.name, category: entry.category, before: entry.item });
    }

    const order = { added: 0, changed: 1, moved: 2, removed: 3 };
    return changes.sort((a, b) => order[a.type] - order[b.type]);
}
