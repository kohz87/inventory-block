// RB wave C: hostile rank / join / spend inputs on the real host.
import { allHost } from './lib.mjs';
console.warn = () => {};
const h = await allHost({ extra: [] });
const turns = []; h.sdk.on('turn', t => turns.push(t));
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
const pc = () => h.head().domains.party.actors[h.head().domains.party.pc];
for (const rank of ['SS', 'S+', 'ZZZ', '__proto__', 'f', 'Ｓ', 'S'.repeat(9), '-1']) {
  await h.send('Foes.', `They come.\n<Changes>\n! encounter 2 Wolf — on the road | rank: ${rank}\n</Changes>`);
  const t = turns.at(-1);
  const enc = h.head().domains.combat ?? h.head().domains.battle;
  console.log('rank', JSON.stringify(rank), JSON.stringify(t.problems.map(p => p.code + ':' + (p.message ?? '').slice(0, 70))), JSON.stringify(t.receipts.map(r => r.type + ' ' + (r.summary ?? '').slice(0, 80))));
  // end any fight so the next line is read
  try { await h.sdk.command('combat.flee', {}); } catch {}
}
for (const lab of ['level: 999999999', 'level: -3', 'level: 1e3', 'role: __proto__', 'role: archer | level: 3', 'level: 2 | role: <img src=x onerror=alert(1)>']) {
  await h.send('Stranger.', `A stranger.\n<Changes>\n+ join Kit${turns.length} — a wanderer | ${lab}\n</Changes>`);
  const t = turns.at(-1);
  const offers = h.head().domains.party.offers ?? {};
  const last = Object.values(offers).at(-1);
  let acc = null;
  if (last) acc = await h.sdk.command('party.acceptOffer', { offer: last.id });
  const comp = Object.values(h.head().domains.party.actors).filter(a => a.kind === 'companion').at(-1);
  console.log('join', lab, JSON.stringify(t.problems.map(p => p.code)), 'offer', JSON.stringify(last)?.slice(0, 120), 'acc', acc?.ok, acc?.message ?? '', comp ? JSON.stringify({ level: comp.level, stats: comp.stats, name: comp.name, role: comp.role }) : '');
  if (comp) await h.sdk.command('party.removeCompanion', { actor: comp.id }).catch(() => {});
}
for (const points of [{ STR: -5 }, { STR: 1.5 }, { STR: 1e9 }, { __proto__: { STR: 1 } }, { STR: '1' }, JSON.parse('{"__proto__": {"STR": 1}}'), { STR: 0 }]) {
  const r = await h.sdk.command('party.spend', { points });
  console.log('spend', JSON.stringify(points), r.ok, r.code, (r.message ?? '').slice(0, 80), 'points', pc().points, 'STR', pc().stats.STR);
}
