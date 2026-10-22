import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
const chk = async (host, label) => { const rp = await replayed(host); console.log('  ', label, hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH'); return rp; };
await seeded(31, async () => {
  // swipe the reply that started the fight, mid-fight
  let host = await started();
  await offerAndStart(host, '! encounter 3 Wolf | tier: weak');
  await host.cmd('combat.act', { action: { type: 'defend' } });
  console.log('A session before swipe', host.q('combat.session')?.id, host.q('combat.session')?.status);
  await host.swipe(host.reply('Nothing here.', []));
  console.log('A after swipe session', host.q('combat.session'), 'offers', host.q('combat.offers').length, 'pc hp', host.q('party.pc').hp);
  const a = await host.cmd('combat.act', { action: { type: 'attack' } }); console.log('A act after swipe', a.ok, a.code);
  await host.st.swipeTo(host.st.ctx.chat.length - 1, 0);
  console.log('A swipe back to 0: session', host.q('combat.session')?.id, host.q('combat.session')?.status, 'actions', host.head().domains.combat.session?.actions.length);
  await chk(host, 'A');
  host.close();

  // fight continues across later replies and a checkpoint boundary (25 replies)
  host = await started();
  await offerAndStart(host, '! encounter 2 Bandit | tier: even');
  for (let i = 0; i < 25; i++) {
    await host.send(`msg ${i}`, host.reply(`reply ${i}`, i % 5 === 0 ? ['~ wound Ren — a thorn | harm: scratch'] : []));
    const s = host.q('combat.session'); if (s?.status === 'active') await host.cmd('combat.act', { action: { type: 'defend' } });
  }
  const s = host.q('combat.session'); console.log('B status', s?.status, 'round', s?.round, 'pc fight hp', s?.combatants.find(c=>c.side==='party').hp, 'party hp', host.q('party.pc').hp);
  await chk(host, 'B mid');
  if (s?.status === 'active') await playOut(host);
  const e = await host.cmd('combat.end'); console.log('B end', e.ok, e.receipt?.data.outcome);
  await chk(host, 'B end');
  // delete the reply that started the fight (index of encounter reply) — middle delete
  const idx = host.st.ctx.chat.findIndex(m => /Foes!/.test(m.mes));
  await host.st.deleteMessage(idx);
  console.log('B after middle delete: beaten', host.head().domains.combat.beaten.length, 'xp', host.q('party.pc').xp, 'session', host.head().domains.combat.session?.status);
  await chk(host, 'B del');
  host.close();

  // delete the reply holding combat.start while acting continues on a later reply
  host = await started();
  await offerAndStart(host, '! encounter 2 Wolf | tier: weak');
  await host.send('keep going', 'Steel rings.');
  await host.cmd('combat.act', { action: { type: 'defend' } });
  const enc = host.st.ctx.chat.findIndex(m => /Foes!/.test(m.mes));
  await host.st.deleteMessage(enc);
  const ss = host.head().domains.combat.session;
  console.log('C after deleting the start reply: session', ss?.id, ss?.status, 'actions', ss?.actions?.length, 'offers', host.q('combat.offers').length);
  try { console.log('C session view', host.q('combat.session')?.status); } catch (err) { console.log('C session view THROWS', err.message); }
  const r = await host.cmd('combat.act', { action: { type: 'attack' } }); console.log('C act', r.ok, r.code, r.message);
  await chk(host, 'C');
  host.close();
});
