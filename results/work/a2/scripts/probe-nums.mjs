import { suiteHost, withParty } from './suite-host.mjs';
import { ODD_NUMS } from './gen2.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
const out = { coin: {}, qty: {}, npc: {}, time: {} };
for (const n of ODD_NUMS) {
  const c0 = h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
  const q0 = h.q('inventory.items').filter(i => i.name === 'Rope').reduce((s, i) => s + i.qty, 0);
  const m0 = h.head().domains.npc.npcs.fenna?.meters?.trust ?? 0;
  const t0 = h.head().domains.director.time.minutes;
  await h.send('go', h.reply('x', [`+ coin ${n}`, `+ item Rope | qty: ${n}`, `~ npc Fenna | trust: +${n}`, `! time +${n}m`]));
  const c1 = h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
  const q1 = h.q('inventory.items').filter(i => i.name === 'Rope').reduce((s, i) => s + i.qty, 0);
  const m1 = h.head().domains.npc.npcs.fenna?.meters?.trust ?? 0;
  const t1 = h.head().domains.director.time.minutes;
  const row = [c1 - c0, q1 - q0, m1 - m0, t0 === null || t1 === null ? `${t0}->${t1}` : t1 - t0];
  if (row.some(v => v !== 0 && v !== 'null->null')) console.log(JSON.stringify(n).padEnd(28), 'coin', row[0], 'qty', row[1], 'trust', row[2], 'min', row[3]);
}
h.close();
