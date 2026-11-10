import { withHero } from '../qa/helpers/harness.js';
import { unpackSetup } from '../../../src/v2/combat/stored.js';
for (const [words, tier] of [['6 Bog Hound', 'weak'], ['6 Cellar Rat Swarm', 'weak'], ['6 Stone Troll', 'trivial'], ['5 Root Horror', 'weak'], ['6 Shield Bearer', 'weak'], ['6 Ogre', 'weak'], ['9 Wolf', 'weak']]) {
  const { h } = withHero({ seed: 9000 });
  h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier } });
  const o = h.query('combat.offers').at(-1); const st = h.command('combat.start', { offer: o.id });
  const setup = unpackSetup(h.state().domains.combat.session.setup);
  const all = [...setup.enemies, ...(setup.waves ?? []).flatMap(w => w.enemies)];
  const stun = all.filter(e => (e.skills ?? []).some(s => JSON.stringify(s.effect ?? '').includes('stun')));
  console.log(words, tier, 'fielded', all.length, 'heldBack', st.receipt?.data.heldBack ?? 0, 'stunners', stun.length, JSON.stringify(stun[0]?.skills?.find(s => JSON.stringify(s.effect).includes('stun'))?.effect));
}
