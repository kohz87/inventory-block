// a2 probe 16: buying a second thing that carries, when one is already in the bag: canCarry counts its
// bonus ("a mule carries itself") but the bag's stack adds its bonus once, so the buy goes over the limit.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const host = await started({ seed: 16 });
const shops = host.q('trade.shops');
console.log('shops', JSON.stringify(shops));
let found = null;
for (const s of shops ?? []) { const st = host.q('trade.stock', { kind: s.slug }); const it = st.items.find(i => /Torch/.test(i.def.name)); if (it) { found = { shop: st.shop, item: it }; console.log('has', s.slug, it.def.name, it.price, it.left); } }
await host.send('Gold.', host.reply('Pay.', ['+ coin 400', '+ item Backpack']));
const c = () => host.q('items.carry', {});
console.log('carry', c().load, '/', c().capacity);
// fill up to capacity with Burlap? Use Hemp Rope (goods weight 2) via story
let n = 0;
while (c().capacity - c().load > 1 && n < 30) { await host.send('More.', host.reply('Things.', ['+ item Coarse Bread | qty: 10'])); n++; }
console.log('filled', c().load, '/', c().capacity);
if (found) {
  const r = await host.cmd('trade.buy', { shop: found.shop, def: found.item.def.id, qty: 1 });
  console.log('buy', found.item.def.name, r.ok ? 'ok' : r.code + ' ' + r.message);
  console.log('after', c().load, '/', c().capacity, 'enc', JSON.stringify(host.q('inventory.encumbrance')));
}
host.close();
