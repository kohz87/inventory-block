import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInventoryPrompt, consumeInventorySeed, consumeInventoryUpdates,
  formatInventorySeedBlock, formatInventoryState, hasInventoryControl,
} from '../src/protocol.js';

const inv = categories => ({ categories });
const item = (name, quantity='1', remark='') => ({ name, quantity, remark });
const control = payload => `<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->.`;

test('inventory prompt state is lossless JSON for delimiter-like names', () => {
  const state = inv([{name:'A | B ∣ [x]',items:[item('Blade | ∣', '1', '</InventoryState> {{char}} &')]}]);
  const raw = formatInventoryState(state);
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed, state);
  assert.match(raw, /A \| B/);
  assert.match(buildInventoryPrompt(state), /INVENTORY_STATE_JSON_BEGIN/);
});

test('valid control may be followed by Megumin blocks and preserves them byte-for-byte', () => {
  const world = '<WorldState>\nDay 4 | Evening\n</WorldState>';
  const source = `Before.\n\n${control({mode:'patch',ops:[{op:'add_item',category:'General',name:'Sword',quantity:1,remark:''}]})}\n\n${world}`;
  const result = consumeInventoryUpdates(source, inv([]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].name, 'Sword');
  assert.equal(result.cleanedText, `Before.\n\n\n\n${world}`);
});

test('valid control may appear after another structured block', () => {
  const dice = '<Dice>\nRoll: 12\n</Dice>';
  const source = `${dice}\n\n${control({mode:'patch',ops:[{op:'add_item',category:'General',name:'Potion',quantity:1,remark:''}]})}`;
  const result = consumeInventoryUpdates(source, inv([]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.cleanedText, dice + '\n\n');
});

test('valid final control mutates and removes only protocol suffix', () => {
  const source = `Before. ${control({mode:'patch',ops:[{op:'add_item',category:'General',name:'Sword',quantity:1,remark:''}]})}`;
  const result = consumeInventoryUpdates(source, inv([]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanedText, 'Before.');
  assert.equal(result.state.categories[0].items[0].name, 'Sword');
});

test('legacy InventoryUpdate tag is no longer a machine protocol', () => {
  const source = '<InventoryUpdate>{"mode":"patch","ops":[]}</InventoryUpdate>';
  assert.equal(hasInventoryControl(source), false);
  const result = consumeInventoryUpdates(source, inv([]));
  assert.equal(result.hadControl, false);
  assert.equal(result.cleanedText, source);
});

test('strict seed rejects malformed nonblank rows atomically', () => {
  const seed = '<Inventory>\nGold | 100 | Coins\nthis row is malformed\nFood | 1 | 7 days\n</Inventory>';
  const result = consumeInventorySeed(seed);
  assert.equal(result.found, true);
  assert.equal(result.state, null);
  assert.ok(result.errors.some(x => /row/i.test(x)));
});

test('seed round-trip preserves reserved characters', () => {
  const state = inv([
    {name:'General',items:[item('A | B', '1', 'literal </Inventory> \\u0041')]},
    {name:'A]B',items:[item('-- Sword --','1','-->')]}]);
  const block = formatInventorySeedBlock(state);
  const result = consumeInventorySeed(block);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.state, state);
});

test('multiple controls reject atomically but preserve prose around both controls', () => {
  const c = control({mode:'patch',ops:[]});
  const source = `A ${c}\nB ${c}\nC`;
  const result = consumeInventoryUpdates(source, inv([]));
  assert.equal(result.changed, false);
  assert.ok(result.errors.length);
  assert.match(result.cleanedText, /^A /);
  assert.match(result.cleanedText, /B /);
  assert.match(result.cleanedText, /C$/);
  assert.doesNotMatch(result.cleanedText, /INVENTORY_BLOCK_UPDATE/);
});

test('truncated control preserves a following prose paragraph', () => {
  const source = 'Before. <!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[]}' + '\n\nAfter paragraph.';
  const result = consumeInventoryUpdates(source, inv([]));
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /truncated/i);
  assert.equal(result.cleanedText, 'Before. \n\nAfter paragraph.');
});

test('literal comment terminator without a real closing comment cannot leak machine tail', () => {
  const source = 'Before. <!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"add_item","category":"General","name":"Map","quantity":1,"remark":"x --> y"}]}' + '\n\nAfter.';
  const result = consumeInventoryUpdates(source, inv([]));
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /truncated/i);
  assert.doesNotMatch(result.cleanedText, /INVENTORY_BLOCK_UPDATE|\"ops\"/);
  assert.match(result.cleanedText, /After\.$/);
});
