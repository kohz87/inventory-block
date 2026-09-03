import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.4.0', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.4.0');
  assert.equal(JSON.parse(read('package.json')).version, '0.4.0');
  assert.match(read('src/constants.js'), /VERSION = '0\.4\.0'/);
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.4\.0 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.4\.0/);
});

test('changelog documents one-pass v0.4.0 while retaining manual raw recovery history', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.4\.0/);
  assert.match(changelog,/one-pass foreground/i);
  assert.match(changelog,/Removes the automatic post-response `generateRaw` scan/i);
  assert.match(changelog,/Reconcile Latest Response/i);
  assert.match(changelog,/## 0\.3\.7/);
  assert.match(changelog,/## 0\.3\.5/);
  assert.match(changelog,/inventory-reconcile/i);
  assert.match(changelog,/## 0\.3\.4/);
  assert.match(changelog,/generateRaw/);
  assert.match(changelog,/## 0\.3\.3/);
  assert.match(changelog,/generateQuietPrompt/);
});

test('v0.4.0 keeps backend hardening behind foreground one-pass controls', () => {
  const protocol=read('src/protocol.js');
  const injection=read('src/injection.js');
  const resources=read('src/resources.js');
  const reconcile=read('src/reconcile.js');
  const history=read('src/history.js');
  const ui=read('src/ui.js');
  const settings=read('src/settings.js');
  const constants=read('src/constants.js');
  assert.match(protocol,/final non-whitespace content/i);
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
