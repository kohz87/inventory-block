import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('all release metadata and runtime VERSION say 0.2.8', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.2.8');
  assert.equal(JSON.parse(read('package.json')).version, '0.2.8');
  assert.match(read('src/constants.js'), /VERSION = '0\.2\.8'/);
  assert.match(read('style.css'), /^\/\* Inventory Block v0\.2\.8 \*\//);
  assert.match(read('README.md'), /Inventory Block v0\.2\.8/);
});

test('changelog retains pipeline hardening and documents 0.2.8 currency tracking', () => {
  const changelog=read('CHANGELOG.md');
  assert.match(changelog,/## 0\.2\.8/);
  assert.match(changelog,/currency/i);
  assert.match(changelog,/synthetic\/base64/i);
  assert.match(changelog,/before or after other structured\/Megumin blocks/i);
  assert.match(changelog,/Operation-shape resilience/i);
});

test('0.2.8 keeps Megumin-safe protocol and adds final-stage currency accounting', () => {
  const protocol=read('src/protocol.js');
  const injection=read('src/injection.js');
  const currency=read('src/currency.js');
  assert.doesNotMatch(protocol,/must be the final non-whitespace content/i);
  assert.match(protocol,/Other required response blocks may appear before or after it/i);
  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);
  assert.match(protocol,/normalizePatchOperation/);
  assert.match(protocol,/preferred for SillyTavern sentence-trimming compatibility/);
  assert.doesNotMatch(protocol,/missing its required terminal period/);
  assert.match(injection,/withCurrencyTrackingRule/);
  assert.match(currency,/100 Gold/);
  assert.match(currency,/85 Gold/);
  assert.match(currency,/edit_item/);
});
