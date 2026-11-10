import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
import { maxHp } from '../../../src/rules.js';
const chk = async (host, label) => { const rp = await replayed(host); console.log('  ', label, hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH'); };
await seeded(41, async () => {
  // spend points mid-fight
  let host = await started();
  await host.cmd('party.grantXp', { amount: 300 });
  let pc = host.q('party.pc'); console.log('S before: lvl', pc.level, 'pts', pc.points, 'hp', pc.hp, 'VIT', pc.stats.VIT);
  await offerAndStart(host, '! encounter 2 Wolf | tier: weak');
  const sp = await host.cmd('party.spend', { points: { VIT: pc.points } });
  pc = host.q('party.pc'); console.log('S spend mid fight', sp.ok, sp.code ?? '', sp.message ?? sp.receipt.summary, 'hp', pc.hp, 'VIT', pc.stats.VIT);
  await playOut(host); await host.cmd('combat.end');
  pc = host.q('party.pc'); console.log('S after end hp', pc.hp, 'VIT', pc.stats.VIT, 'maxHp by rule', maxHp(pc.stats, pc.level));
  host.close();

  // join mid-fight then death fight, companion going down, won
  for (const seed of [1,2,3]) {
  host = await started();
  await host.send('meet', host.reply('Lyra joins?', ['+ join Lyra — an archer | level: 1 | role: ranger']));
  const off = host.q('party.offers')?.[0] ?? host.head().domains.party.offers[0];
  const acc = await host.cmd('party.acceptOffer', { offer: off.id }); console.log('D join', acc.ok, acc.message ?? '');
  await offerAndStart(host, `! encounter ${seed+1} Bandit | tier: even | stakes: death`);
  await host.send('mid', host.reply('Kael steps in.', ['+ join Kael — a knight | level: 1 | role: tank', '- leave Lyra — she runs']));
  const offers = host.head().domains.party.offers; console.log('D offers mid', offers.map(o => o.kind + ':' + (o.name ?? o.actor)).join(','));
  for (const o of offers) { const r = await host.cmd('party.acceptOffer', { offer: o.id }); console.log('  accept', o.kind, r.ok, r.code ?? '', r.message ?? r.receipt.summary); }
  const st = await playOut(host); const e = await host.cmd('combat.end');
  console.log('D end', st, e.ok, e.code ?? '', 'died', JSON.stringify(e.receipt?.data.died), 'party', host.q('party.actors').map(a => a.name + ':' + a.hp.cur + (a.conditions.map(c=>c.kind).join('/'))).join(' '));
  console.log('  xp', JSON.stringify(e.receipt?.data.xp));
  await chk(host, 'D');
  host.close();
  }
});
