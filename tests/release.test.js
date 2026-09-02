import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.2.6', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.2.6');
  assert.equal(JSON.parse(read('package.json')).version, '0.2.6');
  assert.match(read('src/constants.js'), /VERSION = '0\.2\.6'/);
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.2\.6 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.2\.6/);
  assert.match(read('TEST-REPORT.md'), /v0\.2\.6 Hotfix/);
});

test('changelog retains pipeline hardening and documents 0.2.6 aliases', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.2\.6/);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/before or after other structured\/Megumin blocks/i);
  assert.match(changelog,/Operation-shape resilience/i);
});

test('0.2.6 protocol keeps Megumin-safe placement and explicit canonical op grammar', () => {
  const protocol=read('src/protocol.js');
  assert.doesNotMatch(protocol,/must be the final non-whitespace content/i);
  assert.match(protocol,/Other required response blocks may appear before or after it/i);
  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);
  assert.match(protocol,/normalizePatchOperation/);
});
