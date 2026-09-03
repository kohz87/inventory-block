import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  formatInventoryBlock,
  formatInventoryTransport,
  inventoryBlocks,
  latestValidInventoryInText,
  normalizeInventoryTransports,
  replaceOrAppendInventory,
  stripInventoryBlocks,
  TRANSPORT_MARKER,
} from '../src/snapshot.js';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const state = {
  categories: [
    { name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }] },
    { name: 'Equipped / Carried', items: [{ name: 'Knife', quantity: '1', remark: 'Belt' }] },
  ],
};

test('canonical message transport is an HTML comment containing the full Inventory snapshot', () => {
  const transport = formatInventoryTransport(state);
  assert.match(transport, new RegExp(`^<!-- ${TRANSPORT_MARKER}`));
  assert.match(transport, /<Inventory>[\s\S]*100 Gold[\s\S]*<\/Inventory>/);
  assert.match(transport, /-->$/);
  assert.equal(latestValidInventoryInText(transport).state.categories[0].items[0].remark, '100 Gold');
});

test('legacy visible Inventory output is normalized into hidden transport without changing state', () => {
  const legacy = `Narration\n\n${formatInventoryBlock(state)}`;
  const normalized = normalizeInventoryTransports(legacy);
  assert.equal(normalized.changed, true);
  assert.match(normalized.text, /Narration/);
  assert.match(normalized.text, new RegExp(TRANSPORT_MARKER));
  assert.equal(inventoryBlocks(normalized.text).at(-1).hidden, true);
  assert.equal(latestValidInventoryInText(normalized.text).state.categories[0].items[0].remark, '100 Gold');
});

test('prompt stripping removes the entire hidden transport envelope', () => {
  const text = `Narration\n${formatInventoryTransport(state)}\n<npc_state_v1>{}</npc_state_v1>`;
  const stripped = stripInventoryBlocks(text);
  assert.match(stripped, /Narration/);
  assert.match(stripped, /npc_state_v1/);
  assert.doesNotMatch(stripped, /INVENTORY_BLOCK_V05|Coin Pouch|<Inventory>/);
});

test('manual replace upgrades a legacy plain block to hidden transport', () => {
  const next = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '500 Gold' }] }] };
  const replaced = replaceOrAppendInventory(`Story\n${formatInventoryBlock(state)}`, next);
  assert.match(replaced, new RegExp(TRANSPORT_MARKER));
  assert.match(replaced, /500 Gold/);
  assert.doesNotMatch(stripInventoryBlocks(replaced), /500 Gold|Coin Pouch/);
});

test('active UI uses native details/summary categories and runtime normalizes received/rendered messages', () => {
  const ui = read('src/ui.js');
  const index = read('index.js');
  assert.match(ui, /el\('details', 'inventory-category'\)/);
  assert.match(ui, /el\('summary', 'inventory-category-title'\)/);
  assert.match(ui, /addEventListener\('toggle'/);
  assert.match(index, /normalizeInventoryTransports/);
  assert.match(index, /onCharacterMessageRendered/);
  assert.match(index, /MESSAGE_EDITED/);
  assert.match(index, /MESSAGE_SWIPED/);
});
