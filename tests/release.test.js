import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('release metadata is v0.5.0', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.5.0');
  assert.equal(JSON.parse(read('package.json')).version, '0.5.0');
  assert.match(read('index.js'), /VERSION = '0\.5\.0'/);
});

test('active v0.5 runtime contains no legacy backend/reconciliation architecture', () => {
  const active = [read('index.js'), read('src/snapshot.js'), read('src/prompt.js'), read('src/ui.js'), read('src/megumin.js')].join('\n');
  for (const forbidden of ['durableRevision', 'branchHeads', 'portableCheckpoint', 'mutationSerial', 'INVENTORY_BLOCK_UPDATE', 'generateRaw', 'adjust_resource']) {
    assert.doesNotMatch(active, new RegExp(forbidden));
  }
});

test('v0.4.3 is archived and root README documents message-native truth', () => {
  assert.match(read('README.md'), /message-native/i);
  assert.match(read('README.md'), /latest valid surviving.*Inventory/i);
  assert.match(read('legacy/README.md'), /v0\.4\.3/);
});
