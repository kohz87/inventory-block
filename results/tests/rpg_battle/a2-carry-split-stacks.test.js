// Breaker a2 (v2 break pass 2): "A stack adds its bonus once, whatever its count (a stack of backpacks is
// one backpack's worth)" (items/carry.js carryBonuses). Splitting the stack (inventory.split, a free click)
// makes each piece its own stack, and each adds the bonus again: three Ersveil Backpacks (carry 20) in the
// shared bag add 20 as one stack and 60 after two splits; handing them to a member merges them back to 20.
// The same things carry different amounts by stack shape. Drop into rpg_battle/tests/v2/break/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { started } from './helpers/suite.js';

test('a2-carry-split: splitting a stack of things that carry does not raise the party\'s capacity', async t => {
    t.mock.method(console, 'warn', () => {});
    const host = await started({ seed: 4 });
    t.after(() => host.close());
    await host.send('Packs.', host.reply('A pedlar\'s leavings.', ['+ item Backpack | qty: 3']));
    const stack = host.items().find(item => item.name === 'Backpack');
    assert.equal(stack.qty, 3);
    const before = host.q('items.carry', {}).capacity;
    assert.equal((await host.cmd('inventory.split', { stack: stack.stack, qty: 1 })).ok, true);
    const two = host.items().find(item => item.name === 'Backpack' && item.qty === 2);
    assert.equal((await host.cmd('inventory.split', { stack: two.stack, qty: 1 })).ok, true);
    const after = host.q('items.carry', {}).capacity;
    assert.equal(after, before, `capacity ${before} with one stack of 3 Backpacks, ${after} after splitting them into 3 stacks`);
});
