// a2 probe 5: quest-sized fights: sure drops of a valuable pack material from 24 trivial foes.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { playOut } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
const quest = process.argv[2] ?? '+ quest Drake Scales — the tanner wants scales | goal: bring 72 River Drake Scale | reward: 10 copper | giver: Fenna';
const enc = process.argv[3] ?? '! encounter River Drake | tier: trivial';
const fights = Number(process.argv[4] ?? 1);
const host = process.env.NOPACK ? await (async () => { const { suiteHost } = await import('/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js'); const h = await suiteHost({ pack: false, seed: 5 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' }); await h.send('In.', h.reply('Town.', ['~ place Bluewatch Village | kind: settlement'])); return h; })() : await started({ seed: 5 });
await host.send('Job.', host.reply('Fenna asks.', [quest]));
const threads = host.q('director.threads', { kind: 'quest', status: 'active' });
console.log('active', JSON.stringify(threads.map(t => [t.id, t.title ?? t.name, t.status])));
for (const t of threads) console.log('progress', JSON.stringify(host.q('quest.progress', { id: t.id })));
for (let n = 0; n < fights; n++) {
  await host.send('Hunt.', host.reply('Drakes.', [enc]));
  const offer = host.q('combat.offers').at(-1);
  if (!offer) { console.log('no offer'); break; }
  console.log('offer', JSON.stringify(offer.foes.map(f => [f.name, f.count, f.tier, f.questItem ?? ''])), offer.sized ? JSON.stringify(offer.sized) : '');
  const r = await host.cmd('combat.start', { offer: offer.id });
  if (!r.ok) { console.log('start', r.code, r.message); break; }
  const status = await playOut(host);
  const end = await host.cmd('combat.end', {});
  console.log('fight', n, status, 'end', end.ok, end.receipt?.summary?.slice(0, 300) ?? end.message);
}
const scales = host.items().filter(i => /Scale|Core|Claw|Fang|Wyvern/.test(i.name));
console.log('items', JSON.stringify(scales.map(i => [i.name, i.def, i.qty, i.value])));
for (const t of threads) console.log('progress', JSON.stringify(host.q('quest.progress', { id: t.id })));
console.log('pc', JSON.stringify(host.q('party.pc')?.level), 'wallet', host.wallet());
host.close();
