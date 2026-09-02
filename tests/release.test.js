import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata says 0.2.4', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.2.4');
  assert.equal(JSON.parse(read('package.json')).version, '0.2.4');
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.2\.4 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.2\.4/);
  assert.match(read('TEST-REPORT.md'), /v0\.2\.4 Hard-Pass/);
});

test('changelog documents prompt-slot removal and final-only injection', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.2\.4/);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/final prompt-ready/i);
});
