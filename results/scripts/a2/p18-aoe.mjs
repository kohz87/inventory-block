// a2 probe 18: area skills roll per target (b50a2fa): partial hits seen, missed targets take no damage.
import { rpgHost, playOut, seeded } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
let partial = 0, all = 0, none = 0, fights = 0, uses = 0;
for (const preset of ['caster', 'fighter', 'archer', 'skirmisher', 'healer']) for (let seed = 1; seed <= 8; seed++) await seeded(seed * 31, async () => {
  const host = await rpgHost();
  await host.cmd('party.create', { name: 'Wessel', preset });
  await host.send('Go.', host.reply('Rats.', ['~ place Bluewatch Village | kind: settlement', '! encounter 4 Cellar Rat | tier: weak']));
  const offer = host.q('combat.offers').at(-1);
  await host.cmd('combat.start', { offer: offer.id });
  await playOut(host); fights++;
  const s = host.q('combat.session');
  const log = (s?.log ?? []).map(e => (typeof e === 'string' ? e : e.text ?? '')).join('\n');
  partial += (log.match(/misses .* and hits/g) ?? []).length;
  none += (log.match(/misses everyone/g) ?? []).length;
  host.close();
});
console.log('fights', fights, 'area partial-hit lines', partial, 'miss-everyone lines', none);
