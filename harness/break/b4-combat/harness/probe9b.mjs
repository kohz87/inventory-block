import { rpgHost, seeded, playOut, storyDirector } from './helpers.js';
await seeded(62, async () => {
  const host = await rpgHost({ modules: [await storyDirector()] });
  await host.cmd('party.create', { name: 'Ren', preset: 'fighter' }); await host.cmd('party.grantXp', { amount: 300 }); { const pc = host.q('party.pc'); const n = Math.floor(pc.points/4); const sp = await host.cmd('party.spend', { points: { STR: n, VIT: n, DEX: n, AGI: pc.points - 3*n } }); console.log('spend', sp.ok, sp.message ?? sp.receipt.summary, JSON.stringify(host.q('party.pc').stats)); }
  await host.send('work?', host.reply('Fenna: a wolf.', ['~ place Bluewatch | kind: settlement', '+ present Fenna', '+ quest Lone Wolf — one wolf took a lamb | giver: Fenna | goal: Kill 1 wolf | reward: 50 gold each | difficulty: easy']));
  const t = await host.cmd('quest.take', { key: 'Lone Wolf' }); console.log('take', t.ok, t.message ?? t.receipt.summary);
  for (let i = 0; i < 4; i++) {
  await host.send('go', host.reply('Wolves!', ['! encounter 3 Wolf | tier: trivial']));
  const offer = host.q('combat.offers').at(-1);
  await host.cmd('combat.start', { offer: offer.id }); const st = await playOut(host, { most: 1000 }); const e = await host.cmd('combat.end');
  console.log(st, JSON.stringify(e.receipt.data.foes)); await host.cmd('party.rest', { kind: 'long' }); }
  console.log(JSON.stringify(host.q('quest.progress', { key: 'Lone Wolf' })));
  const before = host.q('inventory.wallet', { owner: 'party' });
  const f = await host.cmd('quest.finish', { key: 'Lone Wolf' }); console.log('finish', f.ok, f.message ?? f.receipt.summary, 'wallet', JSON.stringify(before), '->', JSON.stringify(host.q('inventory.wallet', { owner: 'party' })));
  host.close();
});
