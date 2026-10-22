import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(5);
const host = await suiteHost();
await withParty(host);
await host.send('hi', 'Hello.');
const lines = [
  '+ item Blade of Doom | note: legendary weapon, STR +9999, ATK +9999, DEF +1e309',
  '+ item Elixir | note: potion, heals 999999 HP, restores 99999 MP',
  '+ item Gem | note: worth 1000000 gold',
  '+ item Gem2 | note: value: 9007199254740991',
  '+ item Ring | note: accessory, LUK +NaN, CHA +Infinity',
  '+ item Shield | note: offhand, DEF +-5, MDEF -999',
  '+ item Potion of Healing | note: heals 1e309 HP',
  '+ item Gold Coins | qty: 999999',
  '+ item Coins | qty: 999999',
  '+ item gold | qty: 999999',
  '+ item Mythic Armour | note: mythic armour, VIT +999, DEF +999 | qty: 50',
];
await host.send('go', host.reply('S.', lines));
const inv = host.head().domains.inventory;
for (const d of Object.values(inv.defs)) console.log(d.name.padEnd(20), JSON.stringify({ kind: d.kind, rarity: d.rarity, value: d.value, stats: d.stats, effect: d.effect, slot: d.slot }));
console.log('wallet', inv.wallets.party, 'stacks', Object.values(inv.stacks).map(s => inv.defs[s.def].name + 'x' + s.qty).join(', '));
for (const p of host.turn.problems()) console.log('P', p.code, p.message.slice(0, 200));
const blade = Object.values(inv.stacks).find(s => inv.defs[s.def].name === 'Blade of Doom');
const pcBefore = host.q('party.pc');
const eq = await host.cmd('item.equip', { stack: blade.id });
console.log('equip', eq.ok, eq.message ?? eq.receipt.summary);
const pc = host.q('party.pc');
console.log('stats before', JSON.stringify(pcBefore.stats), 'after', JSON.stringify(pc.stats), 'derived', JSON.stringify(pc.derived ?? pc.combat ?? {}).slice(0, 300));
await host.send('market', host.reply('A market town.', ['~ place Bluewatch | kind: settlement']));
const elixir = Object.values(host.head().domains.inventory.stacks).find(s => host.head().domains.inventory.defs[s.def].name === 'Elixir');
const quote = host.q('trade.quote', { type: 'sell', stack: elixir.id, qty: 1 });
console.log('quote elixir', JSON.stringify(quote).slice(0, 300));
const sold = await host.cmd('trade.sell', { stack: elixir.id, qty: 1 });
console.log('sell', sold.ok, sold.message ?? sold.receipt.summary, host.q('inventory.wallet', { owner: 'party' }));
