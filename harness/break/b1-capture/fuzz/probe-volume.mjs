import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
const restore = seedCrypto(7);
const N = Number(process.argv[2] ?? 1000);
const kinds = {
  rest: i => '! rest short — again',
  coin: i => '+ coin 1000',
  itemSame: i => '+ item Rope',
  itemUnique: i => `+ item Rope ${i}`,
  hookUnique: i => `+ hook Hook ${i} — a thread`,
  hookBig: i => `+ hook H${i} ${'x'.repeat(2000)} — a thread`,
  place: i => `~ place Town ${i} | kind: settlement`,
  present: i => `+ present Person ${i}`,
  bad: i => `garbage line ${i}`,
  unknown: i => `! use Potion ${i}`,
  check: i => `? check stealth — sneak ${i} | dc: normal`,
  time: i => '! time +1h',
  world: i => `+ world W${i} — war | state: ongoing`,
  event: i => `+ event E${i} — fair | then: x`,
  faction: i => `+ faction F${i} — guild`,
  landmark: i => `+ landmark L${i} | region: R | kind: town`,
  route: i => `+ route A${i} — B${i} | hours: 2 | kind: road`,
  join: i => `+ join Joiner${i} — a stranger | level: 2 | role: ranger`,
  skill: i => `+ skill Ren — Skill${i}: a cut | taught by: Kael`,
  encounter: i => `! encounter 2 Wolf${i} — circling | tier: weak`,
  quest: i => `+ quest Q${i} — a job | giver: G | goal: Kill 3 rats | reward: 5 gold`,
  beat: i => `+ beat B${i} — a turn`,
  clock: i => `+ clock C${i} — doom | due: +2h`,
  agenda: i => `+ agenda A${i} — plots | now: x`,
  secret: i => `+ secret S${i} — hidden`,
  woundHeal: i => i % 2 ? '~ wound Ren — cut | harm: scratch' : '~ wound Ren — salve | heal: scratch',
  leave: i => '- leave Ren — goes',
};
const which = process.argv[3] ? process.argv[3].split(',') : Object.keys(kinds);
for (const k of which) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', 'Hello.');
  const lines = Array.from({ length: N }, (_, i) => kinds[k](i));
  const before = JSON.stringify(host.ctx.chat).length;
  const h0 = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  await host.send('go', host.reply('Story.', lines));
  const ms = performance.now() - t0;
  const p0 = performance.now();
  await host.send('next', 'Quiet.');
  const nextMs = performance.now() - p0;
  const tail = host.tails().at(-1) ?? '';
  const happened = tail.split('\n').filter(l => l && !l.startsWith('[')).length;
  const probs = host.turn.problems();
  const codes = {}; for (const p of probs) codes[p.code] = (codes[p.code] ?? 0) + 1;
  const after = JSON.stringify(host.ctx.chat).length;
  console.log(`${k.padEnd(11)} N=${N} capture=${ms.toFixed(0)}ms next=${nextMs.toFixed(0)}ms chat+${((after-before)/1e6).toFixed(2)}MB tailTok=${Math.ceil(tail.length/4)} tailLines=${tail.split('\n').length} problems=${probs.length} ${JSON.stringify(codes)} coin=${host.q('inventory.wallet',{owner:'party'}).coin ?? 0}`);
  host.close();
}
restore();
