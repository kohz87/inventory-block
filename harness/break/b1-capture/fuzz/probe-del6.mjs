import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(3);
const combos = {
  useAfter: [['+ item Rope | qty: 3'], ['- item Rope']],
  gainAfter: [['+ item Rope | qty: 3'], ['+ item Rope | qty: 2']],
  noteAfter: [['+ item Rope | qty: 3'], ['~ item Rope | note: frayed']],
  setQty: [['+ item Rope | qty: 3'], ['~ item Rope | qty: 5']],
  preexisting: [['- item Torch'], ['+ item Torch']],
};
for (const [name, [la, lb]] of Object.entries(combos)) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', host.reply('Hello.', ['+ item Torch | qty: 2']));
  await host.send('a', host.reply('A.', la));
  const a = host.store.headIndex();
  await host.send('b', host.reply('B.', lb));
  await host.st.deleteMessage(a); await host.st.deleteMessage(a - 1);
  console.log(name.padEnd(12), JSON.stringify(host.q('inventory.items').map(i => `${i.name}x${i.qty}`)), host.store.problems().map(p => (p.why ?? p.message).slice(0, 150)));
  host.close();
}
