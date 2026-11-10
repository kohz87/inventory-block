import { started } from './helpers/suite.js';
const h = await started({ seed: 3 });
const names = Array.from({ length: 6 }, (_, i) => `Errand ${String.fromCharCode(65 + i)}`);
await h.send(`I take ${names.join(', ')}.`, h.reply('Fenna has errands.', names.map(name => `+ quest ${name} — a quick errand | giver: Fenna | goal: carry the parcel to the mill | difficulty: nightmare | reward: 99999 marks`)));
console.log(names.map(n => [n, !!h.q('director.thread', { key: n })?.taken, h.q('director.thread', { key: n })?.offer]));
for (const n of names) { const t = h.q('director.thread', { key: n }); if (t && !t.taken) { const r = await h.cmd('quest.take', { key: n }); console.log('take', n, r.ok, r.message ?? ''); } }
const w0 = h.wallet();
await h.send('Done, all of them.', h.reply('All delivered.', names.flatMap(name => [`~ quest ${name} | met: yes`, `- quest ${name} — done`])));
console.log('one reply, paid', h.wallet() - w0, 'pc level', h.q('party.pc').level);
h.close();
