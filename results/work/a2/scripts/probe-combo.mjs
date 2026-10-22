// Combination minting: market shortage + sell, swipe/regenerate re-earning a per-reply cap.
import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const coin = h => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
const items = h => h.q('inventory.items').map(i => `${i.name}×${i.qty}`).sort().join(',');
{
  const h = await suiteHost(); await withParty(h);
  await h.send('go', h.reply('Town.', ['~ place Bluewatch | kind: settlement', '+ item Healing Draught | qty: 3']));
  const stack = Object.values(h.head().domains.inventory.stacks)[0];
  console.log('quote before', JSON.stringify(h.q('trade.quote', { stack: stack.id, qty: 1 })).slice(0, 200));
  await h.send('go', h.reply('Shortage.', ['! market Bluewatch — no potions | until: +5d']));
  console.log('quote shortage', JSON.stringify(h.q('trade.quote', { stack: stack.id, qty: 1 })).slice(0, 200));
  const r = await h.cmd('trade.sell', { stack: stack.id, qty: 1 }); console.log('sell', r.ok, r.code, r.message?.slice(0, 100), 'coin', coin(h));
  h.close();
}
for (const mode of ['swipe', 'regenerate', 'swipe-back']) {
  const h = await suiteHost(); await withParty(h);
  await h.send('go', h.reply('Town.', ['~ place Bluewatch | kind: settlement']));
  const full = ['+ coin 50', '+ item Rope | qty: 20', '~ npc Fenna | trust: +15', '! rest long — inn'];
  await h.send('loot', h.reply('Loot.', full));
  const a = [coin(h), items(h), h.head().domains.npc.npcs.fenna?.meters.trust];
  if (mode === 'regenerate') await h.regenerate(h.reply('Loot again.', full)); else await h.swipe(h.reply('Loot again.', full));
  if (mode === 'swipe-back') await h.st.swipeTo(h.ctx.chat.length - 1, 0);
  const b = [coin(h), items(h), h.head().domains.npc.npcs.fenna?.meters.trust];
  const f = await suiteHost(); await f.st.loadChat(structuredClone(h.ctx.chat));
  console.log(mode, 'after 1st', JSON.stringify(a), 'after', JSON.stringify(b), 'replay', JSON.stringify([coin(f), items(f), f.head().domains.npc.npcs.fenna?.meters.trust]));
  f.close(); h.close();
}
