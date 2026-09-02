import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildInventoryReferencePrompt, buildReconciliationPrompt, deriveAssistantEventText, parseReconciliationReply } from '../src/reconcile.js';

const base = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }, { name: 'Arrows', quantity: '5', remark: '' }] }] };
const control = payload => '<!-- INVENTORY_BLOCK_UPDATE ' + JSON.stringify(payload) + ' -->.';

test('foreground inventory reference is read-only and contains no machine protocol', () => {
  const prompt = buildInventoryReferencePrompt(base);
  assert.match(prompt, /INVENTORY_REFERENCE_JSON_BEGIN/);
  assert.match(prompt, /continuity only/i);
  assert.match(prompt, /do not output <Inventory>/i);
  assert.doesNotMatch(prompt, /INVENTORY_STATE_JSON_BEGIN/);
  assert.doesNotMatch(prompt, /INVENTORY_BLOCK_UPDATE/);
  assert.doesNotMatch(prompt, /adjust_resource|add_item|delete_item/);
  assert.doesNotMatch(prompt, /Finite-resource and possession accounting/);
});

test('hidden reconciliation prompt contains protocol, completed event, and resource accounting', () => {
  const prompt = buildReconciliationPrompt(base, { userText: 'Buy a ration for 15 Gold.', assistantText: 'You pay 15 Gold and take the ration.', type: 'normal' });
  assert.match(prompt, /hidden post-response reconciler/i);
  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);
  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);
  assert.match(prompt, /Finite-resource and possession accounting/);
  assert.match(prompt, /completedAssistantEvent/);
  assert.match(prompt, /You pay 15 Gold/);
  assert.match(prompt, /Return exactly NO_CHANGE/);
  assert.match(prompt, /bracketed OOC\/admin inventory directive/i);
});

test('Continue reconciliation scans only newly appended text', () => {
  const before = 'Earlier paragraph where 15 Gold was already paid.';
  const after = before + '\n\nNew paragraph: you drink one potion.';
  const result = deriveAssistantEventText('continue', before, after);
  assert.equal(result.error, null);
  assert.equal(result.mode, 'append');
  assert.equal(result.text, '\n\nNew paragraph: you drink one potion.');
  assert.doesNotMatch(result.text, /15 Gold/);
});

test('Continue prefix mismatch fails closed instead of rescanning old events', () => {
  const result = deriveAssistantEventText('continue', 'old text', 'rewritten old text plus new');
  assert.match(result.error, /refused to rescan/i);
  assert.equal(result.text, '');
});

test('Swipe and regenerate reconcile the complete replacement response', () => {
  for (const type of ['swipe', 'regenerate', 'normal']) {
    const result = deriveAssistantEventText(type, 'old response', 'replacement response');
    assert.equal(result.error, null);
    assert.equal(result.text, 'replacement response');
    assert.equal(result.mode, 'full');
  }
});

test('quiet reconciliation accepts NO_CHANGE without synthetic mutation', () => {
  const result = parseReconciliationReply('NO_CHANGE', base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, false);
  assert.deepEqual(result.state, base);
});

test('quiet reconciliation accepts one internal machine control and backend arithmetic', () => {
  const reply = control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -15 }] });
  const result = parseReconciliationReply(reply, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, '85 Gold');
});

test('quiet reconciliation rejects prose around the machine control', () => {
  const reply = 'Here is the update:\n' + control({ mode: 'patch', ops: [{ op: 'adjust_item', category: 'General', name: 'Arrows', by: -1 }] });
  const result = parseReconciliationReply(reply, base);
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /extra text/i);
  assert.deepEqual(result.state, base);
});

test('quiet reconciliation rejects arbitrary text instead of guessing', () => {
  const result = parseReconciliationReply('Probably no inventory change.', base);
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /neither NO_CHANGE nor one Inventory machine control/i);
});

test('runtime keeps machine writes out of foreground generation and does not re-render story in hidden reconciliation', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  const reconcileStart = index.indexOf('async function reconcileCompletedSession');
  const reconcileEnd = index.indexOf('function maybeStartReconciliation', reconcileStart);
  const block = index.slice(reconcileStart, reconcileEnd);
  assert.match(index, /const prompt = buildInventoryReferencePrompt/);
  assert.match(block, /generateRaw/);
  assert.match(block, /generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.doesNotMatch(block, /generateQuietPrompt/);
  assert.match(block, /parseReconciliationReply/);
  assert.doesNotMatch(block, /message\.mes\s*=/);
  assert.doesNotMatch(block, /refreshRenderedMessageIfPresent/);
  assert.match(index, /MESSAGE_RECEIVED[^\n]*onMessageReceived/);
  assert.match(index, /GENERATION_ENDED[^\n]*onGenerationEnded/);
  assert.match(index, /COMPLETION_FALLBACK_MS/);
  assert.match(index, /rawReconciliationActive/);
  assert.match(index, /if \(rawReconciliationActive > 0\) return/);
});
