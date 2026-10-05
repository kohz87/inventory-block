import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

function body(name) {
  const match = new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}\\n`).exec(index);
  assert.ok(match, `${name} should exist`);
  return match[0];
}

test('Refresh / Rescan runs a real rescan instead of only re-rendering', () => {
  assert.match(index, /#inventory_block_settings_refresh'\)\?\.addEventListener\('click', \(\) => void rescanInventory\(\)\)/);
  const rescan = body('rescanInventory');
  assert.match(rescan, /generationRunning\(\)/, 'declines while a response is genuinely generating');
  assert.match(rescan, /clearSession\(chatId\)/, 'clears a stale pending session that suspended the pane');
  assert.match(rescan, /normalizeMessageTransport\(id, \{ rerender: true, save: false \}\)/, 'hides raw blocks left in narration');
  assert.match(rescan, /if \(hidden\) await saveChat\(ctx\)/, 'saves the chat once, only when something changed');
  assert.match(rescan, /refreshAll\(0\)/);
  assert.match(rescan, /rescanReport\(ctx, hidden\)/);
});

test('rescan reports the current snapshot and any newer invalid block', () => {
  const report = body('rescanReport');
  assert.match(report, /currentSnapshot\(ctx\)/);
  assert.match(report, /newestGeneratedBlockStatus\(message\)/);
  assert.match(report, /No valid Inventory snapshot found/);
  assert.match(report, /from message #\$\{snapshot\.messageIndex\}/);
});

test('a generation that never reports back cannot suspend Inventory forever', () => {
  assert.match(body('prepareGeneration'), /armSessionWatchdog\(chatId\)/);
  const watchdog = body('armSessionWatchdog');
  assert.match(watchdog, /generationRunning\(\)/);
  assert.match(watchdog, /clearSession\(chatId\)/);
});
