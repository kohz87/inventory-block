const { suiteHost } = await import('/home/user/cell/a1/rpg_battle/tests/v2/break/helpers/suite.js');
console.warn = () => {}; console.error = () => {};
const h = await suiteHost({ seed: 6 });
await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
const R = (t, l) => h.reply(t, l);
await h.send('Start.', R('Morning.', ['~ place Bluewatch Village | kind: settlement']));
for (const rw of ['3 silver', '2 gold', '40 copper', '5 silver coins', '1 gold 5 silver']) {
  const name = `Job ${rw.replace(/\W+/g, '')}`;
  await h.send('Job?', R('Minke has work.', [`+ quest ${name} — fetch salt | giver: Minke | goal: bring salt | reward: ${rw}`]));
  const th = Object.values(h.head().domains.director.threads).find(t => (t.name ?? t.title ?? '').includes(name) || JSON.stringify(t).includes(name));
  const b = h.wallet();
  await h.send('Done.', R('Minke pays.', [`~ quest ${name} | done`]));
  console.log(rw.padEnd(16), 'reward stored', JSON.stringify(th?.reward ?? th?.rewards ?? null)?.slice(0, 80), 'paid', h.wallet() - b, h.turn.problems().slice(-1).map(p => p.message.slice(0, 90)).join(''));
}
h.close();
