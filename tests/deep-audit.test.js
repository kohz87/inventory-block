import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXTRA_KEY,
  LIMITS,
  META_KEY,
  setHistoryRetention,
} from '../src/constants.js';
import { applyHistoryRetention, clearInventoryHistory } from '../src/history.js';
import {
  createRevision,
  ensureRoot,
  getCurrentInventory,
  getRevision,
  inventoryEquals,
  resolveActiveRevision,
  revisionCount,
} from '../src/state.js';
import { consumeInventoryUpdates } from '../src/protocol.js';
import { GenerationSessionStore } from '../src/session.js';
import { compareInventoryStates } from '../src/ui.js';

class MemoryStorage {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

const inv = (n) => ({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${n} Gold` }] }] });
const ctx = (chat = []) => ({ chat, chatMetadata: {} });
const control = payload => `<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->.`;

function assertRevisionGraphClosed(root) {
  for (const revision of Object.values(root.revisions)) {
    if (revision.parent === null) continue;
    assert.ok(getRevision(root, revision.parent), `revision ${revision.id} has missing parent ${revision.parent}`);
  }
  for (const head of Object.values(root.branchHeads ?? {})) {
    assert.ok(getRevision(root, head.revision), `branch head points at missing revision ${head.revision}`);
  }
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
  for (let i = 1; i <= 100; i++) {
    root.branchHeads[`branch-${i}`] = { revision: i, length: i, sticky: i % 3 === 0, touchedAt: i, lineageVersion: 2 };
  }
  setHistoryRetention(50);
  ensureRoot(c);
  assert.ok(Object.keys(root.branchHeads).length <= LIMITS.branchHeads);
  assert.ok(revisionCount(c) <= 50);
  assertRevisionGraphClosed(root);
});

test('clear history cannot resurrect an alternate swipe checkpoint during immediate branch resolution', () => {
  globalThis.localStorage = new MemoryStorage();
  const message = {
    is_user: false,
    is_system: false,
    name: 'NPC',
    mes: 'active',
    extra: {},
    swipes: ['active', 'alternate'],
    swipe_id: 0,
    swipe_info: [
      {},
      { extra: { [EXTRA_KEY]: { uid: 'old-alt', checkpoint: { packed: [['General', [['Old Sword', '1', '']]]] } } } },
    ],
  };
  const c = ctx([message]);
  ensureRoot(c);
  createRevision(c, inv(77), { note: 'current state' });
  const expected = structuredClone(getCurrentInventory(c));
  clearInventoryHistory(c);
  assert.equal(revisionCount(c), 1);
  assert.deepEqual(getCurrentInventory(c), expected);

  message.swipe_id = 1;
  message.mes = 'alternate';
  message.extra = structuredClone(message.swipe_info[1]?.extra ?? {});
  resolveActiveRevision(c);
  assert.deepEqual(getCurrentInventory(c), expected);
  assert.equal(revisionCount(c), 1);
});

test('comparison currently misses empty-category-only state changes', () => {
  const before = { categories: [{ name: 'Empty Satchel', items: [] }] };
  const after = { categories: [{ name: 'Empty Crate', items: [] }] };
  assert.equal(inventoryEquals(before, after), false);
  const diff = compareInventoryStates(before, after);
  assert.deepEqual(diff, { added: [], removed: [], changed: [] });
});

test('storage write failure exposes a retention cap mismatch', () => {
  const storage = new MemoryStorage({ 'inventoryBlock.historyRetention': '500' });
  storage.setItem = () => { throw new Error('storage blocked'); };
  globalThis.localStorage = storage;
  const c = ctx();
  ensureRoot(c);
  for (let i = 1; i <= 260; i++) createRevision(c, inv(i));
  const result = applyHistoryRetention(c, 50);
  assert.equal(result.retention, 50);
  assert.ok(result.after > result.retention, `reported cap ${result.retention} unexpectedly applied; after=${result.after}`);
  assert.equal(c.chatMetadata[META_KEY].activeRevision, 260);
});

test('numeric adjust overspend currently deletes stock instead of rejecting impossible consumption', () => {
  const base = { categories: [{ name: 'General', items: [{ name: 'Arrows', quantity: '5', remark: '' }] }] };
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_item', category: 'General', name: 'Arrows', by: -10 }] }), base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items.length, 0);
});

test('remark-stored negative balance is currently accepted by backend validation', () => {
  const base = inv(5);
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'edit_item', category: 'General', name: 'Coin Pouch', remark: '-5 Gold' }] }), base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, '-5 Gold');
});

test('interceptor selection currently guesses when multiple candidates have empty probes', () => {
  const store = new GenerationSessionStore({ limit: 8, maxAgeMs: 60000 });
  const a = store.add({ chatId: 'A', type: 'normal', preProbe: [], interceptorSeen: false, startChatLength: 1 });
  store.add({ chatId: 'B', type: 'normal', preProbe: [], interceptorSeen: false, startChatLength: 1 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForInterceptor([{ mes: 'Yo' }], 'normal'), a);
});

test('prompt-ready selection currently guesses a lone empty probe while another candidate exists', () => {
  const store = new GenerationSessionStore({ limit: 8, maxAgeMs: 60000 });
  const a = store.add({ chatId: 'A', type: 'normal', preProbe: [], promptProbe: [], interceptorSeen: true, interceptorAt: Date.now(), startChatLength: 1 });
  store.add({ chatId: 'B', type: 'normal', preProbe: [], promptProbe: ['B unique request'], interceptorSeen: true, interceptorAt: Date.now() + 1, startChatLength: 1 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForPromptEvent({ chat: [{ role: 'user', content: 'unrelated raw task' }] }), a);
});
