import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const index=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8');
const constants=fs.readFileSync(new URL('../src/constants.js',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('release metadata, runtime version, and interceptor are v0.3.3',()=>{
  assert.equal(manifest.version,'0.3.3');
  assert.equal(pkg.version,'0.3.3');
  assert.match(constants,/VERSION = '0\.3\.3'/);
  assert.equal(manifest.generate_interceptor,'inventoryBlockGenerationInterceptor');
  assert.match(index,/globalThis\.inventoryBlockGenerationInterceptor\s*=\s*onGenerationInterceptor/);
});

test('v0.3.3 has no fake prompt slot or global live extension prompt',()=>{
  assert.doesNotMatch(index,/promptSlots|createPromptSlotMarker|insertPromptSlot|setExtensionPrompt/);
  assert.doesNotMatch(index,/inventoryBlockSlot|base64/i);
});

test('completed foreground messages reconcile only after completion signals',()=>{
  assert.match(index,/GENERATION_ENDED[^\n]*onGenerationEnded/);
  assert.match(index,/MESSAGE_RECEIVED[^\n]*onMessageReceived/);
  assert.match(index,/generateQuietPrompt/);
  assert.match(index,/maybeStartReconciliation/);
  assert.match(index,/buildInventoryReferencePrompt/);
  assert.doesNotMatch(index,/const prompt = buildInventoryPrompt\(/);
});

test('existing initial group greetings are scanned on load',()=>{
  assert.match(index,/seedInitialGreetingsIfNeeded/);
  assert.match(index,/seed_existing/);
});
