import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
await seeded(111, async () => {
  const host = await started();
  await host.send('search', host.reply('vials', ['+ item Minor Healing Draught | qty: 2 | note: heal 20']));
  const snap = JSON.stringify({ party: host.head().domains.party, inv: host.head().domains.inventory });
  await offerAndStart(host, '! encounter 1 Lich (boss) | tier: deadly | stakes: death');
  const startIndex = host.st.ctx.chat.length - 1;
  for (let i = 0; i < 24; i++) {
    await host.send(`m${i}`, `r${i}`);
    const s = host.q('combat.session'); if (s?.status === 'active') await host.cmd('combat.act', { action: { type: i % 3 ? 'defend' : 'auto' } });
  }
  if (host.q('combat.session')?.status === 'active') await playOut(host);
  const e = await host.cmd('combat.end'); console.log('end', e.receipt?.data.outcome, 'chat len', host.st.ctx.chat.length, 'start idx', startIndex);
  const point = host.q('return.point'); console.log('point', JSON.stringify(point));
  const { returnInTime } = await import('../../../src/v2/return/index.js');
  const r = await returnInTime(host.sdk); console.log('return', r.ok, r.code ?? '', r.message ?? '', 'chat len', host.st.ctx.chat.length, 'chatId', host.st.ctx.chatId);
  const now = JSON.stringify({ party: host.head().domains.party, inv: host.head().domains.inventory });
  console.log('party+inventory equal to before the fight?', now === snap);
  if (now !== snap) { const a = JSON.parse(snap), b = JSON.parse(now); console.log(JSON.stringify(a.party.actors).slice(0,300)); console.log(JSON.stringify(b.party.actors).slice(0,300)); }
  console.log('offers', host.q('combat.offers').length, 'pc', host.q('party.pc').hp, host.q('party.pc').conditions);
  const rp = await replayed(host); console.log(hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH');
  const g = await host.send('again', 'We stand at the moment before.'); console.log('gen aborted', g.aborted ?? false, 'tail has cue', /back at the moment/.test(host.tails().at(-1)));
  host.close();
});
