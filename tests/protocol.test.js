import test from 'node:test';
import assert from 'node:assert/strict';
import {
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    stripReservedInventorySeed,
} from '../src/protocol.js';

const base = {
    categories: [
        { name: 'General', items: [{ name: 'Gold', quantity: '1', remark: '100 Gold' }] },
        { name: 'Supplies', items: [{ name: 'Rations', quantity: '3', remark: '' }] },
    ],
};

test('first-message seed parses simple rows, categories and x prefixes', () => {
    const text = `Opening\n<Inventory>\nGold | ×1 | 100 Gold\n\n[Supplies]\nRations | x3 | Travel food\n</Inventory>`;
    const result = consumeInventorySeed(text);
    assert.equal(result.errors.length, 0);
    assert.equal(result.cleanedText, 'Opening');
    assert.equal(result.state.categories[0].name, 'General');
    assert.equal(result.state.categories[0].items[0].quantity, '1');
    assert.equal(result.state.categories[1].items[0].quantity, '3');
});

test('seed copy round-trips', () => {
    const block = formatInventorySeedBlock(base);
    const parsed = consumeInventorySeed(block);
    assert.equal(parsed.errors.length, 0);
    assert.deepEqual(parsed.state, base);
});

test('invalid duplicate seed is stripped but rejected', () => {
    const text = `Story\n<Inventory>\n[Supplies]\nRations | 1 |\nRations | 2 |\n</Inventory>`;
    const result = consumeInventorySeed(text);
    assert.ok(result.errors.some(x => /Duplicate item/.test(x)));
    assert.equal(result.cleanedText, 'Story');
    assert.equal(result.state, null);
});

test('later reserved Inventory blocks are stripped without becoming state', () => {
    const result = stripReservedInventorySeed(`Story\n<Inventory>\nGold | 1 | 999\n</Inventory>`);
    assert.equal(result.found, true);
    assert.equal(result.cleanedText, 'Story');
});

test('truncated reserved Inventory blocks are stripped', () => {
    const result = stripReservedInventorySeed('Story\n<Inventory>\nGold | 1 | 999');
    assert.equal(result.truncated, true);
    assert.equal(result.cleanedText, 'Story');
});

test('patch adjusts numeric quantity and preserves omitted set_item fields', () => {
    const text = `Story\n<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1},{"op":"set_item","category":"General","name":"Gold","remark":"125 Gold"}]}\n-->`;
    const result = consumeInventoryUpdates(text, base);
    assert.equal(result.errors.length, 0);
    assert.equal(result.cleanedText, 'Story');
    assert.equal(result.state.categories[1].items[0].quantity, '2');
    assert.equal(result.state.categories[0].items[0].quantity, '1');
    assert.equal(result.state.categories[0].items[0].remark, '125 Gold');
});

test('adjust_item rejects semantic/non-numeric quantities atomically', () => {
    const semantic = { categories: [{ name: 'General', items: [{ name: 'Food', quantity: '1 set', remark: '8 days' }] }] };
    const text = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"General","name":"Food","by":-1}]}\n-->`;
    const result = consumeInventoryUpdates(text, semantic);
    assert.ok(result.errors.length);
    assert.deepEqual(result.state, semantic);
});

test('move and rename collisions are rejected atomically', () => {
    const collision = {
        categories: [
            { name: 'A', items: [{ name: 'Knife', quantity: '1', remark: '' }] },
            { name: 'B', items: [{ name: 'Knife', quantity: '1', remark: '' }] },
        ],
    };
    const move = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"move_item","fromCategory":"A","toCategory":"B","name":"Knife"}]}\n-->`;
    assert.ok(consumeInventoryUpdates(move, collision).errors.length);

    const rename = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"add_item","category":"A","name":"Sword","quantity":"1","remark":""},{"op":"edit_item","category":"A","name":"Sword","newName":"Knife"}]}\n-->`;
    assert.ok(consumeInventoryUpdates(rename, collision).errors.length);
});

test('multiple control blocks are all rejected rather than double-applied', () => {
    const text = `Story\n<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]}\n-->\n<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]}\n-->`;
    const result = consumeInventoryUpdates(text, base);
    assert.ok(result.errors.some(x => /Multiple/.test(x)));
    assert.deepEqual(result.state, base);
    assert.equal(result.cleanedText, 'Story');
});

test('malformed replacement cannot clear inventory', () => {
    const text = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"replace","categories":"oops"}\n-->`;
    const result = consumeInventoryUpdates(text, base);
    assert.ok(result.errors.length);
    assert.deepEqual(result.state, base);
});

test('seed serializer/parser round-trips a range of ordinary inventories', () => {
    for (let n = 1; n <= 40; n++) {
        const state = {
            categories: [
                { name: 'General', items: [{ name: `Coin ${n}`, quantity: String(n), remark: `${n * 10} Gold` }] },
                { name: `Party ${n}`, items: [
                    { name: `Rations ${n}`, quantity: `${n} set`, remark: `${n + 2} days` },
                    { name: `Tool ${n}`, quantity: '1', remark: 'Good condition' },
                ] },
            ],
        };
        const parsed = consumeInventorySeed(formatInventorySeedBlock(state));
        assert.equal(parsed.errors.length, 0);
        assert.deepEqual(parsed.state, state);
    }
});

test('add_item rejects non-positive numeric additions', () => {
    const negativeNew = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"add_item","category":"Supplies","name":"Torch","quantity":"-1","remark":""}]}\n-->`;
    assert.ok(consumeInventoryUpdates(negativeNew, base).errors.length);
    const negativeExisting = `<!-- INVENTORY_BLOCK_UPDATE\n{"mode":"patch","ops":[{"op":"add_item","category":"Supplies","name":"Rations","quantity":"-1","remark":""}]}\n-->`;
    assert.ok(consumeInventoryUpdates(negativeExisting, base).errors.length);
});
