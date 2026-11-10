import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
await seeded(81, async () => {
  const host = await started();
  const lv = n => host.q('combat.session')?.combatants.filter(c => c.side === 'enemy').map(c => `${c.name} L${c.level} HP${c.hp.max}`).join(', ');
  for (const line of ['! encounter 1 狼 | tier: even', '! encounter 1 熊 | tier: even', '! encounter 1 狼 | tier: even', '! encounter 1 Wolf? | tier: strong', '! encounter 1 Wolf! | tier: weak', '! encounter 1 Wolf | tier: weak']) {
    const { start } = await offerAndStart(host, line);
    console.log(line, '->', start.ok ? lv() : start.message, '| made', JSON.stringify(start.receipt?.data.made));
    console.log('   bestiary', JSON.stringify(Object.fromEntries(Object.entries(host.head().domains.bestiary.creatures).map(([k, v]) => [k, v.name + ' L' + v.level]))));
    await playOut(host); await host.cmd('combat.end'); await host.cmd('party.rest', { kind: 'long' });
  }
  host.close();
});
