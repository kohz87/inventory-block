import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { consumeInventoryUpdates } from '../src/protocol.js';
import { buildForegroundInventoryPrompt } from '../src/reconcile.js';

const base = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }] }] };

test('one-pass prompt authorizes a cooperative hidden patch in the same foreground response', () => {
  const prompt = buildForegroundInventoryPrompt(base);
  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);
  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);
  assert.match(prompt, /write the visible response normally first/i);
  assert.match(prompt, /machine-output trailer/i);
  assert.doesNotMatch(prompt, /final non-whitespace output/i);
  assert.match(prompt, /If nothing changes, emit no Inventory control/i);
});

test('foreground machine transport persists state while stripping itself from story text', () => {
  const story = 'Lucien pays twenty gold and takes the parcel.';
  const machine = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"adjust_resource","category":"General","name":"Coin Pouch","by":-20}]} -->.';
  const result = consumeInventoryUpdates(`${story}\n\n${machine}`, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].remark, '80 Gold');
  assert.equal(result.cleanedText.trim(), story);
  assert.doesNotMatch(result.cleanedText, /INVENTORY_BLOCK_UPDATE/);
});

test('no foreground control means no synthetic Inventory mutation', () => {
  const story = 'Lucien studies the parcel without touching his coin pouch.';
  const result = consumeInventoryUpdates(story, base);
  assert.deepEqual(result.errors, []);
  assert.equal(result.hadControl, false);
  assert.equal(result.changed, false);
  assert.deepEqual(result.state, base);
  assert.equal(result.cleanedText, story);
});

test('automatic completion path never starts a second model session', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  const autoStart = index.indexOf('async function commitCompletedSession');
  const manualStart = index.indexOf('async function reconcileLatestResponse');
  assert.ok(autoStart >= 0 && manualStart > autoStart);
  const automatic = index.slice(autoStart, manualStart);
  assert.match(automatic, /processAssistantMessage/);
  assert.doesNotMatch(automatic, /generateRaw|generateQuietPrompt/);
  assert.match(index, /message\.mes = result\.cleanedText/);
  assert.match(index, /persistChatSoon\(ctx, chatId\)/);
});

test('foreground generation gets replace capability in the same injected prompt when admin-authorized', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.match(index, /buildForegroundInventoryPrompt\(getInventoryAt\(root, baseRevision\), \{ replaceCapability \}\)/);
  assert.match(index, /session\?\.replaceCapability/);
});


test('successful trusted foreground controls stamp the cleaned response for safe Continue recovery', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.match(index, /const foregroundControlAccepted = Boolean\(/);
  assert.match(index, /pendingApplies && session\?\.promptInjected && result\.hadControl/);
  assert.match(index, /warnings\.length === 0 && !concurrentConflict/);
  assert.match(index, /if \(foregroundControlAccepted\) stampReconciliation\(ctx, id, acceptedRevision\)/);
  const messageAssign = index.indexOf('message.mes = result.cleanedText');
  const stamp = index.indexOf('if (foregroundControlAccepted) stampReconciliation(ctx, id, acceptedRevision)');
  assert.ok(messageAssign >= 0 && stamp > messageAssign, 'stamp must hash the cleaned story after machine transport is stripped');
});

test('missing or rejected foreground controls remain unstamped and manually recoverable', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  const start = index.indexOf('const foregroundControlAccepted = Boolean(');
  const end = index.indexOf('let acceptedState = result.state', start);
  const guard = index.slice(start, end);
  assert.match(guard, /result\.hadControl/);
  assert.match(guard, /warnings\.length === 0/);
  assert.match(guard, /!concurrentConflict/);
});

test('new assistant or swipe identity clears any stale reconciliation boundary', () => {
  const state = fs.readFileSync(new URL('../src/state.js', import.meta.url), 'utf8');
  const start = state.indexOf('export function attachMessageRevision');
  const end = state.indexOf('function attachCurrentRevisionToTail', start);
  const block = state.slice(start, end);
  assert.match(block, /if \(newUid\) \{/);
  assert.match(block, /delete preserved\.checkpoint/);
  assert.match(block, /delete preserved\.reconcile/);
});


test('admin durability is promoted only after a trusted foreground control is accepted', () => {
  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.match(index, /if \(foregroundControlAccepted && session\?\.replaceCapability\) markDurableRevision\(ctx, acceptedRevision\)/);
  assert.doesNotMatch(index, /if \(!concurrentConflict && warnings\.length === 0 && pendingApplies && session\?\.replaceCapability\) markDurableRevision/);
});
