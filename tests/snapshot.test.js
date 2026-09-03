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

function assistant(text, expected = null) { return { is_user: false, is_system: false, mes: text, expected }; }
function user(text) { return { is_user: true, is_system: false, mes: text }; }
function balance(value) {
  return { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${value} Gold` }] }] };
}

test('Inventory block round-trips as full state', () => {
  const block = formatInventoryBlock(state);
  assert.deepEqual(parseInventoryBlock(block), state);
});

test('latest valid surviving snapshot is authoritative', () => {
  const chat = [
    assistant(`start\n\n${formatInventoryBlock(state)}`),
    user('buy a room'),
    assistant('story only'),
    assistant(`later\n\n${formatInventoryBlock(balance(90))}`),
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
  const text = `first\n${formatInventoryBlock(state)}\ncontinued\n${formatInventoryBlock(balance(80))}`;
  assert.equal(latestValidInventoryInText(text).state.categories[0].items[0].remark, '80 Gold');
});

test('regenerate/swipe baseline comes from before the target assistant', () => {
  const chat = [assistant(formatInventoryBlock(state)), user('buy sword'), assistant(formatInventoryBlock(balance(80)))];
  assert.equal(inventoryForGeneration(chat, 'normal').categories[0].items[0].remark, '80 Gold');
  assert.equal(inventoryForGeneration(chat, 'regenerate').categories[0].items[0].remark, '100 Gold');
  assert.equal(inventoryForGeneration(chat, 'swipe').categories[0].items[0].remark, '100 Gold');
});

test('manual save replaces latest block or appends a new checkpoint', () => {
  const edited = balance(500);
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

test('selected swipe text alone determines the authoritative snapshot', () => {
  const message = assistant(formatInventoryBlock(balance(40)));
  message.swipes = [formatInventoryBlock(balance(40)), formatInventoryBlock(balance(75))];
  message.swipe_id = 0;
  const chat = [message];
  assert.equal(latestInventorySnapshot(chat).state.categories[0].items[0].remark, '40 Gold');
  message.swipe_id = 1;
  message.mes = message.swipes[1];
  assert.equal(latestInventorySnapshot(chat).state.categories[0].items[0].remark, '75 Gold');
});

test('destructive timeline churn always resolves to the newest surviving valid snapshot', () => {
  const chat = [];
  let seed = 0x12345678;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let i = 1; i <= 160; i++) {
    chat.push(user(`u${i}`));
    if (i % 11 === 0) chat.push(assistant('<Inventory>\nBroken row\n</Inventory>', null));
    const value = i * 7;
    chat.push(assistant(`story ${i}\n${formatInventoryBlock(balance(value))}`, value));
  }

  for (let step = 0; step < 120 && chat.length > 5; step++) {
    const index = Math.floor(random() * chat.length);
    chat.splice(index, 1);
    const expectedMessage = [...chat].reverse().find(message => Number.isFinite(message?.expected));
    const snapshot = latestInventorySnapshot(chat);
    if (!expectedMessage) {
      assert.equal(snapshot, null);
      continue;
    }
    assert.ok(snapshot, `snapshot should survive deletion step ${step}`);
    assert.equal(snapshot.state.categories[0].items[0].remark, `${expectedMessage.expected} Gold`);
  }
});
