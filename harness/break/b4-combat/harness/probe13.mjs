import { rpgHost, seeded, offerAndStart } from './helpers.js';
await seeded(91, async () => {
  const host = await rpgHost({ settings: { modules: { 'rpg-battle': { 'party.maxCompanions': 12 } } } });
  await host.cmd('party.create', { name: 'Ren', preset: 'fighter' });
  await host.send('x', host.reply('camp', ['~ place Camp']));
  const names = ['Ana','Bo','Cy','Di','Ed','Fa','Gu','Ha','Io','Ju','Ka','Lu'];
  for (const n of names) { const r = await host.cmd('party.addCompanion', { name: n, role: 'knight', control: 'player' }); if (!r.ok) console.log(n, r.message); }
  await host.cmd('party.addCompanion', { name: 'Extra', role: 'knight' }).then(r => console.log('13th companion', r.ok, r.message));
  const { start } = await offerAndStart(host, '! encounter 1 Stone Golem | tier: even');
  console.log('start', start.ok, start.message ?? '');
  let n = 0; const times = [];
  while (true) {
    const s = host.q('combat.session'); if (!s || s.status !== 'active') { console.log('end', s?.status, 'round', s?.round); break; }
    const t = performance.now();
    const r = await host.cmd('combat.act', { action: { type: 'defend' } });
    times.push(performance.now() - t); n++;
    if (!r.ok) { console.log('refused', r.message); break; }
    if (n % 100 === 0) console.log('actions', n, 'last act ms', times.at(-1).toFixed(1), 'round', s.round, 'state bytes', JSON.stringify(host.head()).length);
    if (n > 3000) break;
  }
  const t = performance.now(); host.q('combat.session'); console.log('session view ms', (performance.now() - t).toFixed(1), 'actions', n);
  const t2 = performance.now(); const e = await host.cmd('combat.end'); console.log('end ms', (performance.now() - t2).toFixed(1), e.ok, e.message ?? '', 'summary len', e.receipt?.summary.length);
  host.close();
});
