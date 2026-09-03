import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('generateRaw is retained only for explicit manual recovery', () => {
  const autoStart = index.indexOf('async function commitCompletedSession');
  const manualStart = index.indexOf('async function reconcileLatestResponse');
  const manualEnd = index.indexOf('function registerSlashCommands', manualStart);
  assert.ok(autoStart >= 0 && manualStart > autoStart && manualEnd > manualStart);
  assert.doesNotMatch(index.slice(autoStart, manualStart), /generateRaw/);
  const manual = index.slice(manualStart, manualEnd);
  assert.match(manual, /const generateRaw = ctx\.generateRaw/);
  assert.match(manual, /await generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.match(manual, /buildReconciliationPrompt/);
  assert.match(manual, /parseReconciliationReply/);
  assert.doesNotMatch(manual, /generateQuietPrompt/);
});

test('manual raw recovery remains isolated from foreground prompt-ready injection', () => {
  assert.match(index, /let rawReconciliationActive = 0/);
  assert.match(index, /rawReconciliationActive \+= 1/);
  assert.match(index, /rawReconciliationActive = Math\.max\(0, rawReconciliationActive - 1\)/);
  assert.match(index, /if \(rawReconciliationActive > 0\) return/);
});
