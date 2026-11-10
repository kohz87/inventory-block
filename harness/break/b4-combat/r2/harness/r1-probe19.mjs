import { started, seeded, playOut, offerAndStart, hash } from './helpers.js';
const run = () => seeded(123, async () => {
  const host = await started();
  await offerAndStart(host, '! encounter 3 Bandit | tier: even | stakes: death');
  let flees = 0, refused = 0;
  for (let i = 0; i < 300; i++) {
    const s = host.q('combat.session'); if (!s || s.status !== 'active') break;
    const r = await host.cmd('combat.flee'); flees++; if (!r.ok) { refused++; await host.cmd('combat.act', { action: { type: 'defend' } }); }
  }
  const s = host.q('combat.session');
  const e = await host.cmd('combat.end');
  const out = { flees, refused, status: s?.status, xp: e.receipt?.data.xp, beaten: host.head().domains.combat.beaten, h: hash(host.head().domains.combat.last) };
  host.close(); return out;
});
const a = await run(); const b = await run();
console.log(JSON.stringify(a)); console.log('deterministic', JSON.stringify(a) === JSON.stringify(b));
