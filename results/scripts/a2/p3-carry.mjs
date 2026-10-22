// a2 probe 3: carry capacity from things that carry (pack `carry`, reader's list): stacks, splits, qty.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const view = h => { const c = h.q('items.carry', {}); return `load ${c.load}/${c.capacity} bag ${c.bag} bagBonus ${c.bagBonus} people ${JSON.stringify(c.people?.map(p => [p.load, p.capacity, p.bonus]))}`; };
const host = await started({ seed: 4 });
console.log('start', view(host));
await host.send('Packs.', host.reply('A pedlar\'s leavings.', ['+ item Backpack | qty: 3']));
const bp = host.items().find(i => i.name === 'Backpack');
console.log('3 backpacks one stack', bp.qty, view(host));
let r = await host.cmd('inventory.split', { stack: bp.stack, qty: 1 }); console.log('split', r.ok, r.code ?? '', view(host));
const bp2 = host.items().filter(i => i.name === 'Backpack');
r = await host.cmd('inventory.split', { stack: bp2.find(s => s.qty === 2).stack, qty: 1 }); console.log('split2', r.ok, r.code ?? '', view(host));
console.log('stacks', JSON.stringify(host.items().filter(i => i.name === 'Backpack').map(i => [i.stack, i.qty, i.carry])));
// give them to the PC
const pc = host.q('party.pc');
for (const s of host.items().filter(i => i.name === 'Backpack')) { r = await host.cmd('inventory.transfer', { stack: s.stack, to: pc.id, qty: s.qty }); console.log('transfer', r.ok, r.code ?? '', r.message ?? ''); }
console.log('after transfer', view(host));
host.close();
