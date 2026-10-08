// Regression tests for the v0.6.3 audit fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    formatInventoryBlock,
    formatInventoryTransport,
    inventoryBlocks,
    inventoryForGeneration,
    latestValidInventoryInText,
    normalizeInventoryTransports,
    parseInventoryBlock,
    replaceOrAppendInventory,
    stripInventoryBlocks,
    truncatedSnapshot,
} from '../src/snapshot.js';
import { buildInventoryGenerationPrompt, stripHistoricalInventory } from '../src/prompt.js';

const one = (name, remark = '', category = 'General') => ({ categories: [{ name: category, items: [{ name, quantity: '1', remark }] }] });
const gold = value => formatInventoryBlock(one('Coin Pouch', `${value} Gold`));

test('H1: regenerate/swipe exclude the final message only when it is an assistant reply', () => {
    const chat = [{ is_user: false, mes: gold(100) }, { is_user: true, mes: 'buy' }, { is_user: false, mes: gold(90) }];
    assert.equal(inventoryForGeneration(chat, 'regenerate').categories[0].items[0].remark, '100 Gold');
    assert.equal(inventoryForGeneration(chat, 'swipe').categories[0].items[0].remark, '100 Gold');
    chat.push({ is_user: true, mes: 'reply failed, regenerate' });
    assert.equal(inventoryForGeneration(chat, 'regenerate').categories[0].items[0].remark, '90 Gold');
    chat.push({ is_user: false, is_system: true, mes: 'note' });
    assert.equal(inventoryForGeneration(chat, 'regenerate').categories[0].items[0].remark, '90 Gold');
});

test('H2: prose mentioning <inventory> is never treated as a cut-off snapshot', () => {
    const card = 'You are Mira.\nKeep an <inventory> of what the party owns.\nMira never gives discounts.';
    assert.equal(stripInventoryBlocks(card), card);
    const narration = 'She pats her bag.\n<inventory> is a word she hates.\nThen she walks on.';
    assert.equal(normalizeInventoryTransports(narration).changed, false);
    assert.equal(truncatedSnapshot('He said <Inventory> twice.'), null);
});

test('H2: real cut-off snapshots are still detected, hidden and stripped', () => {
    const cut = 'Story\n<Inventory>\nCoin | 1 | 10 Gold\nRope | 1 | 5';
    assert.equal(truncatedSnapshot(cut).kind, 'bare');
    assert.equal(stripInventoryBlocks(cut), 'Story');
    assert.match(normalizeInventoryTransports(cut).text, /^Story\n<!-- INVENTORY_BLOCK_V05\n<Inventory>[\s\S]*-->$/);
    const envelope = 'Story\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nCoin | 1 |';
    assert.equal(truncatedSnapshot(envelope).kind, 'envelope');
    assert.match(normalizeInventoryTransports(envelope).text, /Coin \| 1 \|\n-->$/);
    assert.equal(stripInventoryBlocks(envelope), 'Story');
});

test('H3: "-->" in item text cannot break the hidden envelope', () => {
    const state = one('Map', 'Oakhaven --> Veyl');
    const transport = formatInventoryTransport(state);
    assert.equal(inventoryBlocks(`Story\n${transport}`)[0].hidden, true);
    assert.equal(parseInventoryBlock(formatInventoryBlock(state)).categories[0].items[0].remark, 'Oakhaven --> Veyl');

    const modelRaw = 'Story.\n<!-- INVENTORY_BLOCK_V05\n<Inventory>\nMap | 1 | Oakhaven --> Veyl\n</Inventory>\n-->';
    const once = normalizeInventoryTransports(modelRaw);
    assert.equal(once.changed, true);
    assert.equal(normalizeInventoryTransports(once.text).changed, false, 'repair is idempotent');
    assert.equal((once.text.match(/INVENTORY_BLOCK_V05/g) ?? []).length, 1);
    assert.equal(latestValidInventoryInText(once.text).state.categories[0].items[0].remark, 'Oakhaven --> Veyl');
    assert.equal(stripInventoryBlocks(modelRaw), 'Story.\n');
    assert.doesNotMatch(replaceOrAppendInventory(modelRaw, one('Rope')), /Veyl|-->\s*-->/);
});

