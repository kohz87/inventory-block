const root = process.env.BREAK_ROOT;
const { createHost } = await import(`${root}/Story_block/testkit/index.js`);
console.warn = () => {};
const host = await createHost();
const reply = (t, l) => `${t}\n\n<Changes>\n${l.join('\n')}\n</Changes>`;
const items = () => host.sdk.query('inventory.items').map(i => `${i.name}x${i.qty}`).join(',');
const coin = () => host.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
await host.send('Hello.', 'The road.');
await host.send('a', reply('A.', ['+ coin 10']));
const a = host.store.headIndex();
await host.send('b', reply('B.', ['+ item Rope', '+ coin 20']));
await host.send('c', reply('C.', ['+ item Torch | qty: 2']));
await host.send('d', 'D, nothing.');
await host.send('e', reply('E.', ['+ coin 5', '+ item Lamp']));
console.log('before delete: coin', coin(), 'items', items());
const live = JSON.stringify(host.head().domains.inventory);
await host.st.deleteMessage(a);       // the reply that first touched coin
await host.st.deleteMessage(a - 1);   // and its user message
console.log('after deleting A: coin', coin(), 'items', items(), '(expected coin 25, Rope, Torch x2, Lamp)');
console.log('problems', host.store.problems().map(p => `msg ${p.index}: ${p.why ?? p.message}`.slice(0, 140)));
