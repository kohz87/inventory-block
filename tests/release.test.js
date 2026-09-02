import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.3.1', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.3.1');
  assert.equal(JSON.parse(read('package.json')).version, '0.3.1');
  assert.match(read('src/constants.js'), /VERSION = '0\.3\.1'/);
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.3\.1 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.3\.1/);
});

test('changelog retains prior hardening and documents v0.3.1 history inspection', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.3\.1/);
  assert.match(changelog,/View/i);
  assert.match(changelog,/compar/i);
  assert.match(changelog,/Trim History Now/i);
  assert.match(changelog,/Clear History/i);
  assert.match(changelog,/## 0\.2\.9/);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/before or after other structured\/Megumin blocks/i);
  assert.match(changelog,/Operation-shape resilience/i);
});

test('v0.3.1 keeps resource accounting and adds bounded history tooling', () => {
  const protocol=read('src/protocol.js');
  const injection=read('src/injection.js');
  const resources=read('src/resources.js');
  const history=read('src/history.js');
  const ui=read('src/ui.js');
  const settings=read('src/settings.js');
  const constants=read('src/constants.js');
  assert.doesNotMatch(protocol,/must be the final non-whitespace content/i);
  assert.match(protocol,/Other required response blocks may appear before or after it/i);
  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);
  assert.match(injection,/withResourceTrackingRule/);
  assert.match(resources,/About 7 days/);
  assert.match(resources,/adjust_resource/);
  assert.match(resources,/ammunition/);
  assert.match(history,/clearInventoryHistory/);
  assert.match(history,/scrubInventoryMetadata/);
  assert.match(ui,/compareInventoryStates/);
  assert.match(ui,/View/);
  assert.match(ui,/Compare/);
  assert.match(settings,/Trim History Now/);
  assert.match(settings,/Clear History/);
  assert.match(constants,/HISTORY_RETENTION_OPTIONS/);
  assert.match(constants,/portableCheckpoints/);
  assert.match(constants,/50, 100, 200, 500, 768/);
});
