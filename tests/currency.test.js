import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENCY_TRACKING_RULE, withCurrencyTrackingRule } from '../src/currency.js';
import { injectGenerationPrompt } from '../src/injection.js';

const inventoryPrompt = 'INVENTORY_STATE_JSON_BEGIN\n{"categories":[]}\nINVENTORY_STATE_JSON_END';

test('currency rule is appended only to Inventory prompts', () => {
  assert.equal(withCurrencyTrackingRule('ordinary system text'), 'ordinary system text');
  const prompt = withCurrencyTrackingRule(inventoryPrompt);
  assert.match(prompt, /completed purchase/);
  assert.match(prompt, /edit_item/);
  assert.match(prompt, /100 Gold/);
  assert.match(prompt, /85 Gold/);
  assert.match(prompt, /zero balance/);
  assert.match(prompt, /Never produce a negative balance/);
});

test('currency rule is idempotent', () => {
  const once = withCurrencyTrackingRule(inventoryPrompt);
  const twice = withCurrencyTrackingRule(once);
  assert.equal(twice, once);
  assert.equal(twice.split(CURRENCY_TRACKING_RULE).length - 1, 1);
});

test('final Inventory injection includes currency accounting while generic injection stays unchanged', async () => {
  const inventoryEvent = { chat: [{ role: 'user', content: 'buy the potion' }] };
  const result = await injectGenerationPrompt(inventoryEvent, inventoryPrompt, { probe: ['buy the potion'] });
  assert.equal(result.injected, true);
  assert.match(inventoryEvent.chat[0].content, /Currency\/resource accounting/);

  const genericEvent = { chat: [{ role: 'user', content: 'ordinary request' }] };
  await injectGenerationPrompt(genericEvent, 'INVENTORY', { probe: ['ordinary request'] });
  assert.equal(genericEvent.chat[0].content, 'INVENTORY');
});
