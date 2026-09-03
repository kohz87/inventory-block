import test from 'node:test';
import assert from 'node:assert/strict';
import { RESOURCE_TRACKING_RULE, withResourceTrackingRule } from '../src/resources.js';
import { injectGenerationPrompt } from '../src/injection.js';
import { consumeInventoryUpdates } from '../src/protocol.js';

const inventoryPrompt = 'INVENTORY_STATE_JSON_BEGIN\n{"categories":[]}\nINVENTORY_STATE_JSON_END';

function inventoryWithTravelProvisions(remark) {
  return {
    categories: [{
      name: 'General',
      items: [{ name: 'Travel Provisions', quantity: '1', remark }],
    }],
  };
}

function adjustmentControl(by = -1) {
  return `<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"adjust_resource","category":"General","name":"Travel Provisions","by":${by}}]} -->.`;
}

test('resource rule is appended only to Inventory prompts', () => {
  assert.equal(withResourceTrackingRule('ordinary system text'), 'ordinary system text');
  const prompt = withResourceTrackingRule(inventoryPrompt);
  assert.match(prompt, /money, food, water, ammunition, fuel, medicine, crafting supplies/);
  assert.match(prompt, /one and only one numeric amount/);
  assert.match(prompt, /100 Gold/);
  assert.match(prompt, /adjust_resource/);
  assert.match(prompt, /85 Gold/);
  assert.match(prompt, /About 7 days/);
  assert.match(prompt, /About 6 days/);
  assert.match(prompt, /Several days/);
  assert.match(prompt, /About a week/);
  assert.match(prompt, /5-7 days/);
  assert.match(prompt, /5–7 days/);
  assert.match(prompt, /2 meals \/ 3 days/);
  assert.match(prompt, /MUST NOT use adjust_resource/);
  assert.match(prompt, /use edit_item only when the response establishes the complete intended replacement Remark/);
  assert.match(prompt, /emit no operation for that row rather than guessing/);
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
  assert.match(inventoryEvent.chat[0].content, /one and only one numeric amount/);
  assert.match(inventoryEvent.chat[0].content, /Several days/);
  assert.match(inventoryEvent.chat[0].content, /adjust_resource/);

  const genericEvent = { chat: [{ role: 'user', content: 'ordinary request' }] };
  await injectGenerationPrompt(genericEvent, 'INVENTORY', { probe: ['ordinary request'] });
  assert.equal(genericEvent.chat[0].content, 'INVENTORY');
});

test('adjust_resource remains fail-closed for semantic, range, and multi-number remarks', () => {
  for (const remark of ['Several days', 'About a week', '5-7 days', '5–7 days', '2 meals / 3 days']) {
    const base = inventoryWithTravelProvisions(remark);
    const result = consumeInventoryUpdates(adjustmentControl(), base);
    assert.equal(result.changed, false, remark);
    assert.deepEqual(result.state, base, remark);
    assert.match(result.errors.join(' '), /Remark must contain exactly one numeric amount/i, remark);
  }
});

test('edit_item is the deterministic semantic fallback when a complete replacement remark is known', () => {
  const base = inventoryWithTravelProvisions('About a week');
  const control = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"edit_item","category":"General","name":"Travel Provisions","remark":"Several days"}]} -->.';
  const result = consumeInventoryUpdates(control, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, 'Several days');
});
