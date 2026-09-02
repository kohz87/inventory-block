import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCE_TRACKING_RULE, withResourceTrackingRule } from '../src/resources.js';
import { injectGenerationPrompt } from '../src/injection.js';

const inventoryPrompt = 'INVENTORY_STATE_JSON_BEGIN\n{"categories":[]}\nINVENTORY_STATE_JSON_END';

test('resource rule is appended only to Inventory prompts', () => {
  assert.equal(withResourceTrackingRule('ordinary system text'), 'ordinary system text');
  const prompt = withResourceTrackingRule(inventoryPrompt);
  assert.match(prompt, /money, food, water, ammunition, fuel, medicine, crafting supplies/);
  assert.match(prompt, /100 Gold/);
  assert.match(prompt, /adjust_resource/);
  assert.match(prompt, /85 Gold/);
  assert.match(prompt, /About 7 days/);
  assert.match(prompt, /About 6 days/);
  assert.match(prompt, /Waterskin/);
  assert.match(prompt, /Half full/);
  assert.match(prompt, /planned, attempted, negotiated, interrupted, or failed actions/);
  assert.match(prompt, /Never produce or request a negative resource balance/);
});

test('resource rule is idempotent', () => {
  const once = withResourceTrackingRule(inventoryPrompt);
  const twice = withResourceTrackingRule(once);
  assert.equal(twice, once);
  assert.equal(twice.split(RESOURCE_TRACKING_RULE).length - 1, 1);
});

test('final Inventory injection includes generalized accounting while generic injection stays unchanged', async () => {
  const inventoryEvent = { chat: [{ role: 'user', content: 'eat and continue travelling' }] };
  const result = await injectGenerationPrompt(inventoryEvent, inventoryPrompt, { probe: ['eat and continue travelling'] });
  assert.equal(result.injected, true);
  assert.match(inventoryEvent.chat[0].content, /Finite-resource and possession accounting/);
  assert.match(inventoryEvent.chat[0].content, /Food quantity "1"/);
  assert.match(inventoryEvent.chat[0].content, /adjust_resource/);

  const genericEvent = { chat: [{ role: 'user', content: 'ordinary request' }] };
  await injectGenerationPrompt(genericEvent, 'INVENTORY', { probe: ['ordinary request'] });
  assert.equal(genericEvent.chat[0].content, 'INVENTORY');
});
