import { started, seeded, offerAndStart } from './helpers.js';
import { createHash } from 'node:crypto';
const h = x => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 8);
for (let seed = 1; seed <= 40; seed++) {
  const found = await seeded(seed, async () => {
    const host = await started();
    try {
      await offerAndStart(host, '! encounter 3 Bandit | tier: weak');
      await host.send('fight on', 'Steel rings.');
      // moment X: two defends on the new reply
      for (let i = 0; i < 2; i++) await host.cmd('combat.act', { action: { type: 'defend' } });
      const X = host.q('combat.session'); if (X.status !== 'active') return null;
      const sigX = h(X.log.slice(-5)) + h(X.combatants.map(c => c.hp));
      await host.swipe('Steel rings again.');
      // different path: attacks until log length >= X.logLength
      for (let i = 0; i < 6; i++) {
        const s = host.q('combat.session'); if (!s || s.status !== 'active') return null;
        if (s.logLength === X.logLength) {
          const sig = h(s.log.slice(-5)) + h(s.combatants.map(c => c.hp));
          if (sig === sigX) return null;
          const stale = await host.cmd('combat.act', { action: { type: 'flee' }, session: X.id, logLength: X.logLength });
          return { seed, accepted: stale.ok, len: X.logLength, xTurn: X.turn, nowTurn: s.turn };
        }
        if (s.logLength > X.logLength) return null;
        const t = s.actions.targets?.enemies?.[0];
        await host.cmd('combat.act', { action: t ? { type: 'attack', target: t } : { type: 'defend' } });
      }
      return null;
    } finally { host.close(); }
  });
  if (found) { console.log(JSON.stringify(found)); break; }
}
