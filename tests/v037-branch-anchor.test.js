import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachMessageRevision, commitManualState, createRevision, ensureRoot, getCurrentInventory,
  getRevision, invalidateLineageCache, markDurableRevision, rememberBranchHead,
  resolveActiveRevision, resolveRevisionBeforeMessage,
} from '../src/state.js';
import { EXTRA_KEY, SOURCE } from '../src/constants.js';

const inv = items => ({ categories: [{ name: 'General', items }] });
const item = (name, quantity = '1', remark = '') => ({ name, quantity, remark });
const assistant = (mes, extra = {}) => ({ is_user: false, is_system: false, mes, extra });
const user = mes => ({ is_user: true, is_system: false, mes, extra: {} });
const ctx = chat => ({ chat, chatMetadata: {} });

test('manual inventory survives deletion of the tail message that carried its checkpoint', () => {
  const c = ctx([user('setup'), assistant('done')]);
  ensureRoot(c);
  const manual = commitManualState(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Sword')]), { source: SOURCE.MANUAL });
  assert.equal(ensureRoot(c).durableRevision, manual);
  assert.ok(c.chat[1].extra[EXTRA_KEY].checkpoint);
  c.chat.pop();
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), manual);
  assert.equal(getCurrentInventory(c).categories[0].items.length, 2);
});

test('deleting an LLM purchase response rolls back to the durable pre-purchase state', () => {
  const c = ctx([assistant('start'), user('buy sword'), assistant('purchase complete')]);
  const root = ensureRoot(c);
  const baseline = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold')]), { parent: 0, source: SOURCE.SEED });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: baseline, newUid: true, portable: true });
  rememberBranchHead(c, baseline);
  const purchase = createRevision(c, inv([item('Coin Pouch', '1', '80 Gold'), item('Sword')]), { parent: baseline, source: SOURCE.LLM });
  attachMessageRevision(c, 2, { baseRevision: baseline, revision: purchase, newUid: true, portable: true });
  rememberBranchHead(c, purchase);
  assert.equal(resolveActiveRevision(c), purchase);
  c.chat.pop();
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), baseline);
  assert.deepEqual(getCurrentInventory(c).categories[0].items.map(x => x.name), ['Coin Pouch']);
  assert.equal(root.durableRevision, baseline);
});

test('a new untracked swipe inherits inventory immediately before the assistant response', () => {
  const target = assistant('first answer');
  target.swipes = ['first answer', 'alternate'];
  target.swipe_info = [{}, {}];
  target.swipe_id = 0;
  const c = ctx([assistant('start'), user('question'), target]);
  ensureRoot(c);
  const baseline = createRevision(c, inv([item('Torch', '3')]), { parent: 0, source: SOURCE.SEED });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: baseline, newUid: true, portable: true });
  attachMessageRevision(c, 2, { baseRevision: baseline, revision: baseline, newUid: true, portable: false });
  target.swipe_id = 1;
  target.mes = 'alternate';
  target.extra = {};
  target.swipe_info[1] = {};
  invalidateLineageCache(c);
  const inherited = resolveRevisionBeforeMessage(c, 2);
  assert.equal(inherited, baseline);
  attachMessageRevision(c, 2, { baseRevision: inherited, revision: inherited, newUid: true, portable: false });
  assert.equal(resolveActiveRevision(c), baseline);
  assert.equal(getCurrentInventory(c).categories[0].items[0].name, 'Torch');
});

test('starting seed remains durable even when its original message is removed', () => {
  const c = ctx([assistant('seed message')]);
  ensureRoot(c);
  const seed = createRevision(c, inv([item('Waterskin')]), { parent: 0, source: SOURCE.SEED });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });
  c.chat.splice(0, 1);
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), seed);
  assert.equal(getCurrentInventory(c).categories[0].items[0].name, 'Waterskin');
});

test('v0.3.6 metadata without durableRevision migrates to newest durable-source revision', () => {
  const c = ctx([assistant('tail')]);
  const root = ensureRoot(c);
  const manual = commitManualState(c, inv([item('Knife')]), { source: SOURCE.MANUAL });
  createRevision(c, inv([item('Knife'), item('Coin')]), { parent: manual, source: SOURCE.LLM });
  delete root.durableRevision;
  ensureRoot(c);
  assert.equal(root.durableRevision, manual);
});

test('history compaction never prunes the durable revision', () => {
  const c = ctx([assistant('tail')]);
  const root = ensureRoot(c);
  const durable = commitManualState(c, inv([item('Anchor')]), { source: SOURCE.MANUAL });
  let parent = durable;
  for (let i = 0; i < 230; i++) {
    parent = createRevision(c, inv([item('Anchor'), item(`Loot ${i}`)]), { parent, source: SOURCE.LLM });
  }
  assert.equal(root.durableRevision, durable);
  assert.ok(getRevision(root, durable));
});

