import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('runtime refreshes snapshots directly on timeline events', () => {
  assert.match(index, /MESSAGE_DELETED/);
  assert.match(index, /MESSAGE_SWIPED/);
  assert.match(index, /MESSAGE_EDITED/);
  assert.match(index, /CHAT_CHANGED/);
  assert.match(index, /latestInventorySnapshot/);
});

test('manual editor writes a full snapshot into assistant message text and saves chat', () => {
  assert.match(index, /replaceOrAppendInventory/);
  assert.match(index, /syncActiveSwipeText/);
  assert.match(index, /updateMessageBlock/);
  assert.match(index, /saveChat/);
});

test('foreground prompt filtering happens in the same generation', () => {
  assert.match(index, /CHAT_COMPLETION_PROMPT_READY/);
  assert.match(index, /GENERATE_AFTER_COMBINE_PROMPTS/);
  assert.match(index, /injectInventorySnapshot/);
  assert.match(index, /inventoryBlockGenerationInterceptor/);
});
