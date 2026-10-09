// Regression tests for the v0.6.4 audit fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    interruptedSnapshots,
    latestValidInventoryInText,
    normalizeInventoryTransports,
    parseInventoryBlock,
    stripInventoryBlocks,
} from '../src/snapshot.js';
import { buildInventoryGenerationPrompt, hasInventoryContext, injectInventorySnapshot } from '../src/prompt.js';

const visible = text => text.replace(/<!--[\s\S]*?-->/g, '');
const rows = body => parseInventoryBlock(`<Inventory>\n${body}\n</Inventory>`).categories.map(c => [c.name, c.items.map(i => [i.name, i.quantity, i.remark])]);
const newSnapshot = '<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Gold\n</Inventory>\n-->';

test('H1: Continue after a cut-off snapshot keeps the new prose and the new snapshot', () => {
    const cut = normalizeInventoryTransports('She paid the innkeeper.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Go').text;
    const continued = `${cut}\nThen she climbed the stairs and slept.\n${newSnapshot}`;
    const normalized = normalizeInventoryTransports(continued);
    assert.equal(normalized.changed, false, 'already well-formed: nothing to repair');
    assert.match(visible(normalized.text), /climbed the stairs/);
    assert.equal(latestValidInventoryInText(continued).state.categories[0].items[0].remark, '90 Gold');
    assert.equal(stripInventoryBlocks(continued), 'She paid the innkeeper.\n\nThen she climbed the stairs and slept.\n');
});

test('H1: an unclosed envelope or bare block followed by more text is closed before the prose', () => {
    const raw = `She paid.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Go\nThen she slept.\n${newSnapshot}`;
    const once = normalizeInventoryTransports(raw);
    assert.match(visible(once.text), /Then she slept\./);
    assert.equal(normalizeInventoryTransports(once.text).changed, false, 'idempotent');
    assert.equal(latestValidInventoryInText(once.text).state.categories[0].items[0].remark, '90 Gold');

    const bare = 'She paid.\n<Inventory>\nCoin Pouch | 1 | 90 Go\nThen she slept.\n<Inventory>\nCoin Pouch | 1 | 90 Gold\n</Inventory>';
    assert.equal(interruptedSnapshots(bare).length, 1);
    assert.equal(visible(normalizeInventoryTransports(bare).text).replace(/\s+/g, ' ').trim(), 'She paid. Then she slept.');
});

test('M3: markdown-table rows parse; divider and header rows are skipped', () => {
    assert.deepEqual(rows('| Name | Qty | Remark |\n|---|---|---|\n| Rope | 1 | coiled |\n| Tent | 1 |'), [
        ['General', [['Rope', '1', 'coiled'], ['Tent', '1', '']]],
    ]);
});

test('M4: a trailing "|" is not part of the remark; empty cells still work', () => {
    assert.deepEqual(rows('Rope | 1 | coiled |\nTent | 1 | \nAxe |'), [
        ['General', [['Rope', '1', 'coiled'], ['Tent', '1', ''], ['Axe', '', '']]],
    ]);
    assert.deepEqual(rows('Map | 1 | North | South roads'), [['General', [['Map', '1', 'North | South roads']]]]);
});

test('L1: a whole row wrapped in brackets is a row; one-pipe headers stay headers', () => {
    assert.deepEqual(rows('[Spare Rope | 1 | coiled]'), [['General', [['Spare Rope', '1', 'coiled']]]]);
    assert.deepEqual(rows('[Food | Water]\nBread | 2 |'), [['Food | Water', [['Bread', '2', '']]]]);
});

test('L2: finished prose after an unclosed block is not hidden; a cut-off row is', () => {
    const prose = 'Story.\n<Inventory>\nA | 1 |\nB | 2 |\nShe smiled.';
    assert.equal(normalizeInventoryTransports(prose).changed, false);
    assert.match(normalizeInventoryTransports('Story.\n<Inventory>\nA | 1 |\nB | 2 |\nCoi').text, /Coi\n-->$/);
});

test('L3: list markers are not part of item names', () => {
    assert.deepEqual(rows('- Rope | 1 |\n* Tent | 1 |\n• Lamp | 1 |\n2. Axe | 1 |\n-10% Coupon | 1 |'), [
        ['General', [['Rope', '1', ''], ['Tent', '1', ''], ['Lamp', '1', ''], ['Axe', '1', ''], ['-10% Coupon', '1', '']]],
    ]);
});

test('L5: the prompt explains the backslash escapes it shows', () => {
    assert.match(buildInventoryGenerationPrompt(), /A backslash in the snapshot above escapes the character after it/);
});

test('L6: bare: false removes only Inventory envelopes', () => {
    const text = `Example:\n<Inventory>\nRope | 1 |\n</Inventory>\nHistory:\n${newSnapshot}`;
    assert.equal(stripInventoryBlocks(text, { bare: false }), 'Example:\n<Inventory>\nRope | 1 |\n</Inventory>\nHistory:\n');
    assert.equal(stripInventoryBlocks(text), 'Example:\n\nHistory:\n');
});

test('M2: a text prompt carrying the placeholder gets it replaced in place; otherwise the context is prepended', () => {
    const placeholder = buildInventoryGenerationPrompt();
    assert.equal(hasInventoryContext(placeholder), true);
    const marked = { prompt: `<|im_start|>system\n${placeholder}<|im_end|>\nhistory`, dryRun: false };
    assert.equal(injectInventorySnapshot(marked, undefined).kind, 'text-extension-prompt');
    assert.ok(marked.prompt.startsWith('<|im_start|>system'));
    const unmarked = { prompt: 'history', dryRun: false };
    assert.equal(injectInventorySnapshot(unmarked, undefined).kind, 'text');
    assert.ok(unmarked.prompt.startsWith('INVENTORY_BLOCK_V05_CONTEXT_BEGIN'));
});
