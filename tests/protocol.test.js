import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildInventoryPrompt,
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    hasCompleteInventoryUpdate,
    stripReservedInventorySeed,
} from '../src/protocol.js';

const base = {
    categories: [
        { name: 'General', items: [{ name: 'Gold', quantity: '1', remark: '100 Gold' }] },
        { name: 'Supplies', items: [{ name: 'Rations', quantity: '3', remark: '' }] },
    ],
};

test('seed parses simple rows, categories and x prefixes', () => {
    const result = consumeInventorySeed(`Opening\n<Inventory>\nGold | ×1 | 100 Gold\n\n[Supplies]\nRations | x3 | Travel food\n</Inventory>`);
    assert.equal(result.errors.length, 0);
    assert.equal(result.cleanedText, 'Opening');
    assert.equal(result.state.categories[0].items[0].quantity, '1');
    assert.equal(result.state.categories[1].items[0].quantity, '3');
});

test('seed copy round-trips pipes, backslashes and closing brackets', () => {
    const special = { categories: [
        { name: 'General', items: [{ name: 'Map | Copy', quantity: '1', remark: 'C:\\tmp | intact' }] },
        { name: 'Astra ] Gear', items: [{ name: 'Ribbon', quantity: '1', remark: 'Blue | gold' }] },
    ] };
    const parsed = consumeInventorySeed(formatInventorySeedBlock(special));
    assert.equal(parsed.errors.length, 0);
    assert.deepEqual(parsed.state, special);
});

test('multiple first-message seeds are stripped and rejected', () => {
    const result = consumeInventorySeed('Story\n<Inventory>\nGold | 1 |\n</Inventory>\n<Inventory>\nFood | 1 |\n</Inventory>');
    assert.ok(result.errors.some(x => /Exactly one/.test(x)));
    assert.equal(result.cleanedText, 'Story');
});

test('later reserved Inventory blocks are stripped', () => {
    const result = stripReservedInventorySeed(`Story\n<Inventory>\nGold | 1 | 999\n</Inventory>`);
    assert.equal(result.found, true);
    assert.equal(result.cleanedText, 'Story');
});

test('patch adjusts quantity and preserves omitted set_item fields', () => {
    const text = `Story\n<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1},{"op":"set_item","category":"General","name":"Gold","remark":"125 Gold"}]}\n-->`;
    const result = consumeInventoryUpdates(text, base);
    assert.equal(result.errors.length, 0);
    assert.equal(result.state.categories[1].items[0].quantity, '2');
    assert.equal(result.state.categories[0].items[0].quantity, '1');
    assert.equal(result.state.categories[0].items[0].remark, '125 Gold');
});

test('set/edit non-positive numeric quantity deletes existing item', () => {
    const set = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"set_item","category":"Supplies","name":"Rations","quantity":"0"}]}\n-->`, base);
    assert.equal(set.errors.length, 0);
    assert.equal(set.state.categories[1].items.length, 0);
    const edit = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"edit_item","category":"Supplies","name":"Rations","quantity":-2}]}\n-->`, base);
    assert.equal(edit.errors.length, 0);
    assert.equal(edit.state.categories[1].items.length, 0);
});

test('non-empty category deletion requires explicit destructive confirmation', () => {
    const denied = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"delete_category","category":"Supplies"}]}\n-->`, base);
    assert.ok(denied.errors.some(x => /confirm/.test(x)));
    const allowed = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"delete_category","category":"Supplies","confirm":"delete-items"}]}\n-->`, base);
    assert.equal(allowed.errors.length, 0);
    assert.equal(allowed.state.categories.some(x => x.name === 'Supplies'), false);
});

test('replace is rejected without exact per-generation capability', () => {
    const payload = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"replace","replaceToken":"abc","categories":[{"name":"General","items":[{"name":"Food","quantity":"1","remark":""}]}]}\n-->`;
    assert.ok(consumeInventoryUpdates(payload, base).errors.length);
    assert.ok(consumeInventoryUpdates(payload, base, { replaceCapability: 'wrong' }).errors.length);
    const accepted = consumeInventoryUpdates(payload, base, { replaceCapability: 'abc' });
    assert.equal(accepted.errors.length, 0);
    assert.equal(accepted.state.categories[0].items[0].name, 'Food');
});

test('prompt exposes replacement token only when authorized', () => {
    assert.match(buildInventoryPrompt(base), /replacement is disabled/i);
    assert.match(buildInventoryPrompt(base, { replaceCapability: 'secret' }), /secret/);
});

test('control must be final non-whitespace response content', () => {
    const middle = `Before\n<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]}\n-->\nAfter`;
    const result = consumeInventoryUpdates(middle, base);
    assert.ok(result.errors.some(x => /final/.test(x)));
    assert.deepEqual(result.state, base);
    assert.equal(result.cleanedText, 'Before\n\nAfter');
});

test('complete-control detector ignores truncated controls', () => {
    assert.equal(hasCompleteInventoryUpdate('<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch"}'), false);
    assert.equal(hasCompleteInventoryUpdate('<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[]}\n-->'), true);
});

test('object-valued fields are rejected atomically', () => {
    const result = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"set_item","category":"General","name":"Gold","quantity":{"bad":1}}]}\n-->`, base);
    assert.ok(result.errors.length);
    assert.deepEqual(result.state, base);
});

test('object category arguments and excessive patch op counts are rejected', () => {
    const objectCategory = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"add_item","category":{"bad":1},"name":"Torch","quantity":"1","remark":""}]}\n-->`, base);
    assert.ok(objectCategory.errors.length);

    const ops = Array.from({ length: 257 }, () => ({ op: 'set_item', category: 'General', name: 'Gold', remark: 'x' }));
    const tooMany = consumeInventoryUpdates(`<!-- INVENTORY_BLOCK_UPDATE\n${JSON.stringify({ mode: 'patch', ops })}\n-->`, base);
    assert.ok(tooMany.errors.some(x => /too many operations/.test(x)));
});
