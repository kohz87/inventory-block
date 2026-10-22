// a2 probe 3: boss rows through encounter → offer → setup (RB alone, rpgHost).
import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
console.warn = () => {};
const lines = process.argv.slice(2).length ? process.argv.slice(2) : [
  '! encounter Rat King (boss) | tier: trivial',
  '! encounter 4 Wolf, Rat King (boss) | tier: strong',
  '! encounter 4 Wolf, Rat King (boss) | tier: deadly',
  '! encounter 9 Cellar Rat, Rat King (boss) | tier: weak',
  '! encounter 3 Wolf (strong), Wolf Matriarch (boss) | tier: even',
  '! encounter Rat King (boss) | rank: F',
  '! encounter 3 Bandit (deadly), 3 Bandit Archer (deadly), Bandit Captain (boss)',
];
for (const line of lines) {
  const host = await market();
  await host.send('Go.', host.reply('Foes.', [line]));
  const offer = host.q('combat.offers').at(-1);
  if (!offer) { console.log(line, '→ no offer', JSON.stringify(host.turn?.problems?.() ?? '')); host.close(); continue; }
  const r = await host.cmd('combat.start', { offer: offer.id });
  const s = host.head().domains.combat.session;
  const en = s?.setup?.enemies ?? [];
  console.log(line, '\n  offer:', JSON.stringify(offer.foes), '\n  start:', r.ok ? 'ok' : r.message, '\n  enemies:', JSON.stringify(en.map(e => [e.name, e.boss ? 'BOSS' : '', e.level, e.threat, e.hp?.max])), 'waves', JSON.stringify(s?.setup?.waves ?? []).slice(0, 200));
  host.close();
}
