const { createHost } = await import('/home/user/_break/b2-timeline-r2/Story_block/testkit/index.js');
const { createStore } = await import('/home/user/_break/b2-timeline-r2/Story_block/src/v2/store.js');
const { readRecord } = await import('/home/user/_break/b2-timeline-r2/Story_block/src/v2/persist.js');
console.warn = () => {};
const N = Number(process.argv[2] ?? 300);
const h = await createHost();
h.st.saves.push = () => 0;   // keep memory flat
const R = n => `Reply ${n}.\n<Changes>\n+ item Thing${n % 9}\n+ present P${n % 5}\n~ place Place${n % 4} | kind: settlement\n</Changes>`;
for (let i = 0; i < N; i++) await h.send(`u${i}`, R(i));
const chat = h.ctx.chat;
const time = (label, fn, reps = 5) => { const t0 = performance.now(); for (let k = 0; k < reps; k++) fn(); const ms = (performance.now() - t0) / reps; console.log(label, ms.toFixed(1), 'ms'); return ms; };
const fresh = () => createStore({ chat: () => chat, save: async () => {} }).head();
const cps = () => chat.map((m, i) => readRecord(m)?.checkpoint ? i : -1).filter(i => i >= 0);
console.log('messages', chat.length, 'checkpoints', cps().length);
time('head from scratch, intact', fresh);
const sendMs = async label => { const t0 = performance.now(); for (let k = 0; k < 5; k++) await h.send('x', R(k)); console.log(label, ((performance.now() - t0) / 5).toFixed(1), 'ms per reply'); };
await sendMs('reply, intact');
await h.st.deleteMessage(3);   // one early reply deleted
time('head from scratch, after one early delete', fresh);
await sendMs('reply, after the early delete');
for (let i = 0; i < 40; i++) await h.send(`v${i}`, R(i));
time('head from scratch, 40 replies later', fresh);
await sendMs('reply, 40 replies after the delete');
console.log('checkpoints now', cps().length);
