// a2 probe 1: rank ladder shape vs the per-reply story coin budget and quest reward caps.
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const CALLER = { id: 'cx', name: 'cx', version: '0.0.0', commands: { 'cx.call': (ctx, { type, payload } = {}) => ctx.call(type, payload ?? {}) } };
async function run(label, rb, xp = 0, pack = false) {
  const settings = { modules: { 'rpg-battle': rb } };
  const host = await suiteHost({ pack, settings, modules: [CALLER] });
  await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
  if (xp) { const r = await host.cmd('cx.call', { type: 'party.grantXp', payload: { amount: xp } }); if (!r.ok) console.log('xp', r.code, r.message); }
  await host.send('Hi.', host.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
  const pc = host.q('party.pc'); const b = host.q('inventory.storyBudget');
  const ranks = host.q('quest.ranks');
  const pr = host.q('party.ranks');
  await host.send('Pay.', host.reply('A chest.', ['+ coin 999999999']));
  console.log(label, 'lv', pc?.level, 'budget', b.budget, 'wallet after +coin 999999999:', host.wallet(), '| SD ranks', ranks.length, JSON.stringify(ranks.slice(-2).map(r => [r.id, r.levels, r.reward])), '| RB', pr.length);
  host.close();
}
await run('default        ', {}, 0);
await run('default lv10   ', {}, 6000);
const twelve = Array.from({ length: 12 }, (_, i) => ({ rank: `Circle ${i + 1}` }));
await run('12 ranks per1  ', { 'party.ranks': twelve, 'party.levelsPerRank': 1 }, 0);
await run('12 ranks per1 L10', { 'party.ranks': twelve, 'party.levelsPerRank': 1 }, 6000);
await run('12 ranks per0 L10', { 'party.ranks': twelve }, 6000);
await run('1 rank         ', { 'party.ranks': [{ rank: 'Only' }] }, 6000);
await run('dup names      ', { 'party.ranks': [{ rank: 'A' }, { rank: 'a' }, { rank: 'B' }], 'party.levelsPerRank': 1 }, 6000);
await run('per 999        ', { 'party.ranks': twelve, 'party.levelsPerRank': 999 }, 6000);
await run('pack 12 per1 L10', { 'party.ranks': twelve, 'party.levelsPerRank': 1 }, 6000, true);
