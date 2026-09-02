import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('streaming MESSAGE_UPDATED exits before lineage or branch refresh work', () => {
  const index = read('index.js');
  assert.match(index, /generationForMessage\(ctx, messageId\)\) return;/);
  assert.doesNotMatch(index, /generationForMessage\(ctx, messageId, type\)/);
  const fn = index.slice(index.indexOf('function onMessageUpdated'), index.indexOf('function onMessageSwiped'));
  assert.ok(fn.indexOf('generationForMessage(ctx, messageId)') < fn.indexOf('invalidateLineageCache(ctx)'));
});

test('mount bridge can be suspended for foreground streaming', () => {
  const megumin = read('src/megumin.js');
  assert.match(megumin, /export function setInventoryMountSuspended/);
  assert.match(megumin, /if \(mountSuspended\) return;/);
  assert.match(megumin, /mountedMessageElement === messageElement && hasExistingMount/);
  assert.match(megumin, /scheduleInventoryMount\(0, \{ force: true \}\)/);
});

test('runtime synchronizes mount suspension with active generation sessions', () => {
  const index = read('index.js');
  assert.match(index, /setInventoryMountSuspended\(Boolean\(chatId && sessions\.activeForChat\(chatId\)\)\)/);
  assert.match(index, /sessions\.remove\(session\);\n    syncInventoryMountSuspension\(\);/);
  assert.match(index, /syncInventoryMountSuspension\(\);\n        armWatchdog\(\);/);
  assert.match(index, /scheduleInventoryMount\(30, \{ force: true \}\)/);
});
