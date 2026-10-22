// a2 probe 2: the story names pack goods (`+ item <pack item>`), sold at a capital: beyond the money budget?
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const host = await started({ seed: 3 });
const w0 = host.wallet();
const lines = process.argv[2] ? JSON.parse(process.argv[2]) : ['+ item River Drake Scale | qty: 2', '+ item Wool Blanket'];
await host.send('Loot.', host.reply('A drake hoard.', lines));
console.log('budget', JSON.stringify(host.q('inventory.storyBudget')));
await host.send('Travel.', host.reply('The capital.', ['~ place Highcrown | kind: capital | tags: frontier, desert']));
try { console.log('market', JSON.stringify(host.q('trade.market'))); } catch (e) { console.log(e.message); }
let total = 0;
for (const it of host.items()) {
  if (it.equipped || it.key) continue;
  let best = null;
  for (const kind of ['general', 'smith', 'crafter', 'apothecary', 'guild']) {
    const q = host.q('trade.quote', { type: 'sell', stack: it.stack, qty: it.qty, kind });
    if (q?.ok && (!best || q.total > best.total)) best = { ...q, kind };
  }
  if (best && /drake|blanket|monster core/i.test(it.name)) { console.log(it.name, it.def, it.value, 'x', it.qty, '→', best.kind, best.total); const r = await host.cmd('trade.sell', { stack: it.stack, qty: it.qty, kind: best.kind }); if (r.ok) total += best.total; else console.log('sell refused', r.code, r.message); }
}
console.log('sold for', total, 'wallet', w0, '→', host.wallet());
host.close();
