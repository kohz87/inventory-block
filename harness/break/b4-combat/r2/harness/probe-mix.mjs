import { fight } from '../../../scripts/balance-sim.mjs';
import { withHero } from '../qa/helpers/harness.js';
const N = Number(process.env.N ?? 100);
const cases = [
  ['1 Ogre', 'deadly'], ['1 Ogre, 3 Giant Rat', 'deadly'], ['1 Ogre, 8 Giant Rat', 'deadly'],
  ['deadly Ogre, 5 trivial Giant Rat', 'even'], ['deadly Ogre', 'even'],
  ['1 Ancient Dragon (boss)', 'deadly'], ['1 Ancient Dragon (boss), 8 Wolf', 'deadly'],
  ['3 Cellar Rat Swarm, 3 Giant Rat', 'weak'], ['9 Cellar Rat Swarm', 'weak'],
];
for (const [words, tier] of cases) {
  const row = { words, tier };
  for (const preset of ['fighter', 'caster', 'skirmisher']) { let w = 0; for (let s = 8000; s < 8000 + N; s++) if (fight(words, tier, preset, s) === 'won') w++; row[preset] = +(w / N * 100).toFixed(1); }
  const { h } = withHero({ seed: 8000 }); h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier } }); const o = h.query('combat.offers').at(-1); const st = h.command('combat.start', { offer: o.id });
  row.foes = h.query('combat.session').combatants.filter(c => c.side === 'enemy').map(c => `${c.name} L${c.level} HP${c.hp.max}`).join('; '); row.heldBack = st.receipt.data.heldBack ?? 0;
  console.log(JSON.stringify(row));
}
