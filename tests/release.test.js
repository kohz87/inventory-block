import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('release metadata is v0.6.6', () => {
  assert.equal(JSON.parse(read('manifest.json')).version, '0.6.6');
  assert.equal(JSON.parse(read('package.json')).version, '0.6.6');
  assert.match(read('index.js'), /VERSION = '0\.6\.6'/);
});

test('active runtime contains no legacy backend/reconciliation architecture', () => {
  const active = [read('index.js'), read('src/snapshot.js'), read('src/prompt.js'), read('src/ui.js'), read('src/megumin.js'), read('src/tree.js'), read('src/diff.js')].join('\n');
  for (const forbidden of ['durableRevision', 'branchHeads', 'portableCheckpoint', 'mutationSerial', 'INVENTORY_BLOCK_UPDATE', 'generateRaw', 'adjust_resource']) {
    assert.doesNotMatch(active, new RegExp(forbidden));
  }
});

test('root README documents message-native truth and where the v0.4.3 archive lives', () => {
  assert.match(read('README.md'), /message-native/i);
  assert.match(read('README.md'), /latest valid surviving.*Inventory/i);
  assert.match(read('README.md'), /tree\/1170298720e055dc06e02748f73d33eadd606480\/legacy\/v0\.4\.3/);
  assert.equal(fs.existsSync(new URL('../legacy', import.meta.url)), false, 'legacy code no longer ships with the extension');
});
