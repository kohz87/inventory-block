const { suiteHost } = await import('/home/user/cell/a1/rpg_battle/tests/v2/break/helpers/suite.js');
console.warn = () => {}; console.error = () => {};
const h = await suiteHost({ seed: 8 });
await h.send('Start.', h.reply('Morning.', ['+ xp major — before any character']));
console.log('no pc:', h.turn.problems().slice(-1).map(p => p.code + ' ' + p.message.slice(0, 90)));
await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
const xp = () => h.q('party.pc').xp;
for (const l of ['+ xp 50', '+ xp minor | amount: 999', '+ xp Milestone: saved the town', '+ xp', '- xp minor', '~ xp major', '+ xp minor minor', '+ xp majorly', '+ xp minor — x | xp: 500', '+ xp major​', '+ xp MAJOR']) {
  const b = xp();
  await h.send('Go.', h.reply('Things happen.', [l]));
  console.log(JSON.stringify(l).padEnd(36), 'xp +', xp() - b, h.turn.problems().filter(p => p.index === h.ctx.chat.length - 1).map(p => p.code + ' ' + p.message.slice(0, 70)).join(' | '));
}
h.close();
