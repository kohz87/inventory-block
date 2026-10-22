const { suiteHost } = await import('/home/user/cell/a1/rpg_battle/tests/v2/break/helpers/suite.js');
console.warn = () => {}; console.error = () => {};
const J = v => JSON.stringify(v);
const h = await suiteHost({ seed: 3 });
await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
const pc = () => h.q('party.pc');
const st = () => { const p = h.head().domains.party; const a = pc(); return `hp ${a.hp?.cur ?? a.hp}/${a.hp?.max ?? ''} mp ${a.mp?.cur ?? a.mp} rested ${p.rested} time ${h.q('director.time')?.minutes}`; };
const R = (t, l) => h.reply(t, l);
await h.send('Start.', R('Morning.', ['~ place Bluewatch Village | kind: settlement']));
console.log('0', st());
await h.send('Fall.', R('Wessel falls.', ['~ wound Wessel — fell | harm: severe']));
console.log('1 wound', st());
await h.send('Walk.', R('They walk.', ['! time +3h']));
console.log('2 time+3h', st());
await h.send('Again.', R('Another stumble.', ['~ wound Wessel — slipped | harm: light']));
console.log('3 after recover cue + wound', st());
const where = h.ctx.chat.map((m, i) => [i, (m.extra?.storySuite?.receipts ?? []).map(r => r.type).filter(t => /recover|wound|time/.test(t)).join(',')]).filter(x => x[1]);
console.log('receipts:', J(where));
const live = J(h.head());
for (const i of [h.ctx.chat.length - 1, h.ctx.chat.length - 3]) {
  const r = await h.sdk.reread(i);
  console.log('reread', i, r.ok, st(), J(h.head()) === live ? 'SAME' : 'DIFF');
}
// set back then forward
await h.send('Back.', R('Earlier that day...', ['~ time Goldwane 1, 06:00 am']));
console.log('4 set back', st());
await h.send('Forward.', R('Hours pass.', ['! time +2h']));
await h.send('Next.', R('Quiet.', []));
console.log('5 forward', st());
h.close();
