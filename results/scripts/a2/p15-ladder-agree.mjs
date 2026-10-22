// a2 probe 15: do RPG Battle (party.ranks) and Story Director (quest.ranks) band the reader's ladder alike?
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const CALLER = { id: 'cx', name: 'cx', version: '0.0.0', commands: { 'cx.call': (ctx, { type, payload } = {}) => ctx.call(type, payload ?? {}) } };
const show = l => l.map(r => `${r.id}:${r.levels ? r.levels.join('-') : 'null'}`).join(' ');
for (const [label, rb] of [
  ['12 bare', { 'party.ranks': Array.from({ length: 12 }, (_, i) => ({ rank: `Circle ${i + 1}` })) }],
  ['9 per10', { 'party.ranks': Array.from({ length: 9 }, (_, i) => ({ rank: `Soul Class ${['I','II','III','IV','V','VI','VII','VIII','IX'][i]}` })), 'party.levelsPerRank': 10 }],
  ['5 bare', { 'party.ranks': ['Iron', 'Bronze', 'Silver', 'Gold', 'Mithril'].map(rank => ({ rank })) }],
]) {
  const host = await suiteHost({ pack: false, settings: { modules: { 'rpg-battle': rb } }, modules: [CALLER] });
  await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
  await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement']));
  console.log(label, '\n  RB', show(host.q('party.ranks')), '\n  SD', show(host.q('quest.ranks')));
  host.close();
}
