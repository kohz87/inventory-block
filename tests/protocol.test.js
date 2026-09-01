import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildInventoryPrompt,
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    formatInventoryState,
    mergeInventoryStates,
    stripReservedInventorySeed,
} from '../src/protocol.js';

const inv = categories => ({ categories });
const item = (name, quantity = '1', remark = '') => ({ name, quantity, remark });
const patch = ops => `<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify({ mode: 'patch', ops })} -->.`;

test('no-control processing is byte-for-byte invisible to prose', () => {
    const prose = 'Paragraph A   \n\n\n\nParagraph B\n\n';
    const result = consumeInventoryUpdates(prose, inv([]));
    assert.equal(result.cleanedText, prose);
    assert.equal(result.hadControl, false);
    assert.equal(stripReservedInventorySeed(prose).cleanedText, prose);
});

test('machine control survives sentence-trimming terminal punctuation and is stripped atomically', () => {
    const source = `Story ends. ${patch([{ op: 'add_item', category: 'General', name: 'Ration', quantity: 2, remark: '' }])}`;
    assert.equal(source.endsWith('.'), true);
    const result = consumeInventoryUpdates(source, inv([]));
    assert.equal(result.errors.length, 0);
    assert.equal(result.cleanedText, 'Story ends.');
    assert.equal(result.state.categories[0].items[0].quantity, '2');
});

test('literal comment terminator inside JSON does not leak machine text', () => {
    const source = `Story. ${patch([{ op: 'add_item', category: 'General', name: 'Map', quantity: 1, remark: 'points --> north' }])}`;
    const result = consumeInventoryUpdates(source, inv([]));
    assert.deepEqual(result.errors, []);
    assert.equal(result.cleanedText, 'Story.');
    assert.equal(result.state.categories[0].items[0].remark, 'points --> north');
});

test('missing control terminal period is rejected and stripped', () => {
    const source = 'Story. <!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[]} -->';
    const result = consumeInventoryUpdates(source, inv([]));
    assert.equal(result.changed, false);
    assert.match(result.errors.join(' '), /terminal period/i);
    assert.equal(result.cleanedText, 'Story.');
});

test('malformed or trailing control cannot leak JSON into stored prose', () => {
    const source = 'Story. <!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"add_item"}]} --> trailing machine junk';
    const result = consumeInventoryUpdates(source, inv([]));
    assert.equal(result.cleanedText, 'Story. ');
    assert.match(result.errors.join(' '), /final/);
});

test('prompt data escapes XML, macro braces and pipes', () => {
    const state = inv([{ name: 'A[slot]<&>{x}', items: [item('Blade | {{user}}', '1', '</InventoryState> & {{char}}')] }]);
    const formatted = formatInventoryState(state);
    assert.doesNotMatch(formatted, /<\/InventoryState>/);
    assert.doesNotMatch(formatted, /\{\{user\}\}/);
    assert.match(formatted, /&lt;\/InventoryState&gt;/);
    assert.match(formatted, /&#123;&#123;user&#125;&#125;/);
    assert.match(formatted, /A&#91;slot&#93;/);
    assert.match(formatted, /∣/);
    assert.match(buildInventoryPrompt(state), /terminal period is mandatory/i);
});

test('strict v2 seed format round-trips previously ambiguous and reserved values', () => {
    const state = inv([
        { name: 'General', items: [
            item('-- Sword --', '1', 'literal </Inventory> text'),
            item('Name', 'Quantity', 'Remark'),
            item('Pipe | Slash \\ Tag', '2', 'x]y <Inventory> \\u003C'),
        ] },
        { name: 'A]B </Inventory>', items: [item('Food', '1', '7 days')] },
    ]);
    const block = formatInventorySeedBlock(state);
    assert.doesNotMatch(block.slice(block.indexOf('\n') + 1, block.lastIndexOf('\n')), /<\/Inventory>/);
    const parsed = consumeInventorySeed(`Before\n${block}\nAfter`);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.state, state);
    assert.equal(parsed.cleanedText, 'Before\n\nAfter');
});

test('seed parser no longer treats markdown headers or -- names -- as categories', () => {
    const source = '<Inventory>\n-- Sword -- | 1 | Weapon\nName | Quantity | Remark\n</Inventory>';
    const parsed = consumeInventorySeed(source);
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.state.categories[0].items[0].name, '-- Sword --');
    assert.equal(parsed.state.categories[0].items[1].name, 'Name');
});

test('manual seed only decodes the reserved angle-bracket unicode escapes', () => {
    const seed = `<Inventory>\nLiteral \\u0041 | 1 | Keep \\u0042 text\nAngle \\u003C | 1 | close \\u003E\n</Inventory>`;
    const parsed = consumeInventorySeed(seed);
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.state.categories[0].items[0].name, 'Literal \\u0041');
    assert.equal(parsed.state.categories[0].items[0].remark, 'Keep \\u0042 text');
    assert.equal(parsed.state.categories[0].items[1].name, 'Angle <');
    assert.equal(parsed.state.categories[0].items[1].remark, 'close >');
});

test('multiple greeting seeds merge without overwriting prior categories', () => {
    const base = inv([{ name: 'Astra', items: [item('Smock', '1', 'Worn')] }]);
    const added = inv([{ name: 'Kiri', items: [item('Smock', '1', 'Worn')] }]);
    const merged = mergeInventoryStates(base, added);
    assert.deepEqual(merged.categories.map(x => x.name), ['Astra', 'Kiri']);
    assert.throws(() => mergeInventoryStates(base, inv([{ name: 'Astra', items: [item('Smock', '2', 'Worn')] }])), /collision/i);
});

test('patch operands reject coercible arrays, booleans and object item names', () => {
    const base = inv([{ name: 'General', items: [item('Gold', '10', '')] }]);
    for (const by of [true, [5], { value: 5 }]) {
        const result = consumeInventoryUpdates(`X ${patch([{ op: 'adjust_item', category: 'General', name: 'Gold', by }])}`, base);
        assert.equal(result.changed, false);
        assert.ok(result.errors.length);
    }
    const badName = consumeInventoryUpdates(`X ${patch([{ op: 'delete_item', category: 'General', name: {} }])}`, base);
    assert.equal(badName.changed, false);
    assert.match(badName.errors.join(' '), /item name must be a string/i);
});

test('replace remains capability-gated', () => {
    const source = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"replace","replaceToken":"secret","categories":[]} -->.';
    assert.ok(consumeInventoryUpdates(source, inv([])).errors.length);
    assert.equal(consumeInventoryUpdates(source, inv([]), { replaceCapability: 'secret' }).errors.length, 0);
});
