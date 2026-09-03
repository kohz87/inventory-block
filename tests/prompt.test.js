import test from 'node:test';
import assert from 'node:assert/strict';
import { formatInventoryBlock } from '../src/snapshot.js';
import { buildInventoryGenerationPrompt, CONTEXT_BEGIN, injectInventorySnapshot } from '../src/prompt.js';

const oldState = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '10 Gold' }] }] };
const currentState = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '500 Gold' }, { name: 'Key', quantity: '1', remark: 'Pocket' }] }] };

test('generation prompt declares one full authoritative snapshot', () => {
  const prompt = buildInventoryGenerationPrompt(currentState);
  assert.match(prompt, /sole authoritative current possession state/);
  assert.match(prompt, /EVERY assistant response/);
  assert.match(prompt, /full snapshot, never a patch/);
  assert.match(prompt, /500 Gold/);
  assert.match(prompt, /Preserve every unchanged item and category exactly/);
  assert.equal((prompt.match(/<Inventory>/g) ?? []).length, 1);
});

test('chat prompt removes historical snapshots and injects only current state', () => {
  const event = { chat: [
    { role: 'system', content: 'rules' },
    { role: 'assistant', content: `old story\n${formatInventoryBlock(oldState)}` },
    { role: 'user', content: 'continue' },
  ] };
  const originalArray = event.chat;
  const result = injectInventorySnapshot(event, currentState);
  assert.equal(result.injected, true);
  assert.equal(event.chat, originalArray, 'shared chat-array identity must be preserved for other extensions');
  const serialized = JSON.stringify(event.chat);
  assert.doesNotMatch(serialized, /10 Gold/);
  assert.match(serialized, /500 Gold/);
  assert.equal((serialized.match(/<Inventory>/g) ?? []).length, 1);
});

test('text prompt filtering preserves foreign extension payloads', () => {
  const foreign = '<npc_state_v1>{"id":"npc-katrin"}</npc_state_v1>';
  const event = { prompt: `story\n${formatInventoryBlock(oldState)}\n${foreign}` };
  injectInventorySnapshot(event, currentState);
  assert.doesNotMatch(event.prompt, /10 Gold/);
  assert.match(event.prompt, /500 Gold/);
  assert.match(event.prompt, /npc_state_v1/);
  assert.equal((event.prompt.match(/<Inventory>/g) ?? []).length, 1);
});

test('reinjection is idempotent and refreshes the authoritative snapshot', () => {
  const event = { prompt: 'story' };
  injectInventorySnapshot(event, oldState);
  injectInventorySnapshot(event, currentState);
  assert.equal((event.prompt.match(new RegExp(CONTEXT_BEGIN, 'g')) ?? []).length, 1);
  assert.doesNotMatch(event.prompt, /10 Gold/);
  assert.match(event.prompt, /500 Gold/);
});

test('reinjection removes only Inventory-owned context and preserves foreign additions in the same system message', () => {
  const oldPrompt = buildInventoryGenerationPrompt(oldState);
  const event = { chat: [{ role: 'system', content: `${oldPrompt}\nFOREIGN_EXTENSION_KEEP` }] };
  const originalArray = event.chat;
  injectInventorySnapshot(event, currentState);
  assert.equal(event.chat, originalArray);
  const serialized = JSON.stringify(event.chat);
  assert.match(serialized, /FOREIGN_EXTENSION_KEEP/);
  assert.doesNotMatch(serialized, /10 Gold/);
  assert.match(serialized, /500 Gold/);
  assert.equal((serialized.match(new RegExp(CONTEXT_BEGIN, 'g')) ?? []).length, 1);
});
