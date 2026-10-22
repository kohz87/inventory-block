import { started } from './helpers/suite.js';
const h = await started({ seed: 3 });
const lines = Array.from({ length: 50 }, (_, i) => `+ item Phoenix Draught ${i + 1} | qty: 20 | note: heal 999`);
await h.send('A cache.', h.reply('An alchemist\'s cache.', lines));
const w0 = h.wallet(); let n = 0;
for (const it of h.items().filter(i => i.name.startsWith('Phoenix'))) { n += it.qty; const r = await h.cmd('trade.sell', { stack: it.stack, qty: it.qty, kind: 'apothecary' }); if (!r.ok) { console.log(r.message); break; } }
console.log('items', n, 'sold for', h.wallet() - w0, 'carry', JSON.stringify(h.q('items.carry', {}))?.slice(0, 200));
h.close();
