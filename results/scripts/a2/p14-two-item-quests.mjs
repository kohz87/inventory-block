// a2 probe 14: two item quests for the same thing: one delivery, two rewards?
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const host = await suiteHost({ pack: false, seed: 14 });
await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement',
  '+ quest Tails for Fenna — rat tails | goal: bring 3 Rat Tail | reward: 40 gold | giver: Fenna',
  '+ quest Tails for Oswin — rat tails | goal: bring 3 Rat Tail | reward: 40 gold | giver: Oswin']));
await host.send('Tails.', host.reply('You find tails.', ['+ item Rat Tail | qty: 3']));
await host.send('Back.', host.reply('Back in town.', []));
for (const t of host.q('director.threads', { kind: 'quest', status: 'active' })) {
  const w = host.wallet(); const r = await host.cmd('quest.finish', { id: t.id });
  console.log('finish', t.key ?? t.id, r.ok ? 'ok' : r.code + ' ' + r.message, 'paid', host.wallet() - w, 'tails left', host.items().find(i => i.name === 'Rat Tail')?.qty ?? 0);
  await host.send('Next.', host.reply('Later.', []));
}
host.close();
