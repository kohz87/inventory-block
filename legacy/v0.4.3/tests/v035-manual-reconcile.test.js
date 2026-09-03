import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/settings.js', import.meta.url), 'utf8');

test('manual reconciliation action and slash command are present', () => {
  assert.match(settings, /Reconcile Latest Response/);
  assert.match(index, /async function reconcileLatestResponse/);
  assert.match(index, /name: 'inventory-reconcile'/);
  assert.match(index, /aliases: \['inv-reconcile'\]/);
  assert.match(index, /registerSlashCommands\(\)/);
});

test('manual reconciliation uses generateRaw and shares backend validator', () => {
  const start = index.indexOf('async function reconcileLatestResponse');
  const end = index.indexOf('function registerSlashCommands', start);
  const block = index.slice(start, end);
  assert.match(block, /generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.match(block, /buildReconciliationPrompt/);
  assert.match(block, /parseReconciliationReply/);
  assert.match(block, /createRevision/);
  assert.doesNotMatch(block, /generateQuietPrompt/);
});

test('successful manual reconciliation stamps exact message text', () => {
  assert.match(index, /function stampReconciliation/);
  assert.match(index, /textLength/);
  assert.match(index, /textHash/);
  assert.match(index, /This response has already been reconciled/);
});

test('manual reconciliation fails closed on unsafe legacy or concurrent state', () => {
  assert.match(index, /response already carries an Inventory state change/i);
  assert.match(index, /Inventory or chat history changed while manual reconciliation was running/i);
  assert.match(index, /previous reconciliation boundary/i);
  assert.match(index, /generationLockFor\(ctx\)/);
  assert.match(index, /rawReconciliationActive > 0/);
  assert.match(index, /const expectedChatId = chatIdOf\(ctx\)/);
  assert.doesNotMatch(index, /chatIdOf\(live\) !== chatIdOf\(ctx\)/);
});

test('manual Continue retry scans only text after the stamped boundary', () => {
  assert.match(index, /text\.slice\(stamp\.textLength\)/);
  assert.match(index, /reconciliationTextHash\(prefix\) !== stamp\.textHash/);
  assert.match(index, /type: stamp \? 'continue' : 'manual_reconcile'/);
  assert.match(index, /const userText = stamp \? '' : latestUserTextBefore/);
  assert.match(index, /swipe\.extra\[EXTRA_KEY\] = structuredClone/);
});
