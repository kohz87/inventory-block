// a2 probe 10b: time to play out a 144-foe quest-sized fight (auto), per action cost growth.
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const host = await suiteHost({ pack: false, seed: 10 });
await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', '+ quest Rat Cull — clear rats | goal: kill 1000 Rat | reward: 40 gold | giver: Fenna']));
await host.send('Go.', host.reply('Foes.', ['! encounter Cellar Rat, Sewer Rat, Giant Rat, Plague Rat, Bog Rat, Dire Rat | tier: trivial']));
const offer = host.q('combat.offers').at(-1);
await host.cmd('combat.start', { offer: offer.id });
const times = [];
let n = 0;
for (; n < 400; n++) {
  const s = host.q('combat.session');
  if (!s || s.status !== 'active') break;
  const t = performance.now();
  const r = await host.cmd('combat.act', { action: { type: 'auto' } });
  times.push(performance.now() - t);
  if (!r.ok) { console.log('act', r.code, r.message); break; }
}
const s = host.q('combat.session');
console.log('actions', n, 'status', s?.status, 'first10 ms', Math.round(times.slice(0, 10).reduce((a, b) => a + b, 0)), 'last10 ms', Math.round(times.slice(-10).reduce((a, b) => a + b, 0)), 'total s', Math.round(times.reduce((a, b) => a + b, 0) / 1000));
host.close();
