import { allHost } from './lib/host.mjs';
console.warn = () => {};
const reply = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
const h = await allHost();
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('one', 'Nothing yet.');
await h.send('two', reply('Ren falls.', ['~ wound Ren — a fall | harm: scratch']));
const pc = h.head().domains.party.pc;
console.log('hp after A', h.head().domains.party.actors[pc].hp.cur, 'claims', Object.keys(h.head().meta.claims).filter(k => k.startsWith('wound')));
await h.st.deleteMessage(1); await h.st.deleteMessage(1);   // the first exchange
console.log('chat', h.ctx.chat.map(m => (m.is_user ? 'U' : 'C')).join(''), 'problems', h.store.problems().length);
await h.send('three', reply('Ren is hit again.', ['~ wound Ren — a blow | harm: wound']));
console.log('index of B', h.ctx.chat.length - 1, 'hp after B', h.head().domains.party.actors[pc].hp.cur, 'problems:', h.turn.problems().map(p => p.message));
