// a2 probe 17: a quest finished by a click after a reply, then that reply swiped (and swiped back).
import { suiteHost, rebuilt } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { isDeepStrictEqual } from 'node:util';
console.warn = () => {};
const host = await suiteHost({ pack: false, seed: 17 });
await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', '+ coin 10']));
const A = host.reply('Fenna hands you tails and a job.', ['+ quest Tails — rat tails | goal: bring 3 Rat Tail | reward: 40 gold | giver: Fenna', '+ item Rat Tail | qty: 3']);
await host.send('Job.', A);
const w0 = host.wallet();
const [q] = host.q('director.threads', { kind: 'quest', status: 'active' });
const f1 = await host.cmd('quest.finish', { id: q.id });
const state = () => `wallet ${host.wallet()} tails ${host.items().find(i => i.name === 'Rat Tail')?.qty ?? 0} quests ${JSON.stringify(host.q('director.threads', { kind: 'quest' }).map(t => t.status))}`;
console.log('finish 1', f1.ok, f1.code ?? '', '|', state());
await host.swipe(A);
console.log('after swipe (same text)', state());
const [q2] = host.q('director.threads', { kind: 'quest', status: 'active' });
if (q2) { const f2 = await host.cmd('quest.finish', { id: q2.id }); console.log('finish 2', f2.ok, f2.code ?? '', f2.message ?? '', '|', state()); }
const idx = host.ctx.chat.length - 1;
await host.st.swipeTo(idx, 0);
console.log('swipe back to 0', state());
const cold = await rebuilt(host);
console.log('rebuild same:', isDeepStrictEqual(cold.domains.inventory, host.head().domains.inventory), isDeepStrictEqual(cold.domains.director, host.head().domains.director));
await host.st.swipeTo(idx, 1);
console.log('swipe to 1', state());
host.close();
