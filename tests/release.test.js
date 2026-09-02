import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.2.9', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.2.9');
  assert.equal(JSON.parse(read('package.json')).version, '0.2.9');
  assert.match(read('src/constants.js'), /VERSION = '0\.2\.9'/);
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.2\.9 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.2\.9/);
});

test('changelog retains prior hardening and documents 0.2.9 generalized resource accounting', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.2\.9/);
  assert.match(changelog,/food/i);
  assert.match(changelog,/water/i);
  assert.match(changelog,/ammunition/i);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/before or after other structured\/Megumin blocks/i);
  assert.match(changelog,/Operation-shape resilience/i);
});

test('0.2.9 keeps Megumin-safe protocol and adds final-stage generalized resource accounting', () => {
  const protocol=read('src/protocol.js');
  const injection=read('src/injection.js');
  const resources=read('src/resources.js');
  assert.doesNotMatch(protocol,/must be the final non-whitespace content/i);
  assert.match(protocol,/Other required response blocks may appear before or after it/i);
  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);
  assert.match(protocol,/normalizePatchOperation/);
  assert.match(protocol,/preferred for SillyTavern sentence-trimming compatibility/);
  assert.doesNotMatch(protocol,/missing its required terminal period/);
  assert.match(injection,/withResourceTrackingRule/);
  assert.match(resources,/100 Gold/);
  assert.match(resources,/About 7 days/);
  assert.match(resources,/Waterskin/);
  assert.match(resources,/ammunition/);
  assert.match(resources,/edit_item/);
});
