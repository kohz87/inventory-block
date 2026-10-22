// a2 probe 8: Ersveil's pack coins (copper 1, bronze 1, silver 10, gold 100) through every money path.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const lines = JSON.parse(process.argv[2] ?? '["+ coin 3 gold"]');
const host = await started({ seed: 8, settings: process.argv[3] ? JSON.parse(process.argv[3]) : null });
console.log('currency', JSON.stringify(host.q('inventory.currency')), 'economy', JSON.stringify(host.q('inventory.economy')));
for (const line of lines) {
  const w = host.wallet();
  await host.send('x', host.reply('y', [line]));
  const last = host.receipts().filter(r => r.module === 'story-block' || r.type?.startsWith?.('inventory') || r.type?.startsWith?.('wallet')).at(-1);
  console.log(JSON.stringify(line), 'wallet', w, '→', host.wallet(), '|', last?.summary?.slice(0, 120), last?.problem ?? '');
}
host.close();
