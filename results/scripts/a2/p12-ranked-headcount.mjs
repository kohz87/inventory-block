// a2 probe 12: ranked foes skip the tier's headcount budget: XP and win rate vs the same foes by tier.
import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
import { playOut, seeded } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
const [line, seeds = '10'] = process.argv.slice(2);
let won = 0, xp = 0, levels = new Set(), tiers = '';
for (let seed = 1; seed <= Number(seeds); seed++) await seeded(seed * 101, async () => {
  const host = await market();
  await host.send('Go.', host.reply('Foes.', [line]));
  const offer = host.q('combat.offers').at(-1);
  tiers = JSON.stringify(offer.foes.map(f => [f.name, f.count, f.tier, f.rank ?? '', f.level ?? '']));
  await host.cmd('combat.start', { offer: offer.id });
  for (const e of sessionOf(host.head().domains.combat).setup.enemies) levels.add(e.level);
  const x0 = host.q('party.pc').xp;
  const st = await playOut(host); await host.cmd('combat.end', {});
  if (st === 'won') { won++; xp += host.q('party.pc').xp - x0; }
  host.close();
});
console.log(line, tiers, 'foe levels', [...levels].join(','), `won ${won}/${seeds}`, 'avg XP per win', won ? Math.round(xp / won) : 0);
