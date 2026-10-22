import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
console.warn = () => {};
for (const line of ['! encounter 4 Wolf; then: Rat King (boss) | tier: strong', '! encounter 4 Wolf, Rat King (boss) | tier: strong']) {
  const host = await market();
  const r0 = await host.send('Go.', host.reply('Foes.', [line]));
  const offer = host.q('combat.offers').at(-1);
  const r = await host.cmd('combat.start', { offer: offer.id });
  console.log(line, JSON.stringify(offer.foes), '\n start summary:', r.receipt?.summary, '\n data:', JSON.stringify(r.receipt?.data).slice(0, 300));
  const s = host.head().domains.combat.session;
  console.log(' enemies', JSON.stringify(s.setup.enemies.map(e => e.name)), 'waves', JSON.stringify((s.setup.waves ?? []).map(w => (w.enemies ?? w).map?.(e => e.name) ?? w)));
  host.close();
}
