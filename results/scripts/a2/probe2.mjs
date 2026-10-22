// a2 probe 2: refine / repair / resale loops on start gear (no trade.paid cap), Ersveil pack.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
const log = (...a) => console.log(...a);
const sh = r => r.ok ? 'OK ' + (r.receipt?.summary ?? '') : `NO ${r.code} ${r.message}`;
console.warn = () => {};
const seed = Number(process.argv[2] ?? 7);
const host = await started({ seed, settings: process.argv[3] ? { storyBlock: { economyScale: Number(process.argv[3]) } } : null });
const blade = () => host.items().find(i => i.name.startsWith('Cane-Blade'));
const q = (stack, kind = 'smith') => { const r = host.q('trade.quote', { type: 'sell', stack, qty: 1, kind }); return r.ok ? r.total : r.code; };
// lots of coin from several replies
for (let i = 0; i < 12; i++) await host.send('Work.', host.reply('Paid.', ['+ coin 400']));
const start = host.wallet();
log('start wallet', start, 'blade sells', q(blade().stack));
const st = host.q('trade.stock', { kind: 'Gate Forge' });
const filings = st.items.find(i => i.def.name === 'Iron Filings');
log(sh(await host.cmd('trade.buy', { shop: st.shop, def: filings.def.id, qty: 10 })));
let spent = start - host.wallet();
for (let lvl = 1; lvl <= 6; lvl++) {
  const before = host.wallet();
  const r = await host.cmd('trade.refine', { stack: blade().stack, at: 'smith' });
  log('refine', lvl, sh(r).slice(0, 200), 'fee', before - host.wallet(), 'now sells', q(blade().stack), q(blade().stack, 'general'));
  await host.send('On.', host.reply('Time passes.', []));
}
const w0 = host.wallet();
const sold = await host.cmd('trade.sell', { stack: blade().stack, qty: 1, kind: 'smith' });
log(sh(sold));
log('net over loop', host.wallet() - start, '(blade was worth', 'sold for', sold.receipt?.data?.total, ')');
host.close();
