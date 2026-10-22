const { suiteHost } = await import('/home/user/cell/a1/rpg_battle/tests/v2/break/helpers/suite.js');
console.warn = () => {}; console.error = () => {};
const h = await suiteHost({ seed: 5 });
await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
const t = () => h.q('director.time')?.minutes;
await h.send('Start.', h.reply('Morning.', ['~ place Bluewatch Village | kind: settlement']));
console.log('now', h.q('director.time'));
for (const l of ['~ time CY 612, Goldwane 1, 08:00 am', '~ time Goldwane 1, CY 612, 08:00 am', '~ time Goldwane 13, 08:00 am', '~ time next morning', '~ time 08:00 am', '~ time Goldwane 40, 08:00 am']) {
  const b = t();
  await h.send('Go.', h.reply('Later.', [l]));
  console.log(l.padEnd(40), 'moved', ((t() - b) / 1440).toFixed(2), 'days', h.turn.problems().filter(p => p.index === h.ctx.chat.length - 1).map(p => p.message.slice(0, 100)).join(' | '));
}
h.close();
