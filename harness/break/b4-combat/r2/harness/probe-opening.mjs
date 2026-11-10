import { started, seeded, offerAndStart } from './helpers.js';
let hits = 0;
for (let seed = 1; seed <= 60 && hits < 3; seed++) await seeded(seed, async () => {
  const host = await started();
  try {
    await host.internal('party.addCompanion', { name: 'Lyra', role: 'ranger' });
    const lyra = host.q('party.actors').find(a => a.name === 'Lyra');
    await host.send('vials', host.reply('vials', ['+ item Minor Healing Draught | qty: 3 | owner: Lyra | note: heal 20']));
    const st = host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught' );
    if (!st) { console.log('no stack'); return; }
    if (st.owner !== lyra.id) { const t = await host.internal('inventory.transfer', { stack: st.stack, to: lyra.id }); if (!t.ok) console.log('transfer', t.message); }
    await host.internal('party.fightPools', { actors: [{ id: lyra.id, hp: 3 }] });
    const before = host.q('inventory.items', { owner: lyra.id }).find(i => i.name === 'Minor Healing Draught')?.qty ?? 0;
    const { start } = await offerAndStart(host, '! encounter 3 Wolf | tier: even');
    const s = host.q('combat.session');
    const drunk = s.log.filter(e => /Lyra uses Minor Healing Draught/.test(e.text)).length;
    const after = host.q('inventory.items', { owner: lyra.id }).find(i => i.name === 'Minor Healing Draught')?.qty ?? 0;
    if (drunk) { hits++; console.log('seed', seed, 'drunk in the opening', drunk, 'bag', before, '->', after, 'fight qty', JSON.stringify(host.head().domains.combat.session && 'see')); }
  } finally { host.close(); }
});
console.log('hits', hits);
