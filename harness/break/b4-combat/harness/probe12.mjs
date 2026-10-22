import { withHero, fightOut } from '../qa/helpers/harness.js';
const losses = {};
for (const words of ['6 Giant Rat', '3 Wolf', 'Giant Rat Swarm']) {
  losses[words] = [];
  for (let seed = 1; seed <= 400; seed++) {
    const { h } = withHero({ seed });
    h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier: 'weak' } });
    const offer = h.query('combat.offers').at(-1);
    h.command('combat.start', { offer: offer.id });
    if (h.query('combat.session').status === 'active') h.command('combat.act', { action: { type: 'auto' } });
    fightOut(h);
    const st = h.state().domains.combat.session.status;
    if (st !== 'won') losses[words].push(seed + ':' + st);
  }
}
console.log(JSON.stringify(losses));
