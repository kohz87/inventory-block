// a2 probe 5: does RB price by the money scale? Generic shop stock, story-made item worth, sale price, fight loot coin; scales 1, 8, 0.1.
import { rpgHost, playOut } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
console.warn = () => {};
const core = process.argv[2] ?? 'story-block';
for (const scale of ['1', '8', '0.1', '10']) {
  const host = await rpgHost({ settings: { modules: { [core]: { economyScale: scale } } } });
  await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
  await host.send('In.', host.reply('Thornwick Village.', ['~ place Thornwick Village | kind: settlement', '+ item Steel Longsword', '+ item Wolf Pelt x2', '+ item Healing Potion']));
  const eco = host.q('inventory.economy');
  const budget = host.q('inventory.storyBudget');
  const st = host.q('trade.stock', { kind: 'smith' });
  const items = host.q('inventory.items', {});
  const val = n => items.find(i => i.name === n)?.value;
  const sell = n => { const it = items.find(i => i.name === n); const q = host.q('trade.quote', { type: 'sell', stack: it.stack, qty: 1, kind: 'general' }); return q.ok ? q.total : q.code; };
  console.log(`scale ${scale}`, JSON.stringify(eco), 'budget', budget.budget, '| story Steel Longsword value', val('Steel Longsword'), 'sells', sell('Steel Longsword'), '| Healing Potion', val('Healing Potion'), '| smith stock', JSON.stringify(st.items.slice(0, 3).map(i => [i.def.name, i.price])));
  await host.send('Down.', host.reply('Rats.', ['! encounter 3 Cellar Rat | tier: trivial']));
  const offer = host.q('combat.offers').at(-1);
  const c0 = host.head().domains.inventory.wallets?.party?.coin ?? 0;
  await host.cmd('combat.start', { offer: offer.id }); await playOut(host);
  const end = host.receipts?.() ?? null;
  console.log('   loot coin', (host.head().domains.inventory.wallets?.party?.coin ?? 0) - c0);
  host.close();
}
