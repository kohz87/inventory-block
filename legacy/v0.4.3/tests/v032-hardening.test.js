import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LIMITS, META_KEY, setHistoryRetention } from '../src/constants.js';
import { buildInventoryPrompt, consumeInventorySeed, consumeInventoryUpdates, stripReservedInventorySeed } from '../src/protocol.js';
import { withResourceTrackingRule } from '../src/resources.js';
import {
  chatLineage, commitManualState, createRevision, ensureRoot, getCurrentInventory,
  getRevision, invalidateLineageCache, portableCheckpointBytes, revisionHistoryBytes,
} from '../src/state.js';
import { GenerationSessionStore } from '../src/session.js';
import { compareInventoryStates } from '../src/ui.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

const control = payload => '<!-- INVENTORY_BLOCK_UPDATE ' + JSON.stringify(payload) + ' -->.';
const state = (quantity = '1', remark = '5 Gold') => ({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity, remark }] }] });
const context = (chat = []) => ({ chat, chatMetadata: {} });

test('composed Inventory prompt exposes adjust_resource without the old numeric-Remark contradiction', () => {
  const prompt = withResourceTrackingRule(buildInventoryPrompt(state()));
  assert.match(prompt, /Use these exact "op" values:[^\n]*adjust_resource/);
  assert.match(prompt, /adjust_resource\{category,name,by,deleteAtZero\?\}/);
  assert.match(prompt, /single numeric value inside Remark[^\n]*use adjust_resource/i);
  assert.doesNotMatch(prompt, /meaningful amount is in Remark[^\n]*use edit_item instead/i);
});

test('edit_item and set_item cannot bypass resource negativity by changing wording', () => {
  for (const op of [
    { op: 'edit_item', category: 'General', name: 'Coin Pouch', remark: 'Balance -10 Gold' },
    { op: 'set_item', category: 'General', name: 'Coin Pouch', remark: 'Balance -10 Gold' },
  ]) {
    const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [op] }), state());
    assert.equal(result.changed, false);
    assert.match(result.errors.join(' '), /cannot become negative/i);
    assert.deepEqual(result.state, state());
  }
});

test('unrelated semantic negative Remark remains valid', () => {
  const base = { categories: [{ name: 'General', items: [{ name: 'Thermometer', quantity: '1', remark: '5 C' }] }] };
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'edit_item', category: 'General', name: 'Thermometer', remark: '-5 C' }] }), base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.state.categories[0].items[0].remark, '-5 C');
});

test('negative absolute Quantity rejects while exact zero depletes', () => {
  const base = { categories: [{ name: 'General', items: [{ name: 'Arrows', quantity: '5', remark: '' }] }] };
  for (const opName of ['set_item', 'edit_item']) {
    const bad = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: opName, category: 'General', name: 'Arrows', quantity: '-5' }] }), base);
    assert.equal(bad.changed, false);
    assert.match(bad.errors.join(' '), /cannot be negative/i);
    assert.deepEqual(bad.state, base);
    const zero = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: opName, category: 'General', name: 'Arrows', quantity: '0' }] }), base);
    assert.deepEqual(zero.errors, []);
    assert.equal(zero.state.categories[0].items.length, 0);
  }
});

test('adjust_resource accepts and preserves comma-grouped numeric resources', () => {
  const base = state('1', '1,200 Gold');
  const result = consumeInventoryUpdates(control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -15 }] }), base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.state.categories[0].items[0].remark, '1,185 Gold');
});

test('manual full-state save rejects a stale editor revision or mutation serial', () => {
  const c = context();
  const root = ensureRoot(c);
  const expectedRevision = root.activeRevision;
  const expectedMutationSerial = root.mutationSerial;
  commitManualState(c, state('1', '10 Gold'));
  assert.throws(() => commitManualState(c, state('1', '7 Gold'), { expectedRevision, expectedMutationSerial }), /changed while the editor was open/i);
  assert.equal(getCurrentInventory(c).categories[0].items[0].remark, '10 Gold');
});

