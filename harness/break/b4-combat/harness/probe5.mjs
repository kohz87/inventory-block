import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
await seeded(21, async () => {
  // A: draught gone mid-fight, auto drinks it
  for (const how of ['drop', 'story', 'sell']) {
    const host = await started();
    await host.send('search', host.reply('vials', ['+ item Minor Healing Draught | qty: 3 | note: heal 20']));
    const { start } = await offerAndStart(host, '! encounter 3 Wolf | tier: even');
    const st = host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught');
    let gone;
    if (how === 'drop') gone = await host.cmd('inventory.drop', { stack: st.stack, qty: 3 });
    if (how === 'story') gone = (await host.send('I toss them', host.reply('They shatter.', ['- item Minor Healing Draught | qty: 3'])), { ok: !host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught') });
    if (how === 'sell') gone = await host.cmd('trade.sell', { stack: st.stack, qty: 3 });
    console.log(how, 'gone', gone.ok, gone.code ?? '', gone.message ?? '', 'left', host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught')?.qty ?? 0);
    let drank = 0, missing = 0;
    for (let n = 0; n < 200; n++) {
      const s = host.q('combat.session'); if (!s || s.status !== 'active') break;
      const r = await host.cmd('combat.act', { action: { type: 'auto' } });
      if (!r.ok) { console.log('act refused', r.message); break; }
      for (const t of r.receipt.data.log) if (/Draught/.test(t)) { drank++; console.log('   ', t); }
      if (r.receipt.data.missing) { missing++; console.log('   missing', JSON.stringify(r.receipt.data.missing)); }
    }
    const e = await host.cmd('combat.end');
    console.log('  status', e.receipt?.data.outcome, 'drank', drank, 'missing', missing);
    const rp = await replayed(host); if (hash(rp) !== hash(host.head())) console.log('  REPLAY MISMATCH');
    host.close();
  }
});
