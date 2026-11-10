import { started, seeded, offerAndStart, playOut } from './helpers.js';
const N = Number(process.env.N ?? 60);
for (const variant of ['solo', 'with3hurt', 'with3full']) {
  let won = 0, fielded = 0;
  for (let s = 0; s < N; s++) await seeded(7000 + s, async () => {
    const host = await started();
    try {
      if (variant !== 'solo') for (const name of ['Ana', 'Bo', 'Cy']) await host.internal('party.addCompanion', { name, role: 'scholar' });
      if (variant === 'with3hurt') {
        const ids = host.q('party.actors').filter(a => a.kind === 'companion').map(a => a.id);
        const r = await host.internal('party.fightPools', { actors: ids.map(id => ({ id, hp: 1 })) });
        if (!r.ok) throw new Error(r.message);
      }
      const { start } = await offerAndStart(host, '! encounter 9 Giant Rat | tier: weak');
      fielded += host.q('combat.session').combatants.filter(c => c.side === 'enemy').length;
      if (host.q('combat.session').status === 'active') await host.cmd('combat.act', { action: { type: 'auto' } });
      const st = await playOut(host);
      if (st === 'won') won++;
    } finally { host.close(); }
  });
  console.log(variant, 'won', (won / N * 100).toFixed(1) + '%', 'avg foes', (fielded / N).toFixed(1));
}