test('H3: block tags inside item text are escaped', () => {
    const state = one('Note', 'reads </Inventory> and <Inventory>');
    assert.equal(parseInventoryBlock(formatInventoryBlock(state)).categories[0].items[0].remark, 'reads </Inventory> and <Inventory>');
    assert.equal(inventoryBlocks(formatInventoryTransport(state)).length, 1);
});

test('H4: bracketed item rows stay items; headers end at their only unescaped "]"', () => {
    const parsed = parseInventoryBlock('<Inventory>\n[Sealed] Letter | 1 | [unopened]\nRope | 1 |\n[Pack]\nTent | 1 |\n</Inventory>');
    assert.deepEqual(parsed.categories.map(c => [c.name, c.items.map(i => i.name)]), [
        ['General', ['[Sealed] Letter', 'Rope']],
        ['Pack', ['Tent']],
    ]);
    // A pre-v0.6.3 header with an unescaped "|" is still a category, not an item.
    assert.equal(parseInventoryBlock('<Inventory>\n[Food | Water]\nBread | 2 |\n</Inventory>').categories[0].name, 'Food | Water');
});

test('M1: category names with "]" or "|" round-trip without growing escapes', () => {
    let text = formatInventoryBlock(one('Key', '', 'Satchel [left] | spare'));
    for (let i = 0; i < 3; i++) text = formatInventoryBlock(parseInventoryBlock(text));
    assert.equal(parseInventoryBlock(text).categories[0].name, 'Satchel [left] | spare');
    assert.match(text, /^\[Satchel \[left\\\] \\\| spare\]$/m);
    // A header written by v0.6.2 and earlier (`\]` never unescaped) reads back correctly.
    assert.equal(parseInventoryBlock('<Inventory>\n[Satchel [left\\]]\nKey | 1 |\n</Inventory>').categories[0].name, 'Satchel [left]');
});

test('M2: repeated headers merge and a stray "|" stays in the remark', () => {
    const parsed = parseInventoryBlock('<Inventory>\n[Pack]\nTent | 1 |\n[Wagon]\nAxe | 1 |\n[Pack]\nRope | 1 |\nMap | 1 | North | South roads\n</Inventory>');
    assert.deepEqual(parsed.categories.map(c => [c.name, c.items.map(i => i.name)]), [['Pack', ['Tent', 'Rope', 'Map']], ['Wagon', ['Axe']]]);
    assert.equal(parsed.categories[0].items[2].remark, 'North | South roads');
    assert.throws(() => parseInventoryBlock('<Inventory>\nRope | 1 |\nRope | 2 |\n</Inventory>'), /Duplicate Inventory item/);
});

test('M2: the generation prompt states the parser constraints', () => {
    const prompt = buildInventoryGenerationPrompt(one('Rope'));
    assert.match(prompt, /each item name once per category/);
    assert.match(prompt, /Never put "\|" inside a name, quantity, or remark/);
    assert.match(prompt, /never write "-->"/);
});

test('M3: stripHistoricalInventory keeps only the newest snapshot (text prompts too)', () => {
    const event = { prompt: `a\n${formatInventoryTransport(one('Coin', '100'))}\nb\n${formatInventoryTransport(one('Coin', '90'))}\nc` };
    stripHistoricalInventory(event);
    assert.match(event.prompt, /Coin \| 1 \| 90/);
    assert.doesNotMatch(event.prompt, /\| 100/);
    assert.match(event.prompt, /^a\n\nb\n<!-- INVENTORY_BLOCK_V05/);

    // A newer malformed block must not displace the last valid snapshot.
    const broken = { prompt: `${formatInventoryTransport(one('Coin', '90'))}\nlater\n<Inventory>\nBroken row\n</Inventory>` };
    stripHistoricalInventory(broken);
    assert.match(broken.prompt, /Coin \| 1 \| 90/);
    assert.doesNotMatch(broken.prompt, /Broken row/);
});

test('L1: look-alike tags are not Inventory blocks', () => {
    assert.equal(inventoryBlocks('<Inventory-notes>\nA | 1 |\n</Inventory>').length, 0);
    assert.equal(inventoryBlocks('<Inventory version="2">\nA | 1 |\n</Inventory>').length, 1);
});
