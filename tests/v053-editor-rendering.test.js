import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('Inventory editor persists hidden state without rebuilding the assistant message DOM', () => {
  const match = /async function saveManualSnapshot\([\s\S]*?\n}\n\nasync function openEditor/.exec(index);
  assert.ok(match, 'saveManualSnapshot should exist');
  const body = match[0];
  assert.match(body, /replaceOrAppendInventory/);
  assert.match(body, /persistMessageEdit\(ctx, target, message, \{ rerender: false \}\)/);
  assert.doesNotMatch(body, /updateMessageBlock/);
  assert.match(body, /refreshAll\(0\)/);
});

test('full message rerender remains available only for transport normalization where visible output may need hiding', () => {
  assert.match(index, /normalizeMessageTransport\(id, \{ rerender: true \}\)/);
  assert.match(index, /if \(rerender && document\.querySelector/);
});
