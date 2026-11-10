import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(5);
const host = await suiteHost();
await withParty(host);
await host.send('hi', host.reply('Market.', ['~ place Bluewatch | kind: settlement']));
const names = ['Healing Draught', 'Greater Healing Draught', 'Superior Healing Potion', 'Elixir | note: potion, heals 999999 HP', 'Iron Sword', 'Legendary Sword | note: legendary weapon', 'Blade | note: legendary weapon, ATK +9999', 'Gem | note: a gem worth 5000 gold', 'Ruby'];
await host.send('go', host.reply('S.', names.map(n => `+ item ${n}`)));
const inv = host.head().domains.inventory;
for (const s of Object.values(inv.stacks)) {
  const d = inv.defs[s.def];
  const q = host.q('trade.quote', { type: 'sell', stack: s.id, qty: 1 });
  console.log(d.name.padEnd(26), 'value', d.value, 'sell', q.each, JSON.stringify(d.effect), JSON.stringify(d.stats), d.rarity);
}
