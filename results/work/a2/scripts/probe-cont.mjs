// Continue joining halves of a cut reply.
import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const cases = [
  ['Story.\n\n<Chan', 'ges>\n+ coin 5\n+ item Rope\n</Changes>'],
  ['Story.\n\n<Changes>\n+ coin 5\n+ item Ro', 'pe | qty: 2\n</Changes>'],
  ['Story.\n\n<Changes>\n+ coin 5\n', '+ item Rope | qty: 2\n</Changes>'],
  ['Story.\n\n<', 'Changes>\n+ coin 5\n+ item Rope\n</Changes>'],
  ['Story.\n\n', '<Changes>\n+ coin 5\n+ item Rope\n</Changes>'],
];
for (const stopped of [false, true]) for (const [a, b] of cases) {
  const h = await suiteHost();
  await withParty(h);
  let t = []; const off = h.events.on('turn', x => { t.push(x); });
  await h.send('go', a, { stopped });
  await h.cont(b); off();
  const inv = h.head().domains.inventory;
  console.log(stopped ? 'stopped' : 'ended ', JSON.stringify(a.slice(-12)), '+', JSON.stringify(b.slice(0, 14)), '| coin', inv.wallets.party?.coin ?? 0, '| defs', Object.keys(inv.defs), '| mes', JSON.stringify(h.ctx.chat.at(-1).mes.slice(0, 70)), '| problems', t.flatMap(x => x.problems ?? []).map(p => p.code + ': ' + String(p.message).slice(0, 120)));
  h.close();
}
