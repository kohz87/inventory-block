import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const coin = h => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
for (const short of [false, true]) {
  const h = await suiteHost(); await withParty(h);
  await h.send('go', h.reply('Town.', ['~ place Bluewatch | kind: settlement', '+ item Healing Draught | qty: 3', '+ item Superior Healing Potion']));
  if (short) await h.send('go', h.reply('Shortage.', ['! market Bluewatch — no potions | until: +5d']));
  const out = [];
  for (const s of Object.values(h.head().domains.inventory.stacks)) { const c = coin(h); const q = h.q('trade.quote', { sell: { stack: s.id, qty: 1 } }); const r = await h.cmd('trade.sell', { stack: s.id, qty: 1 }); out.push(`${s.def}: ${coin(h) - c} ${r.ok}`); }
  // combo: one reply with every value-ish kind, then the next reply too
  const combo = ['+ coin 50', '+ item Rope | qty: 20', '+ item Dragon Crown', '! rest long — inn', '~ wound Ren — healed | heal: grievous', '! use Healing Draught | on: Ren', '? check stealth — sneak | dc: easy', '! encounter 1 Cellar Rat — squeak | tier: trivial', '+ join Lyra — archer | level: 99', '~ npc Fenna | trust: +15', '+ skill Ren — Fireball: 9999 damage | taught by: Fenna'];
  const c0 = coin(h); await h.send('go', h.reply('Everything.', combo));
  const d = h.head().domains;
  out.push(`combo coin +${coin(h) - c0}; offers ${JSON.stringify(Object.values(d.party.offers).map(o => [o.kind, o.level]))}; defs ${Object.values(d.inventory.defs).map(x => x.name + ':' + x.value).join(',')}`);
  console.log(short ? 'shortage' : 'normal  ', out.join(' | '));
  h.close();
}
