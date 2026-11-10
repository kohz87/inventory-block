import { started, seeded, offerAndStart, playOut } from './helpers.js';
await seeded(101, async () => {
  const host = await started();
  await offerAndStart(host, '! encounter 2 Wolf | tier: weak');
  const hp0 = host.q('party.pc').hp.cur;
  const r = await host.send('ow', host.reply('A rock falls on you.', ['~ wound Ren — a falling rock | harm: grievous']));
  const hp1 = host.q('party.pc').hp.cur;
  const rcpt = host.st.ctx.chat.at(-1).extra.storySuite.receipts.map(x => x.type + ': ' + x.summary);
  console.log('wound mid-fight', hp0, '->', hp1, rcpt);
  await host.cmd('combat.act', { action: { type: 'defend' } });
  console.log('after next act', host.q('party.pc').hp.cur, 'fight says', host.q('combat.session').combatants.find(c => c.side === 'party').hp.cur);
  const h2 = await host.send('heal', host.reply('A priest heals you.', ['~ wound Ren — prayer | heal: grievous']));
  console.log('heal mid-fight', host.q('party.pc').hp.cur, host.st.ctx.chat.at(-1).extra.storySuite.receipts.map(x => x.type + ': ' + x.summary));
  const card = host.q('rpg-battle.cards')[0]; console.log('card xpName', card.xpName, 'xpText', card.xpText);
  host.close();
});
