import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

function functionBlock(name, nextName) {
  const start = index.indexOf(`function ${name}`);
  const end = index.indexOf(`function ${nextName}`, start + 1);
  assert.ok(start >= 0, `${name} must exist`);
  assert.ok(end > start, `${nextName} must follow ${name}`);
  return index.slice(start, end);
}

test('generic MESSAGE_UPDATED never consumes an untracked Inventory control', () => {
  const block = functionBlock('onMessageUpdated', 'swipeBaseRevision');
  const genericStart = block.indexOf('if (!manualEdit) {');
  const genericReturn = block.indexOf('return;', genericStart);
  const manualControl = block.indexOf('if (hasInventoryControl(message.mes))');

  assert.ok(genericStart >= 0);
  assert.ok(genericReturn > genericStart);
  assert.ok(manualControl > genericReturn, 'manual control parsing must occur only after the generic-update branch has returned');
  assert.doesNotMatch(block, /hasCompleteInventoryUpdate\(message\.mes\)/);
});

test('manual MESSAGE_EDITED remains the trusted untracked control path', () => {
  assert.match(index, /isTrustedUntrackedControl\(type\)[\s\S]*\['edited', 'existing_swipe'\]/);
  assert.match(index, /MESSAGE_EDITED[^\n]*onMessageUpdated\(id, 'edited', true\)/);
  const block = functionBlock('onMessageUpdated', 'swipeBaseRevision');
  assert.match(block, /if \(hasInventoryControl\(message\.mes\)\) void processAssistantMessage\(messageId, type\)/);
});

test('streaming MESSAGE_UPDATED still exits before lineage invalidation', () => {
  const block = functionBlock('onMessageUpdated', 'swipeBaseRevision');
  const activeGuard = block.indexOf('generationForMessage(ctx, messageId)');
  const invalidate = block.indexOf('invalidateLineageCache(ctx)');
  assert.ok(activeGuard >= 0 && invalidate > activeGuard);
});

test('generic non-streaming updates refresh branch state instead of stripping transport', () => {
  const block = functionBlock('onMessageUpdated', 'swipeBaseRevision');
  const genericStart = block.indexOf('if (!manualEdit) {');
  const manualStart = block.indexOf('if (ctx) invalidateLineageCache(ctx);', genericStart + 1);
  const generic = block.slice(genericStart, manualStart);
  assert.match(generic, /resolveBranchAndRefresh/);
  assert.doesNotMatch(generic, /processAssistantMessage|consumeInventoryUpdates|hasInventoryControl/);
});
