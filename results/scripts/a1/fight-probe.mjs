const { suiteHost } = await import('/home/user/cell/a1/rpg_battle/tests/v2/break/helpers/suite.js');
console.warn = () => {}; console.error = () => {};
const h = await suiteHost({ seed: 4 });
await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await h.send('Go.', h.reply('Rats.', ['~ place Bluewatch Village | kind: settlement', '! encounter 2 Cellar Rat Swarm — pack | tier: weak']));
const offer = h.q('combat.offers').at(-1);
console.log('start', (await h.cmd('combat.start', { offer: offer.id })).ok, JSON.stringify(h.q('combat.session'))?.slice(0, 150));
for (let i = 0; i < 3; i++) { const r = await h.cmd('combat.act', { action: { type: 'auto' } }); console.log('act', r.ok, r.message?.slice(0, 80)); }
const s = h.q('combat.session'); const r2 = await h.cmd('combat.act', { action: { type: 'auto' }, session: s?.id });
console.log('act with session', r2.ok, r2.message?.slice(0, 80));
h.close();
