// Regression tests for the v0.6.5 audit fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    bareBlockTexts,
    formatInventoryBlock,
    latestValidInventoryInText,
    normalizeInventoryTransports,
    parseInventoryBlock,
    stripInventoryBlocks,
    truncatedSnapshot,
} from '../src/snapshot.js';
import { buildInventoryGenerationPrompt, defuseMacros, injectInventorySnapshot } from '../src/prompt.js';

const visible = text => text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!--[\s\S]*$/, '');

test('H1: Continue that finishes the cut-off row keeps the snapshot', () => {
    for (const cut of [
        'She paid the innkeeper.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin Pouch | 1 | 90 Go',
        'She paid the innkeeper.\n<Inventory>\nCoin Pouch | 1 | 90 Go',
    ]) {
        const received = normalizeInventoryTransports(cut).text;
        assert.match(received, /90 Go\n-->$/, 'cut-off part hidden on receive');
        const continued = `${received}ld\nRope | 1 | coiled\n</Inventory>\n-->`;
        const items = latestValidInventoryInText(continued).state.categories[0].items;
        assert.deepEqual(items.map(item => [item.name, item.remark]), [['Coin Pouch', '90 Gold'], ['Rope', 'coiled']]);
        const normalized = normalizeInventoryTransports(continued);
        assert.equal(visible(normalized.text), 'She paid the innkeeper.\n');
        assert.equal((normalized.text.match(/INVENTORY_BLOCK_V05/g) ?? []).length, 1);
        assert.equal(normalizeInventoryTransports(normalized.text).changed, false, 'idempotent');
        assert.equal(stripInventoryBlocks(continued), 'She paid the innkeeper.\n');
    }
});

test('H1: a real "-->" inside a cell is escaped and never mistaken for the closer', () => {
    const state = { categories: [{ name: 'General', items: [{ name: 'Map', quantity: '1', remark: 'A --> B' }] }] };
    assert.equal(parseInventoryBlock(formatInventoryBlock(state)).categories[0].items[0].remark, 'A --> B');
});

test('L1: names that look like list markers, dividers, headers or a table header round-trip', () => {
    const names = ['- Spare', '* Star', '• Bullet', '2. Map', '3) Note', '---', ':-- Rule', '[Sealed] Letter', 'Name'];
    const state = { categories: [{ name: 'General', items: names.map(name => ({ name, quantity: name === 'Name' ? 'Qty' : '1', remark: '' })) }] };
    assert.deepEqual(parseInventoryBlock(formatInventoryBlock(state)).categories[0].items.map(item => item.name), names);
    // Model-written list markers and markdown header rows are still tolerated.
    const parsed = parseInventoryBlock('<Inventory>\n| Name | Qty | Remark |\n|---|---|---|\n- Rope | 1 |\n</Inventory>');
    assert.deepEqual(parsed.categories[0].items.map(item => item.name), ['Rope']);
});

test('L4: partial last rows of any length count as cut off; punctuated prose does not', () => {
    const tail = last => truncatedSnapshot(`Story.\n<Inventory>\nA | 1 |\n${last}`);
    for (const last of ['Coin Po', 'Rope (50 ft)', 'A very long partial item name that runs well past forty characters']) assert.ok(tail(last), last);
    for (const last of ['She smiled.', '(She smiled.)', '"Done," she said.']) assert.equal(tail(last), null, last);
});

test('L5: known history blocks are removed from user/system content; other blocks stay', () => {
    const history = '<Inventory>\nCoin Pouch | 1 | 90 Gold\n</Inventory>';
    assert.deepEqual(bareBlockTexts(`Reply\n${history}\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nA | 1 |\n</Inventory>\n-->`), [history]);
    const example = '<Inventory>\nExample | 1 | format\n</Inventory>';
    const text = `History:\n${history}\nFormat:\n${example}`;
    assert.equal(stripInventoryBlocks(text, { bare: false, knownBlocks: new Set([history]) }), `History:\n\nFormat:\n${example}`);
});

test('M1: the extension-prompt copy is defused and the real context replaces it at prompt-ready', () => {
    const state = { categories: [{ name: 'General', items: [{ name: "{{user}}'s Letter", quantity: '1', remark: '<USER> owes {{roll:1d6}}' }] }] };
    const real = buildInventoryGenerationPrompt(state);
    const placeholder = defuseMacros(real);
    assert.doesNotMatch(placeholder, /\{\{|<USER>/);
    assert.equal(placeholder.length, real.length + (real.match(/\{\{|<USER>/g) ?? []).length, 'reserves about the same size');
    const event = { prompt: `<|im_start|>system\n${placeholder}<|im_end|>\nhistory`, dryRun: false };
    injectInventorySnapshot(event, state, { contextInPrompt: true });
    assert.ok(event.prompt.includes("{{user}}'s Letter | 1 | <USER> owes {{roll:1d6}}"), 'model sees the item text verbatim');
    assert.doesNotMatch(event.prompt, /​/);
});
