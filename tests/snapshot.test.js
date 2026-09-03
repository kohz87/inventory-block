import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyInventory,
  formatInventoryBlock,
  inventoryForGeneration,
  latestInventorySnapshot,
  latestValidInventoryInText,
  parseInventoryBlock,
  replaceOrAppendInventory,
  stripInventoryBlocks,
} from '../src/snapshot.js';

const state = {
  categories: [
    { name: 'General', items: [
      { name: 'Coin Pouch', quantity: '1', remark: '100 Gold' },
      { name: 'Food', quantity: '1', remark: 'About 7 days' },
    ] },
    { name: 'Equipped / Carried', items: [
      { name: 'Utility Knife', quantity: '1', remark: 'Belt' },
    ] },
  ],
};

function assistant(text) { return { is_user: false, is_system: false, mes: text }; }
function user(text) { return { is_user: true, is_system: false, mes: text }; }

test('Inventory block round-trips as full state', () => {
  const block = formatInventoryBlock(state);
  assert.deepEqual(parseInventoryBlock(block), state);
});

test('latest valid surviving snapshot is authoritative', () => {
  const chat = [
    assistant(`start\n\n${formatInventoryBlock(state)}`),
    user('buy a room'),
    assistant('story only'),
    assistant(`later\n\n${formatInventoryBlock({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '90 Gold' }] }] })}`),
  ];
  assert.equal(latestInventorySnapshot(chat).state.categories[0].items[0].remark, '90 Gold');
  chat.pop();
  assert.equal(latestInventorySnapshot(chat).state.categories[0].items[0].remark, '100 Gold');
});

test('malformed newer snapshot never wipes an older valid snapshot', () => {
  const chat = [
    assistant(formatInventoryBlock(state)),
    assistant('bad\n<Inventory>\nBroken row\n</Inventory>'),
  ];
  assert.equal(latestInventorySnapshot(chat).state.categories[0].items[0].remark, '100 Gold');
});

test('latest valid block wins within a continued assistant message', () => {
  const next = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '80 Gold' }] }] };
  const text = `first\n${formatInventoryBlock(state)}\ncontinued\n${formatInventoryBlock(next)}`;
  assert.equal(latestValidInventoryInText(text).state.categories[0].items[0].remark, '80 Gold');
});

test('regenerate/swipe baseline comes from before the target assistant', () => {
  const spent = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '80 Gold' }] }] };
  const chat = [assistant(formatInventoryBlock(state)), user('buy sword'), assistant(formatInventoryBlock(spent))];
  assert.equal(inventoryForGeneration(chat, 'normal').categories[0].items[0].remark, '80 Gold');
  assert.equal(inventoryForGeneration(chat, 'regenerate').categories[0].items[0].remark, '100 Gold');
  assert.equal(inventoryForGeneration(chat, 'swipe').categories[0].items[0].remark, '100 Gold');
});

test('manual save replaces latest block or appends a new checkpoint', () => {
  const edited = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '500 Gold' }] }] };
  const replaced = replaceOrAppendInventory(`story\n\n${formatInventoryBlock(state)}`, edited);
  assert.equal(latestValidInventoryInText(replaced).state.categories[0].items[0].remark, '500 Gold');
  assert.match(replaceOrAppendInventory('story only', edited), /story only[\s\S]*500 Gold/);
});

test('prompt stripping removes complete history and a trailing truncated block', () => {
  const text = `a\n${formatInventoryBlock(state)}\nb\n<Inventory>\npartial`;
  const stripped = stripInventoryBlocks(text);
  assert.doesNotMatch(stripped, /Coin Pouch|<Inventory>/);
  assert.match(stripped, /a/);
});

test('empty inventory remains a valid explicit snapshot', () => {
  assert.deepEqual(parseInventoryBlock(formatInventoryBlock(emptyInventory())), emptyInventory());
});
