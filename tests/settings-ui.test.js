import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('standard SillyTavern Extensions settings drawer remains wired', () => {
    assert.match(source, /#extensions_settings/);
    assert.match(source, /#extensions_settings2/);
    assert.match(source, /inventory_block_settings_edit/);
    assert.match(source, /inventory_block_settings_history/);
    assert.match(source, /inventory_block_settings_copy/);
    assert.match(source, /ensureExtensionUiEntries/);
});
