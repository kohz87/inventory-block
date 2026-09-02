import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('post-response reconciler uses the minimal generateRaw API', () => {
  const start = index.indexOf('async function reconcileCompletedSession');
  const end = index.indexOf('function maybeStartReconciliation', start);
  assert.ok(start >= 0 && end > start);
  const block = index.slice(start, end);
  assert.match(block, /const generateRaw = ctx\.generateRaw/);
  assert.match(block, /await generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.doesNotMatch(block, /generateQuietPrompt/);
  assert.doesNotMatch(block, /skipWIAN|trimToSentence|quietPrompt/);
});

test('raw reconciliation remains isolated from foreground prompt-ready injection', () => {
  assert.match(index, /let rawReconciliationActive = 0/);
  assert.match(index, /rawReconciliationActive \+= 1/);
  assert.match(index, /rawReconciliationActive = Math\.max\(0, rawReconciliationActive - 1\)/);
  assert.match(index, /if \(rawReconciliationActive > 0\) return/);
});
