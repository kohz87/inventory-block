import { started } from './helpers/suite.js';
const show = (label, r) => console.log(label, r.ok, r.code ?? '', (r.message ?? r.receipt?.summary ?? '').slice(0, 200));
const h = await started({ seed: 3 });
const sellAll = async (name) => { let got = 0; for (const it of h.items().filter(i => i.name === name && !i.equipped)) { let best = null; for (const k of ['general','apothecary','smith','crafter','guild']) { const q = h.q('trade.quote', { type: 'sell', stack: it.stack, qty: it.qty, kind: k }); if (q.ok && (!best || q.total > best.total)) best = { ...q, k }; } if (best) { const r = await h.cmd('trade.sell', { stack: it.stack, qty: it.qty, kind: best.k }); if (r.ok) got += r.receipt.data.total; else console.log('sell fail', r.message); } } return got; };
// 1. ~ item qty
await h.send('A draught.', h.reply('One draught.', ['+ item Minor Healing Draught']));
await h.send('More.', h.reply('The crate was full.', ['~ item Minor Healing Draught | qty: 9999']));
console.log('draughts after ~qty', h.items().filter(i => i.name === 'Minor Healing Draught').reduce((s, i) => s + i.qty, 0));
const w0 = h.wallet();
console.log('sold draughts for', await sellAll('Minor Healing Draught'), 'wallet', w0, '->', h.wallet());
// 2. many pack items in one reply
const PACKITEMS = ['Gambeson','Cane-Blade','Iron Cap','Iron-bound Buckler','Hatchet','Spear','Mana Draught','Common Antidote','River Drake Scale','Backpack','Small Monster Core'];
await h.send('A cache.', h.reply('A smuggler\'s cache.', PACKITEMS.map(n => `+ item ${n} | qty: 20`)));
const w1 = h.wallet(); let total = 0;
for (const n of PACKITEMS) total += await sellAll(n);
console.log('one reply of pack items sold for', total, 'wallet', w1, '->', h.wallet(), 'coin budget', h.q('quest.ranks')?.[0]?.reward);
await h.send('Chest', h.reply('Gold.', ['+ coin 100000']));
console.log('coin line paid', h.wallet() - (w1 + total));
h.close();
