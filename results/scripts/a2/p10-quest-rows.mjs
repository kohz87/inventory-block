// a2 probe 10: quest sizing applied per row: several rows the same quest counts each get sized.
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
const [quest, enc] = process.argv.slice(2);
const host = await suiteHost({ pack: false, seed: 10 });
await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', quest]));
const [q] = host.q('director.threads', { kind: 'quest', status: 'active' });
console.log('quest', JSON.stringify(host.q('quest.progress', { id: q.id })?.label));
const t0 = performance.now();
await host.send('Go.', host.reply('Foes.', [enc]));
const offer = host.q('combat.offers').at(-1);
const total = offer.foes.reduce((s, f) => s + f.count, 0);
console.log('offer rows', offer.foes.length, 'foes', total, JSON.stringify(offer.foes.map(f => [f.name, f.count])));
const r = await host.cmd('combat.start', { offer: offer.id });
const s = sessionOf(host.head().domains.combat)?.setup;
console.log('start', r.ok, r.message ?? '', 'fielded', s ? s.enemies.length + (s.waves ?? []).reduce((n, w) => n + w.enemies.length, 0) : '-', 'ms', Math.round(performance.now() - t0));
host.close();
