import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeInventoryUpdates } from '../src/protocol.js';
import { buildForegroundInventoryPrompt } from '../src/reconcile.js';
import { injectGenerationPrompt } from '../src/injection.js';

const base = {
  categories: [{
    name: 'General',
    items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }],
  }],
};

const inventoryControl = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"adjust_resource","category":"General","name":"Coin Pouch","by":-6}]} -->.';
const npcPayload = '<npc_state_v1>\n{"exchangeActiveNpcIds":["npc-katrin"],"inChatNpcIds":["npc-katrin"]}\n</npc_state_v1>';

function assertForeignPayloadPreserved(result, story) {
  assert.match(result.cleanedText, new RegExp(story.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(result.cleanedText.includes(npcPayload), 'foreign NPC payload must remain byte-for-byte intact');
  assert.doesNotMatch(result.cleanedText, /INVENTORY_BLOCK_UPDATE/);
}

test('foreground prompt uses a cooperative machine trailer instead of claiming absolute final position', () => {
  const prompt = buildForegroundInventoryPrompt(base);
  assert.match(prompt, /machine-output trailer/i);
  assert.match(prompt, /Other extensions may emit their own independently namespaced machine payloads before or after it/i);
  assert.match(prompt, /never nest, merge, repeat, rewrite, suppress, or copy another extension's payload/i);
  assert.doesNotMatch(prompt, /as the final non-whitespace content of the response/i);
});

test('Inventory cleanup preserves a foreign NPC payload that appears before Inventory', () => {
  const story = 'Katrin takes the coins and gives Lucien the key.';
  const source = `${story}\n\n${npcPayload}\n\n${inventoryControl}`;
  const result = consumeInventoryUpdates(source, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, '94 Gold');
  assertForeignPayloadPreserved(result, story);
});

test('Inventory cleanup preserves a foreign NPC payload that appears after Inventory', () => {
  const story = 'Katrin takes the coins and gives Lucien the key.';
  const source = `${story}\n\n${inventoryControl}\n\n${npcPayload}`;
  const result = consumeInventoryUpdates(source, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, '94 Gold');
  assertForeignPayloadPreserved(result, story);
});

test('text prompt injection retries when another extension mutates the shared prompt during token counting', async () => {
  const event = { prompt: 'ORIGINAL RP PROMPT' };
  let calls = 0;
  const tokenCounter = async text => {
    calls += 1;
    if (calls === 1) event.prompt = `NPC STATE PROMPT\n${event.prompt}`;
    return Math.ceil(String(text).length / 4);
  };

  const result = await injectGenerationPrompt(event, 'INVENTORY PROMPT', {
    contextSize: 10000,
    getTokenCountAsync: tokenCounter,
    requireProbe: false,
  });

  assert.equal(result.injected, true);
  assert.equal(result.kind, 'text');
  assert.ok(result.retries >= 1);
  assert.equal(event.prompt, 'INVENTORY PROMPT\nNPC STATE PROMPT\nORIGINAL RP PROMPT');
});

test('text prompt injection fails closed instead of overwriting continuously changing foreign prompt state', async () => {
  const event = { prompt: 'ORIGINAL RP PROMPT' };
  let revision = 0;
  const tokenCounter = async text => {
    revision += 1;
    event.prompt = `FOREIGN-${revision}\nORIGINAL RP PROMPT`;
    return Math.ceil(String(text).length / 4);
  };

  const result = await injectGenerationPrompt(event, 'INVENTORY PROMPT', {
    contextSize: 10000,
    getTokenCountAsync: tokenCounter,
    requireProbe: false,
  });

  assert.equal(result.injected, false);
  assert.equal(result.reason, 'concurrent-prompt-mutation');
  assert.match(event.prompt, /^FOREIGN-4\nORIGINAL RP PROMPT$/);
  assert.doesNotMatch(event.prompt, /^INVENTORY PROMPT/);
});
