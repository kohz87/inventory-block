import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const state = fs.readFileSync(new URL('../src/state.js', import.meta.url), 'utf8');

test('swipe handler resolves the prefix before resolving the changed branch', () => {
  const fn = index.slice(index.indexOf('function onMessageSwiped'), index.indexOf('function onChatChanged'));
  assert.match(index, /function swipeBaseRevision/);
  assert.match(fn, /swipeBaseRevision\(ctx, message, id\)/);
  assert.ok(fn.indexOf('swipeBaseRevision(ctx, message, id)') < fn.indexOf('resolveActiveRevision(ctx)'));
  assert.match(fn, /baseRevision, revision: baseRevision/);
});

test('durable fallback is wired into branch resolution and administrative reconciliation', () => {
  assert.match(state, /durableRevision/);
  assert.match(state, /durableLength <= end/);
  assert.match(state, /end < durableLength/);
  assert.match(index, /session\.replaceCapability\) markDurableRevision/);
  assert.match(index, /if \(replaceCapability\) markDurableRevision/);
});
