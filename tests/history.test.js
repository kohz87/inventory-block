import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXTRA_KEY,
  LIMITS,
  getHistoryRetention,
  setHistoryRetention,
} from '../src/constants.js';
import { clearInventoryHistory } from '../src/history.js';
import { commitManualState, createRevision, ensureRoot, getCurrentInventory, revisionCount } from '../src/state.js';
import { compareInventoryStates } from '../src/ui.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

function freshStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  return storage;
}

const inv = (gold, extras = []) => ({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${gold} Gold` }, ...extras] }] });
const ctx = (chat = []) => ({ chat, chatMetadata: {} });

test('history retention is configurable and drives backend revision/history caps', () => {
  freshStorage();
  assert.equal(getHistoryRetention(), 200);
  assert.equal(setHistoryRetention(50), 50);
  assert.equal(LIMITS.revisions, 50);
  assert.equal(LIMITS.history, 50);
  assert.equal(setHistoryRetention(123), 200);
  assert.equal(LIMITS.revisions, 200);
});

test('revision creation respects the selected retention cap', () => {
  freshStorage();
  setHistoryRetention(50);
  const c = ctx();
  ensureRoot(c);
  for (let i = 1; i <= 80; i++) createRevision(c, inv(i), { note: `revision ${i}` });
  assert.ok(revisionCount(c) <= 50);
  assert.deepEqual(getCurrentInventory(c), inv(80));
  assert.ok(ensureRoot(c).revisions['0']);
});

test('clear history preserves current inventory and removes old swipe/checkpoint history', () => {
  freshStorage();
  const message = { is_user: false, is_system: false, mes: 'inventory turn', extra: {}, swipes: ['inventory turn', 'alternate'], swipe_info: [{}, { extra: { [EXTRA_KEY]: { checkpoint: { packed: [['General', [['Old', '1', '']]]] } } } }], swipe_id: 0 };
  const c = ctx([message]);
  ensureRoot(c);
  commitManualState(c, inv(100));
  commitManualState(c, inv(80, [{ name: 'Rations', quantity: '4', remark: '' }]));
  const expected = structuredClone(getCurrentInventory(c));
  const before = revisionCount(c);
  assert.ok(before > 1);

  const result = clearInventoryHistory(c);
  assert.equal(result.before, before);
  assert.equal(revisionCount(c), 1);
  assert.deepEqual(getCurrentInventory(c), expected);
  assert.equal(ensureRoot(c).activeRevision, 0);
  assert.ok(c.chat[0].extra[EXTRA_KEY]?.checkpoint);
  assert.equal(c.chat[0].swipe_info[1]?.extra?.[EXTRA_KEY], undefined);
});

test('inventory comparison classifies changed, added and removed rows', () => {
  const before = { categories: [{ name: 'General', items: [
    { name: 'Food', quantity: '1', remark: 'About 7 days' },
    { name: 'Torch', quantity: '3', remark: '' },
  ] }] };
  const after = { categories: [{ name: 'General', items: [
    { name: 'Food', quantity: '1', remark: 'About 5 days' },
    { name: 'Healing Salve', quantity: '2', remark: 'Small jars' },
  ] }] };
  const diff = compareInventoryStates(before, after);
  assert.equal(diff.changed.length, 1);
  assert.equal(diff.changed[0].after.item.name, 'Food');
  assert.equal(diff.added.length, 1);
  assert.equal(diff.added[0].item.name, 'Healing Salve');
  assert.equal(diff.removed.length, 1);
  assert.equal(diff.removed[0].item.name, 'Torch');
  assert.deepEqual(diff.categoriesAdded, []);
  assert.deepEqual(diff.categoriesRemoved, []);
});
