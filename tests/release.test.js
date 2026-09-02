import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata says 0.2.5', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.2.5');
  assert.equal(JSON.parse(read('package.json')).version, '0.2.5');
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.2\.5 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.2\.5/);
  assert.match(read('TEST-REPORT.md'), /v0\.2\.5 Hotfix/);
});

test('changelog retains prompt-pipeline hardening and documents 0.2.5 hotfix', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.2\.5/);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/final prompt-ready/i);
  assert.match(changelog,/before or after other structured\/Megumin blocks/i);
});

test('0.2.5 protocol no longer requires absolute tail position', () => {
  const protocol=read('src/protocol.js');
  assert.doesNotMatch(protocol,/must be the final non-whitespace content/i);
  assert.match(protocol,/Other required response blocks may appear before or after it/i);
});