test('explicit administrative reconciliation can promote an LLM revision to durable', () => {
  const c = ctx([assistant('tail')]);
  const root = ensureRoot(c);
  const revision = createRevision(c, inv([item('Admin Set')]), { parent: 0, source: SOURCE.LLM });
  assert.equal(root.durableRevision, 0);
  markDurableRevision(c, revision);
  assert.equal(root.durableRevision, revision);
  assert.equal(getRevision(root, revision).durable, true);
  c.chat.length = 0;
  assert.equal(resolveActiveRevision(c), revision);
});


test('manual durable edit survives tail deletion even when an older non-empty revision survives', () => {
  const c = ctx([assistant('start'), user('find loot'), assistant('loot found'), user('note inventory'), assistant('tail')]);
  const root = ensureRoot(c);
  const seed = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold')]), { parent: 0, source: SOURCE.SEED });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });
  const loot = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Gem')]), { parent: seed, source: SOURCE.LLM });
  attachMessageRevision(c, 2, { baseRevision: seed, revision: loot, newUid: true, portable: true });
  const manual = commitManualState(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Gem'), item('Map')]), { source: SOURCE.MANUAL });
  assert.equal(root.durableRevision, manual);
  assert.equal(root.durableLength, 5);
  c.chat.pop();
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), manual);
  assert.ok(getCurrentInventory(c).categories[0].items.some(x => x.name === 'Map'));
});

test('prefix resolution never pulls a later durable manual edit backward', () => {
  const c = ctx([assistant('start'), user('question'), assistant('answer')]);
  const root = ensureRoot(c);
  const seed = createRevision(c, inv([item('Torch', '2')]), { parent: 0, source: SOURCE.SEED });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });
  const manual = commitManualState(c, inv([item('Torch', '2'), item('Late Map')]), { source: SOURCE.MANUAL });
  assert.equal(root.durableRevision, manual);
  assert.equal(root.durableLength, 3);
  assert.equal(resolveRevisionBeforeMessage(c, 2), seed);
});


test('deleting the selected swipe preserves that swipe durable state, not a newer sibling durable state', () => {
  const message = assistant('swipe zero');
  message.swipes = ['swipe zero', 'swipe one'];
  message.swipe_info = [{}, {}];
  message.swipe_id = 0;
  const c = ctx([message]);
  const root = ensureRoot(c);
  const swipe0 = commitManualState(c, inv([item('Branch Zero')]), { source: SOURCE.MANUAL });
  message.swipe_id = 1;
  message.mes = 'swipe one';
  message.extra = structuredClone(message.swipe_info[0]?.extra ?? message.extra);
  root.activeRevision = swipe0;
  const swipe1 = commitManualState(c, inv([item('Branch One')]), { source: SOURCE.MANUAL });
  message.swipe_info[1] = { extra: structuredClone(message.extra) };
  assert.equal(root.durableRevision, swipe1);
  message.swipe_id = 0;
  message.mes = 'swipe zero';
  message.extra = structuredClone(message.swipe_info[0].extra);
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), swipe0);
  assert.equal(root.resolvedLength, 1);
  c.chat.pop();
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), swipe0);
});


test('deletion preserves an explicitly promoted LLM durable revision on the selected swipe', () => {
  const message = assistant('branch zero');
  message.swipes = ['branch zero', 'branch one'];
  message.swipe_info = [{}, {}];
  message.swipe_id = 0;
  const c = ctx([message]);
  const root = ensureRoot(c);

  const branch0 = createRevision(c, inv([item('Promoted Zero')]), { parent: 0, source: SOURCE.LLM });
  markDurableRevision(c, branch0);
  attachMessageRevision(c, 0, { baseRevision: 0, revision: branch0, newUid: true, portable: true });
  message.swipe_info[0] = { extra: structuredClone(message.extra) };

  message.swipe_id = 1;
  message.mes = 'branch one';
  message.extra = {};
  root.activeRevision = 0;
  const branch1 = createRevision(c, inv([item('Promoted One')]), { parent: 0, source: SOURCE.LLM });
  markDurableRevision(c, branch1);
  attachMessageRevision(c, 0, { baseRevision: 0, revision: branch1, newUid: true, portable: true });
  message.swipe_info[1] = { extra: structuredClone(message.extra) };

  message.swipe_id = 0;
  message.mes = 'branch zero';
  message.extra = structuredClone(message.swipe_info[0].extra);
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), branch0);
  c.chat.pop();
  invalidateLineageCache(c);
  assert.equal(resolveActiveRevision(c), branch0);
});
