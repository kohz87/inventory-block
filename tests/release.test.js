import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.4.2', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.4.2');
  assert.equal(JSON.parse(read('package.json')).version, '0.4.2');
  assert.match(read('src/constants.js'), /VERSION = '0\.4\.2'/);
  assert.match(read('README.md'), /Inventory Block v0\.4\.2/);
});

test('changelog documents v0.4.2 edit-event hardening while retaining interoperability history', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.4\.2/);
  assert.match(changelog,/MESSAGE_UPDATED/);
  assert.match(changelog,/MESSAGE_EDITED/);
  assert.match(changelog,/## 0\.4\.1/);
  assert.match(changelog,/cooperative machine/i);
  assert.match(changelog,/concurrent/i);
  assert.match(changelog,/## 0\.4\.0/);
  assert.match(changelog,/one-pass foreground/i);
  assert.match(changelog,/Reconcile Latest Response/i);
  assert.match(changelog,/## 0\.3\.7/);
  assert.match(changelog,/## 0\.3\.5/);
  assert.match(changelog,/inventory-reconcile/i);
});

test('v0.4.2 keeps backend hardening behind cooperative foreground controls', () => {
  const protocol=read('src/protocol.js');
  const injection=read('src/injection.js');
  const resources=read('src/resources.js');
  const reconcile=read('src/reconcile.js');
  const history=read('src/history.js');
  const ui=read('src/ui.js');
  const settings=read('src/settings.js');
  const constants=read('src/constants.js');
  assert.match(reconcile,/COOPERATIVE_TRAILER_RULE/);
  assert.match(reconcile,/Other extensions may emit their own independently namespaced machine payloads before or after it/);
  assert.match(injection,/TEXT_PROMPT_CAS_RETRIES/);
  assert.match(injection,/concurrent-prompt-mutation/);
  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);
  assert.match(injection,/withResourceTrackingRule/);
  assert.match(reconcile,/buildForegroundInventoryPrompt/);
  assert.match(reconcile,/buildReconciliationPrompt/);
  assert.match(reconcile,/NO_CHANGE/);
  assert.match(resources,/About 7 days/);
  assert.match(resources,/adjust_resource/);
  assert.match(protocol,/adjust_resource\{category,name,by,deleteAtZero\?\}/);
  assert.match(constants,/historyBytes/);
  assert.match(constants,/portableCheckpointBytes/);
  assert.match(history,/clearInventoryHistory/);
  assert.match(ui,/compareInventoryStates/);
  assert.match(settings,/Trim History Now/);
  assert.match(settings,/Clear History/);
  assert.match(constants,/50, 100, 200, 500, 768/);
});
