import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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


test('empty-category comparison detects case-only rename', () => {
  const before = { categories: [{ name: 'Pack', items: [] }] };
  const after = { categories: [{ name: 'pack', items: [] }] };
  const diff = compareInventoryStates(before, after);
  assert.deepEqual(diff.categoriesRemoved, ['Pack']);
  assert.deepEqual(diff.categoriesAdded, ['pack']);
});


test('history snapshot source keeps empty categories visible', () => {
  const source = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
  assert.match(source, /if \(!inventory\.categories\.length\)/);
  assert.doesNotMatch(source, /const total = itemCount\(inventory\);\s*if \(!total\)/);
});
