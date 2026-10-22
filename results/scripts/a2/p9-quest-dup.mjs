// a2 probe 9: quests straight to active: duplicate + quest, re-open after finish, reward paid how often.
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { playOut } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
console.warn = () => {};
const host = await suiteHost({ pack: false, seed: 9 });
await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
const Q = '+ quest Rat Bounty — rats in the cellar | goal: kill 1 Cellar Rat | reward: 50 gold | giver: Fenna';
await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', Q, Q]));
const list = () => host.q('director.threads', { kind: 'quest' }).map(t => `${t.id}:${t.key ?? t.name}:${t.status}`);
console.log('after dup in one reply', list());
await host.send('Again.', host.reply('Fenna repeats.', [Q, '+ quest Rat Bounty 2 — more rats | goal: kill 1 Cellar Rat | reward: 50 gold | giver: Fenna']));
console.log('after dup next reply', list());
await host.send('Down.', host.reply('A rat.', ['! encounter Cellar Rat | tier: trivial']));
const offer = host.q('combat.offers').at(-1);
await host.cmd('combat.start', { offer: offer.id }); await playOut(host); await host.cmd('combat.end', {});
for (const t of host.q('director.threads', { kind: 'quest', status: 'active' })) {
  const w = host.wallet(); const r = await host.cmd('quest.finish', { id: t.id });
  console.log('finish', t.id, r.ok ? 'ok' : r.code + ' ' + r.message, 'paid', host.wallet() - w);
}
await host.send('Back.', host.reply('Fenna again.', [Q]));
console.log('re-open', list());
for (const t of host.q('director.threads', { kind: 'quest', status: 'active' })) console.log('progress', t.id, JSON.stringify(host.q('quest.progress', { id: t.id })?.label));
await host.send('More.', host.reply('Next day.', []));
for (const t of host.q('director.threads', { kind: 'quest', status: 'active' })) {
  const w = host.wallet(); const r = await host.cmd('quest.finish', { id: t.id });
  console.log('finish re-opened', t.id, r.ok ? 'ok' : r.code + ' ' + r.message, 'paid', host.wallet() - w);
}
host.close();
