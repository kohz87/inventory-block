import { suiteHost } from '../fuzz/helpers/suite-final.js';
const h = await suiteHost({ seed: 9 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await h.send('hi', h.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
const pc = () => { const p = Object.values(h.head().domains.party.actors)[0]; return `lvl ${p.level} xp ${p.xp} pts ${p.points} hp ${JSON.stringify(p.hp)}`; };
await h.send('a', h.reply('A.', ['+ xp milestone — first', '+ xp minor — a', '+ xp minor — b'])); console.log('after A', pc());
const aIndex = h.ctx.chat.length - 1;
await h.send('b', h.reply('B.', ['+ xp milestone — second'])); console.log('after B', pc());
await h.send('c', h.reply('C.', ['+ xp major — third'])); console.log('after C', pc());
await h.st.deleteMessage(aIndex); console.log('A deleted', pc());
{ const v = h.q('party.pc'); console.log('party.pc query', JSON.stringify({ level: v?.level, xp: v?.xp, next: v?.next ?? v?.xpNext, points: v?.points, hp: v?.hp })); }
await h.send('d', h.reply('D.', ['+ xp minor — fourth'])); console.log('after D (+minor)', pc());
const probs = (h.store.problems?.() ?? []).map(p => `${p.index}: ${p.why}`); console.log('problems', probs);
const fresh = await suiteHost({ seed: 1 }); await fresh.st.loadChat(structuredClone(h.ctx.chat), 'r'); const p2 = Object.values(fresh.head().domains.party.actors)[0]; console.log('rebuilt', `lvl ${p2.level} xp ${p2.xp}`); fresh.close();
// What B and C alone give from a fresh character:
const g = await suiteHost({ seed: 9 }); await g.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await g.send('hi', g.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
await g.send('b', g.reply('B.', ['+ xp milestone — second'])); await g.send('c', g.reply('C.', ['+ xp major — third']));
const p3 = Object.values(g.head().domains.party.actors)[0]; console.log('B and C alone', `lvl ${p3.level} xp ${p3.xp} pts ${p3.points}`);
for (const i of [aIndex + 2, aIndex + 4]) console.log('ops', i, JSON.stringify((h.ctx.chat[i - 2]?.extra?.storySuite?.ops ?? []).filter(o => /party/.test(o.path)).slice(0, 12)));
g.close(); h.close();
