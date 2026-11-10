import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(3);
const combos = {
  itemThenMore: [['+ item Rope'], ['+ item Rope | qty: 2']],
  itemThenUse: [['+ item Rope | qty: 3'], ['- item Rope']],
  placeRoute: [['+ landmark Alton | region: R | kind: town'], ['+ route Alton — Brigg | hours: 2 | kind: road']],
  placeWith: [['+ join Lyra — archer'], ['~ place Bluewatch | kind: settlement | with: Lyra']],
  leave: [['+ join Lyra — archer'], ['- leave Lyra — goes']],
};
for (const [name, [la, lb]] of Object.entries(combos)) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', host.reply('Hello.', ['~ time June 3, 1200, 08:00 am']));
  await host.send('a', host.reply('A.', la));
  const a = host.store.headIndex();
  if (name === 'leave' || name === 'placeWith') { const o = host.head().domains.party.offers[0]; if (o) await host.cmd('party.acceptOffer', { offer: o.id }); }
  await host.send('b', host.reply('B.', lb));
  await host.st.deleteMessage(a); await host.st.deleteMessage(a - 1);
  const state = host.head(); const bad = [];
  for (const d of Object.keys(state.domains)) { const v = host.registry.validator(d); const e = v ? v(state.domains[d], state) : []; if (e?.length) bad.push(`${d}: ${e[0]}`); }
  console.log(name.padEnd(14), 'invalid head:', bad.length ? bad.join(' | ').slice(0, 220) : 'none', '| skips', host.store.problems().length);
  host.close();
}
