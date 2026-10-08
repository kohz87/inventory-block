import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatInventoryBlock, parseInventoryBlock } from '../src/snapshot.js';
import {
  ancestorIds,
  buildInventoryTree,
  clampDepth,
  displaySegments,
  groupItems,
  nodeIdForCategory,
  resolveNode,
  searchItems,
} from '../src/tree.js';
import { diffInventories } from '../src/diff.js';
import { buildInventoryGenerationPrompt } from '../src/prompt.js';

const block = `<Inventory>
Coin Pouch | 1 | 100 Gold

[Wagon]
Wagon Cover | 1 | Patched, waxed

[Wagon>Food]
Salt | 1 | Pouch

[Wagon > Food > Preserved]
Canned Rations | 12 | Crate, rear
Salt Pork | 3 | Barrel

[Wagon > Food > Fresh]
Apples | 6 | Bruised

[Wagon > Tools]
Tarp | 2 | Folded

[Equipped / Carried]
Travelling Coat | 1 | Worn

[Lent to Companions > Astra > Night Kit > Spares]
Spare Cloak | 1 |
</Inventory>`;

test('category paths are canonicalized and round-trip without changing flat categories', () => {
  const state = parseInventoryBlock(block);
  const names = state.categories.map(category => category.name);
  assert.deepEqual(names, [
    'General',
    'Wagon',
    'Wagon > Food',
    'Wagon > Food > Preserved',
    'Wagon > Food > Fresh',
    'Wagon > Tools',
    'Equipped / Carried',
    'Lent to Companions > Astra > Night Kit > Spares',
  ]);
  assert.deepEqual(parseInventoryBlock(formatInventoryBlock(state)), state);
  assert.match(formatInventoryBlock(state), /\[Wagon > Food\]/);
});

test('blank path headers are rejected and spacing variants merge into one category', () => {
  assert.throws(() => parseInventoryBlock('<Inventory>\n[ > ]\nA | 1 |\n</Inventory>'), /blank/);
  const merged = parseInventoryBlock('<Inventory>\n[A>B]\nX | 1 |\n[A > B]\nY | 1 |\n</Inventory>');
  assert.deepEqual(merged.categories.map(c => [c.name, c.items.map(i => i.name)]), [['A > B', ['X', 'Y']]]);
});

test('depth is clamped and deeper paths fold into the last level without losing items', () => {
  assert.equal(clampDepth('9'), 5);
  assert.equal(clampDepth('0'), 1);
  assert.equal(clampDepth('nope'), 3);
  assert.deepEqual(displaySegments('A > B > C > D', 3), ['A', 'B', 'C › D']);
  assert.deepEqual(displaySegments('A > B > C > D', 1), ['A › B › C › D']);
  assert.deepEqual(displaySegments('A > B', 5), ['A', 'B']);

  for (const depth of [1, 2, 3, 4, 5]) {
    const tree = buildInventoryTree(parseInventoryBlock(block), { maxDepth: depth });
    assert.equal(tree.total, 9, `depth ${depth} keeps every item`);
  }
});

test('tree nests nodes, rolls up totals and groups a subtree for display', () => {
  const tree = buildInventoryTree(parseInventoryBlock(block), { maxDepth: 3 });
  assert.deepEqual(tree.children.map(node => [node.name, node.total]), [
    ['General', 1], ['Wagon', 6], ['Equipped / Carried', 1], ['Lent to Companions', 1],
  ]);
  const wagon = tree.children[1];
  assert.deepEqual(wagon.children.map(node => node.name), ['Food', 'Tools']);
  const lent = tree.children[3];
  assert.equal(lent.children[0].children[0].name, 'Night Kit › Spares');

  const groups = groupItems(wagon);
  assert.deepEqual(groups.map(group => [group.label, group.own, group.items.length]), [
    ['Wagon', true, 1],
    ['Food', false, 1],
    ['Food › Preserved', false, 2],
    ['Food › Fresh', false, 1],
    ['Tools', false, 1],
  ]);
});

test('remembered selection falls back to the nearest surviving ancestor', () => {
  const tree = buildInventoryTree(parseInventoryBlock(block), { maxDepth: 3 });
  const fresh = nodeIdForCategory('Wagon > Food > Fresh', 3);
  assert.equal(resolveNode(tree, fresh).name, 'Fresh');
  assert.equal(resolveNode(tree, nodeIdForCategory('Wagon > Food > Gone', 3)).name, 'Food');
  assert.equal(resolveNode(tree, nodeIdForCategory('Nowhere', 3)), tree);
  assert.equal(ancestorIds(fresh).length, 3);
});

test('search spans the whole tree and matches on path', () => {
  const tree = buildInventoryTree(parseInventoryBlock(block));
  assert.deepEqual(searchItems(tree, 'salt').map(result => result.item.name), ['Salt', 'Salt Pork']);
  assert.deepEqual(searchItems(tree, 'preserved pork').map(result => result.item.name), ['Salt Pork']);
  assert.deepEqual(searchItems(tree, '   '), []);
});

test('diff reports added, changed, moved and removed items', () => {
  const before = parseInventoryBlock(block);
  const after = parseInventoryBlock(block
    .replace('Coin Pouch | 1 | 100 Gold', 'Coin Pouch | 1 | 85 Gold')
    .replace('Apples | 6 | Bruised\n', '')
    .replace('Tarp | 2 | Folded', 'Tarp | 2 | Folded\nRope | 1 | 50 ft')
    .replace('[Equipped / Carried]\nTravelling Coat | 1 | Worn', '[Equipped / Carried]')
    .replace('Spare Cloak | 1 |', 'Spare Cloak | 1 |\nTravelling Coat | 1 | Worn'));
  const changes = diffInventories(before, after);
  assert.deepEqual(changes.map(change => [change.type, change.name]), [
    ['added', 'Rope'],
    ['changed', 'Coin Pouch'],
    ['moved', 'Travelling Coat'],
    ['removed', 'Apples'],
  ]);
  assert.equal(changes[2].previousCategory, 'Equipped / Carried');
  assert.deepEqual(diffInventories(null, after), []);
  assert.deepEqual(diffInventories(before, before), []);
});

test('generation prompt explains nesting and respects the configured depth', () => {
  const state = parseInventoryBlock(block);
  assert.match(buildInventoryGenerationPrompt(state), /\[Wagon > Food\]/);
  assert.match(buildInventoryGenerationPrompt(state), /at most 3 levels deep/);
  assert.match(buildInventoryGenerationPrompt(state, { maxDepth: 5 }), /at most 5 levels deep/);
  assert.match(buildInventoryGenerationPrompt(state, { maxDepth: 1 }), /Do not nest categories/);
});

test('pane UI provides tree, drill-down, search and change strip; layout uses container queries', () => {
  const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  for (const part of ['inventory-tree', 'inventory-crumbs', 'inventory-siblings', 'inventory-children', 'inventory-search-input', 'inventory-changes']) {
    assert.match(ui, new RegExp(part));
  }
  assert.match(css, /container: inventory \/ inline-size/);
  assert.match(css, /@container inventory \(min-width: 480px\)/);
  assert.match(css, /@container inventory \(min-width: 760px\)/);
});
