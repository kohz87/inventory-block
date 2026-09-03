import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const index=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8');
const constants=fs.readFileSync(new URL('../src/constants.js',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('release metadata, runtime version, and interceptor are v0.4.1',()=>{
  assert.equal(manifest.version,'0.4.1');
  assert.equal(pkg.version,'0.4.1');
  assert.match(constants,/VERSION = '0\.4\.1'/);
  assert.equal(manifest.generate_interceptor,'inventoryBlockGenerationInterceptor');
  assert.match(index,/globalThis\.inventoryBlockGenerationInterceptor\s*=\s*onGenerationInterceptor/);
});

test('v0.4.x has no fake prompt slot or global live extension prompt',()=>{
  assert.doesNotMatch(index,/promptSlots|createPromptSlotMarker|insertPromptSlot|setExtensionPrompt/);
  assert.doesNotMatch(index,/inventoryBlockSlot|base64/i);
});

test('completed foreground messages commit inline controls only after completion signals',()=>{
  assert.match(index,/GENERATION_ENDED[^\n]*onGenerationEnded/);
  assert.match(index,/MESSAGE_RECEIVED[^\n]*onMessageReceived/);
  assert.match(index,/maybeStartForegroundCommit/);
  assert.match(index,/commitCompletedSession/);
  assert.match(index,/buildForegroundInventoryPrompt/);
  assert.doesNotMatch(index,/reconcileCompletedSession/);
  const start=index.indexOf('async function commitCompletedSession');
  const end=index.indexOf('async function reconcileLatestResponse',start);
  const block=index.slice(start,end);
  assert.match(block,/processAssistantMessage/);
  assert.doesNotMatch(block,/generateRaw|buildReconciliationPrompt|parseReconciliationReply/);
});

test('existing initial group greetings are scanned on load',()=>{
  assert.match(index,/seedInitialGreetingsIfNeeded/);
  assert.match(index,/seed_existing/);
});
