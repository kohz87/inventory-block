import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildForegroundInventoryPrompt, buildInventoryReferencePrompt, buildReconciliationPrompt, deriveAssistantEventText, parseReconciliationReply } from '../src/reconcile.js';

const base = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }, { name: 'Arrows', quantity: '5', remark: '' }] }] };
const control = payload => '<!-- INVENTORY_BLOCK_UPDATE ' + JSON.stringify(payload) + ' -->.';

test('foreground Inventory prompt contains canonical state, machine protocol and resource accounting', () => {
  const prompt = buildForegroundInventoryPrompt(base);
  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);
  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);
  assert.match(prompt, /adjust_resource|add_item|delete_item/);
  assert.match(prompt, /Finite-resource and possession accounting/);
  assert.match(prompt, /one-pass accounting/i);
  assert.match(prompt, /final non-whitespace output/i);
});

test('legacy read-only helper remains non-writing for compatibility', () => {
  const prompt = buildInventoryReferencePrompt(base);
  assert.match(prompt, /INVENTORY_REFERENCE_JSON_BEGIN/);
  assert.doesNotMatch(prompt, /INVENTORY_BLOCK_UPDATE/);
});

test('manual reconciliation prompt still contains protocol, completed event, and resource accounting', () => {
  const prompt = buildReconciliationPrompt(base, { userText: 'Buy a ration for 15 Gold.', assistantText: 'You pay 15 Gold and take the ration.', type: 'normal' });
  assert.match(prompt, /hidden post-response reconciler/i);
  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);
  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);
  assert.match(prompt, /Finite-resource and possession accounting/);
  assert.match(prompt, /completedAssistantEvent/);
  assert.match(prompt, /Return exactly NO_CHANGE/);
});

test('manual Continue reconciliation helper scans only newly appended text', () => {
  const before = 'Earlier paragraph where 15 Gold was already paid.';
  const after = before + '\n\nNew paragraph: you drink one potion.';
  const result = deriveAssistantEventText('continue', before, after);
  assert.equal(result.error, null);
  assert.equal(result.text, '\n\nNew paragraph: you drink one potion.');
  assert.doesNotMatch(result.text, /15 Gold/);
});

test('manual Continue prefix mismatch fails closed', () => {
  const result = deriveAssistantEventText('continue', 'old text', 'rewritten old text plus new');
  assert.match(result.error, /refused to rescan/i);
  assert.equal(result.text, '');
});

test('manual reconciliation parser accepts NO_CHANGE and a single validated control', () => {
  const none = parseReconciliationReply('NO_CHANGE', base);
  assert.deepEqual(none.errors, []);
  assert.equal(none.changed, false);
  const reply = control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -15 }] });
  const changed = parseReconciliationReply(reply, base);
  assert.deepEqual(changed.errors, []);
  assert.equal(changed.state.categories[0].items[0].remark, '85 Gold');
});

test('manual reconciliation parser rejects prose around the machine control', () => {
  const reply = 'Here is the update:\n' + control({ mode: 'patch', ops: [{ op: 'adjust_item', category: 'General', name: 'Arrows', by: -1 }] });
  const result = parseReconciliationReply(reply, base);
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /extra text/i);
});

test('runtime foreground completion contains no automatic second LLM request', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  const start = index.indexOf('async function commitCompletedSession');
  const end = index.indexOf('async function reconcileLatestResponse', start);
  const block = index.slice(start, end);
  assert.match(index, /const prompt = buildForegroundInventoryPrompt/);
  assert.match(block, /processAssistantMessage/);
  assert.doesNotMatch(block, /generateRaw|generateQuietPrompt|buildReconciliationPrompt|parseReconciliationReply/);
  assert.match(index, /MESSAGE_RECEIVED[^\n]*onMessageReceived/);
  assert.match(index, /GENERATION_ENDED[^\n]*onGenerationEnded/);
  assert.match(index, /COMPLETION_FALLBACK_MS/);
});
