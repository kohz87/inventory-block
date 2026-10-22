import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
await seeded(31, async () => {
  const host = await started();
  console.log('initial combat', JSON.stringify(host.head().domains.combat));
  await offerAndStart(host, '! encounter 2 Wolf | tier: weak');
  await host.send('keep going', 'Steel rings.');
  await host.cmd('combat.act', { action: { type: 'defend' } });
  const enc = host.st.ctx.chat.findIndex(m => /Foes!/.test(m.mes));
  console.log('carrier records', host.st.ctx.chat.map((m, i) => i + ':' + (m.extra?.storySuite?.receipts?.map(r => r.type).join(',') ?? '-')).join(' | '));
  await host.st.deleteMessage(enc);
  console.log('after: combat', JSON.stringify(host.head().domains.combat), 'problems', JSON.stringify(host.store.problems?.() ?? null).slice(0,400));
  console.log('carrier records', host.st.ctx.chat.map((m, i) => i + ':' + (m.extra?.storySuite?.receipts?.map(r => r.type).join(',') ?? '-')).join(' | '));
  console.log(JSON.stringify(host.st.ctx.chat.at(-1).extra.storySuite.ops ?? host.st.ctx.chat.at(-1).extra.storySuite).slice(0, 1500));
  host.close();
});