test('terminal cleanup selection stays scoped to one uniquely identified chat session', () => {
  const store = new GenerationSessionStore({ limit: 8, maxAgeMs: 60000 });
  const now = Date.now();
  const a = store.add({ chatId: 'A', type: 'normal', startChatLength: 2, interceptorSeen: true, startedAt: now });
  const b = store.add({ chatId: 'B', type: 'normal', startChatLength: 7, interceptorSeen: true, startedAt: now + 1 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForTerminal('A', 3), a);
  assert.equal(store.chooseForTerminal('B', 8), b);
  assert.equal(store.chooseForTerminal('A', 99), null);
  store.add({ chatId: 'A', type: 'normal', startChatLength: 2, interceptorSeen: true, startedAt: now + 2 }, { supersedeUnarmed: false });
  assert.equal(store.chooseForTerminal('A', 3), null);
});

test('backend revision history obeys the byte ceiling under large snapshots', () => {
  globalThis.localStorage = new MemoryStorage();
  setHistoryRetention(200);
  const c = context();
  ensureRoot(c);
  const payload = 'x'.repeat(1700);
  for (let n = 1; n <= 80; n++) {
    const items = Array.from({ length: 40 }, (_, i) => ({ name: 'Item ' + i, quantity: '1', remark: String(n) + ' ' + payload }));
    createRevision(c, { categories: [{ name: 'General', items }] }, { note: 'byte stress ' + n });
  }
  assert.ok(revisionHistoryBytes(c) <= LIMITS.historyBytes + LIMITS.serializedChars * 2);
  assert.ok(Object.keys(ensureRoot(c).revisions).length < 81);
});

test('portable checkpoint payloads obey their byte ceiling', () => {
  globalThis.localStorage = new MemoryStorage();
  setHistoryRetention(200);
  const c = context();
  ensureRoot(c);
  const payload = 'y'.repeat(1300);
  for (let n = 1; n <= 100; n++) {
    c.chat.push({ is_user: false, is_system: false, name: 'NPC', mes: 'turn ' + n, extra: {} });
    const items = Array.from({ length: 32 }, (_, i) => ({ name: 'Supply ' + i, quantity: '1', remark: String(n) + ' ' + payload }));
    commitManualState(c, { categories: [{ name: 'General', items }] });
  }
  assert.ok(portableCheckpointBytes(c) <= LIMITS.portableCheckpointBytes + LIMITS.serializedChars * 2);
});

test('lineage cache detects in-place edits and still supports explicit invalidation', () => {
  const c = context([{ is_user: true, is_system: false, name: 'User', mes: 'original line' }]);
  const before = chatLineage(c);
  c.chat[0].mes = 'edited line';
  const detected = chatLineage(c);
  assert.notDeepEqual(detected, before);
  invalidateLineageCache(c);
  assert.deepEqual(chatLineage(c), detected);
});

test('History comparison reports a pure category reorder', () => {
  const before = { categories: [{ name: 'General', items: [] }, { name: 'Pack', items: [] }, { name: 'Astra', items: [] }] };
  const after = { categories: [{ name: 'General', items: [] }, { name: 'Astra', items: [] }, { name: 'Pack', items: [] }] };
  const diff = compareInventoryStates(before, after);
  assert.equal(diff.categoryOrderChanged, true);
  assert.deepEqual(diff.categoryOrderBefore, ['General', 'Pack', 'Astra']);
  assert.deepEqual(diff.categoryOrderAfter, ['General', 'Astra', 'Pack']);
});

test('ensureRoot repairs nextRevision even when it collides with an existing revision', () => {
  const c = context();
  createRevision(c, state('1', '10 Gold'));
  createRevision(c, state('1', '20 Gold'));
  const root = ensureRoot(c);
  const revisionOne = structuredClone(getRevision(root, 1));
  root.nextRevision = 1;
  ensureRoot(c);
  assert.equal(root.nextRevision, 3);
  const id = createRevision(c, state('1', '30 Gold'));
  assert.equal(id, 3);
  assert.deepEqual(getRevision(root, 1), revisionOne);
});

test('truncated Inventory seed is stripped without deleting following ordinary prose', () => {
  const source = 'Intro.\n<Inventory>\nCoin Pouch | 1 | 100 Gold\nFood | 1 | About 7 days\n\nAfter prose survives.\nMore prose.';
  const consumed = consumeInventorySeed(source);
  assert.equal(consumed.found, true);
  assert.match(consumed.errors.join(' '), /truncated/i);
  assert.doesNotMatch(consumed.cleanedText, /Coin Pouch|Food \|/);
  assert.match(consumed.cleanedText, /Intro\./);
  assert.match(consumed.cleanedText, /After prose survives/);
  assert.match(consumed.cleanedText, /More prose/);
  const stripped = stripReservedInventorySeed(source);
  assert.equal(stripped.truncated, true);
  assert.match(stripped.cleanedText, /After prose survives/);
});

test('runtime no longer uses global terminal-session snapshots or body generating flag', () => {
  const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /snapshots = sessions\.snapshot\(\)\.filter\(session => !session\.finished\)/);
  assert.doesNotMatch(source, /document\.body\?\.dataset\?\.generating/);
  assert.match(source, /chooseForTerminal/);
  assert.match(source, /expectedMutationSerial/);
  assert.match(source, /invalidateLineageCache/);
});
