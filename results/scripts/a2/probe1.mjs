// a2 probe 1: economy loops on the four-module suite (Ersveil pack).
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
const log = (...a) => console.log(...a);
const sh = r => r.ok ? 'OK ' + (r.receipt?.summary ?? '') : `NO ${r.code} ${r.message}`;
console.warn = () => {};
const host = await started({ seed: 7 });
log('budget', JSON.stringify(host.q('inventory.storyBudget')));
log('economy', JSON.stringify(host.q('inventory.economy')));
log('wallet', host.wallet());
await host.send('Gold.', host.reply('A purse.', ['+ coin 400']));
log('wallet after +coin', host.wallet(), JSON.stringify(host.q('inventory.storyBudget')));
const shops = host.q('trade.shops') ?? null; log('shops', JSON.stringify(shops)?.slice(0, 400));
const st = host.q('trade.stock', { kind: 'Gate Forge' });
log('forge', st?.shop, JSON.stringify(st?.items?.map(i => [i.def.id, i.def.name, i.price, i.left])));
for (const it of host.items()) log('item', it.stack, it.name, it.kind, it.qty, it.key ?? '', it.value);
// sell quotes for everything
for (const it of host.items()) for (const kind of ['general', 'smith', 'fence']) {
  const q = host.q('trade.quote', { type: 'sell', stack: it.stack, qty: 1, kind }); log('quote', it.name, kind, q.ok ? q.total : q.code);
}
host.close();
