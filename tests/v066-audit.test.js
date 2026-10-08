// Regression tests for the v0.6.6 audit fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { latestValidInventoryInText, normalizeInventoryTransports, rejoinContinuedCuts, stripInventoryBlocks } from '../src/snapshot.js';

const visible = text => text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!--[\s\S]*$/, '');
const full = 'She paid.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Gold\n</Inventory>\n-->';

test('L2: Continue that picks up exactly at the cut recovers the snapshot wherever the cut fell', () => {
    for (const cutAt of ['| 90 Go', 'Gold\n', '</Inven', '</Inventory>', '<Inven', '<!-- INVENTORY_BL']) {
        const i = full.indexOf(cutAt) + cutAt.length;
        const received = normalizeInventoryTransports(full.slice(0, i)).text;
        const continued = received + full.slice(i);
        const normalized = normalizeInventoryTransports(continued);
        assert.equal(latestValidInventoryInText(normalized.text)?.state.categories[0].items[0].remark, '90 Gold', cutAt);
        assert.equal(visible(normalized.text), 'She paid.\n', `${cutAt}: no fragments left in narration`);
        assert.equal(normalizeInventoryTransports(normalized.text).changed, false, `${cutAt}: idempotent`);
        assert.equal(stripInventoryBlocks(continued), 'She paid.\n', `${cutAt}: prompt keeps only the prose`);
    }
});

test('L2: closers of finished envelopes and closed-off cut-offs followed by prose are left alone', () => {
    const finished = `${full}\nThen she slept.`;
    assert.equal(rejoinContinuedCuts(finished), finished);
    const closedOff = 'She paid.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Go\n-->\nThen she slept.';
    assert.equal(rejoinContinuedCuts(closedOff), closedOff);
});
