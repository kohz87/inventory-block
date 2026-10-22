import { started, rebuilt } from './helpers/suite.js';
// Each scenario: steps A (setup), B (to delete), C (later). Compare (A,B,C then delete B) to (A,C).
const sum = h => { const inv = h.head().domains.inventory; const by = {}; for (const s of Object.values(inv.stacks)) { const n = inv.defs[s.def].name; by[n] = (by[n] ?? 0) + s.qty; } return { coin: Object.values(inv.wallets).reduce((a, w) => a + (w.coin ?? 0), 0), ...by }; };
const it = (h, name, owner) => h.items().find(i => i.name === name && (!owner || i.owner === owner));
const S = {
  'take then add': { A: [['story', ['+ item Torch | qty: 5']]], B: [['story', ['- item Torch | qty: 2']]], C: [['story', ['+ item Torch | qty: 3']]] },
  'empty then new stack': { A: [['story', ['+ item Torch | qty: 5']]], B: [['story', ['- item Torch | qty: 5']]], C: [['story', ['+ item Torch | qty: 1']]] },
  'add then sell exactly the rest': { A: [['story', ['+ item Torch | qty: 2']]], B: [['story', ['+ item Torch | qty: 3']]], C: [['story', ['- item Torch | qty: 2', '- coin 20 | to: the ferryman']]] },
  'add then take all': { A: [['story', ['+ item Torch | qty: 2']]], B: [['story', ['+ item Torch | qty: 3']]], C: [['story', ['- item Torch | qty: 2']]] },
  'wallet to zero then receive': { A: [], B: [['story', ['- coin 44']]], C: [['story', ['+ coin 10']]] },
  'sell partial then split': { A: [['story', ['+ item Torch | qty: 6']]], B: [['ui', h => h.cmd('trade.sell', { stack: it(h, 'Torch').stack, qty: 2 })]], C: [['ui', h => h.cmd('inventory.split', { stack: it(h, 'Torch').stack, qty: 1 })], ['story', ['+ coin 1']]] },
  'give to companion then leave': { A: [['story', ['+ item Torch | qty: 4']], ['story', ['+ join Lyra — an archer | role: archer']], ['ui', h => h.cmd('party.acceptOffer', { offer: h.head().domains.party.offers.at(-1).id })]], B: [['ui', h => h.cmd('item.give', { stack: it(h, 'Torch', 'party').stack, to: h.q('party.actors').find(a => a.name === 'Lyra').id, qty: 2 })]], C: [['ui', h => h.cmd('party.removeCompanion', { actor: h.q('party.actors').find(a => a.name === 'Lyra').id })], ['story', ['+ coin 1']]] },
  'buy then sell': { A: [['story', ['+ coin 300']]], B: [['ui', async h => { const s = h.q('trade.stock', { kind: 'general' }); const e = s.items.find(x => x.def.kind !== 'equipment'); return h.cmd('trade.buy', { shop: s.shop, def: e.def.id, qty: 2 }); }]], C: [['ui', async h => { const x = h.items().find(i => i.def.startsWith('trade/') || i.from); return null; }], ['story', ['+ coin 1']]] },
  'commission then collect': { A: [['story', ['+ item Rat Tail | qty: 3', '+ coin 300']]], B: [['ui', h => h.cmd('craft.commission', { piece: 'Tail Charm', materials: [{ stack: it(h, 'Rat Tail').stack, qty: 3 }], crafter: 'the smith' })]], C: [['story', ['! time +240h']], ['ui', async h => { for (const o of h.q('trade.orders') ?? []) await h.cmd('craft.collect', { order: o.id }); }], ['story', ['+ coin 1']]] },
};
async function play(steps, h) { for (const [kind, x] of steps) { if (kind === 'story') await h.send('go', h.reply('So it goes.', x)); else { const r = await x(h); if (r && r.ok === false) console.log('   ui refused', r.code, r.message); } } }
for (const [name, sc] of Object.entries(S)) {
  const a = await started({ seed: 9 });
  await play(sc.A, a); const mark = a.ctx.chat.length; await a.send('B begins', 'B reply.'); await play(sc.B, a); const end = a.ctx.chat.length;
  await play(sc.C, a);
  // delete B's messages (user+reply pairs) from the end of the B span backward
  for (let i = end - 1; i >= mark; i--) await a.st.deleteMessage(i);
  const got = sum(a); const cold = await rebuilt(a);
  const b = await started({ seed: 9 }); await play(sc.A, b); await play(sc.C, b); const want = sum(b);
  const same = JSON.stringify(got) === JSON.stringify(want);
  console.log(same ? 'OK  ' : 'DIFF', name, same ? '' : JSON.stringify({ got, want }), JSON.stringify(cold) === JSON.stringify(a.head()) ? '' : 'REBUILD-DIFFERS');
  a.close(); b.close();
}
