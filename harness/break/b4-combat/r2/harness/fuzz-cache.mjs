// Fight cache vs fresh replay under random actions, swipes, deletes, sells, story lines.
import { started, seeded, offerAndStart, replayed, hash } from './helpers.js';
import { rebuild } from '../../../src/v2/combat/view.js';
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const SEEDS = Number(process.env.SEEDS ?? 20);
let bad = 0; const msgs = new Set();
for (let seed = 1; seed <= SEEDS; seed++) await seeded(seed * 7, async () => {
  let r = seed * 2654435761 >>> 0; const rnd = n => { r = (r * 1103515245 + 12345) >>> 0; return r % n; };
  const host = await started();
  await host.internal('party.addCompanion', { name: 'Lyra', role: 'ranger', control: 'player' });
  await host.send('vials', host.reply('vials', ['+ item Minor Healing Draught | qty: 4 | note: heal 20']));
  await offerAndStart(host, '! encounter 3 Wolf | tier: even');
  const log = [];
  for (let step = 0; step < 60; step++) {
    const s = host.q('combat.session');
    if (!s) { // fight gone (swipe/delete) or ended: start another if offered
      const off = host.q('combat.offers').at(-1);
      if (off) { await host.cmd('combat.start', { offer: off.id }); log.push('restart'); continue; }
      await offerAndStart(host, '! encounter 2 Wolf | tier: weak'); log.push('newfight'); continue;
    }
    if (s.status !== 'active') { await host.cmd('combat.end'); log.push('end'); continue; }
    const k = rnd(10);
    const a = s.actions;
    let res;
    if (k < 4) { const t = a.targets?.enemies?.[rnd(Math.max(1, a.targets?.enemies?.length ?? 1))]; res = await host.cmd('combat.act', { action: t ? { type: 'attack', target: t } : { type: 'defend' }, session: s.id, logLength: s.logLength }); log.push('atk'); }
    else if (k === 4) { res = await host.cmd('combat.act', { action: { type: 'item', item: 'Minor Healing Draught' }, session: s.id, logLength: s.logLength }); log.push('item'); }
    else if (k === 5) { const st = host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught'); if (st) res = await host.cmd('trade.sell', { stack: st.stack, qty: 1 }); log.push('sell'); }
    else if (k === 6) { await host.send('m', host.reply('r', rnd(2) ? ['+ item Minor Healing Draught | qty: 1 | note: heal 20'] : [])); log.push('reply'); }
    else if (k === 7) { if (!host.st.ctx.chat.at(-1).is_user && host.st.ctx.chat.length > 3) { await host.swipe(host.reply('swiped', [])); log.push('swipe'); } }
    else if (k === 8) { const idx = host.st.ctx.chat.length - 1 - rnd(Math.min(4, host.st.ctx.chat.length - 2)); if (idx > 1) { await host.st.deleteMessage(idx); log.push('del' + idx); } }
    else { res = await host.cmd('combat.act', { action: { type: 'auto' }, session: s.id, logLength: s.logLength }); log.push('auto'); }
    if (res && !res.ok) msgs.add(res.code + ' ' + res.message);
    if (res && !res.ok && !['REFUSED', 'NOT_FOUND', 'INVALID'].includes(res.code)) { console.log('seed', seed, 'step', step, 'unexpected', res.code, res.message); bad++; }
    const sess = host.head().domains.combat.session;
    if (sess) {
      const cached = rebuild(sess).fight; deepFreeze(cached);
      const fresh = rebuild(sess, { fresh: true }).fight;
      if (JSON.stringify(cached) !== JSON.stringify(fresh)) { console.log('seed', seed, 'step', step, 'CACHE != FRESH', log.slice(-6).join(',')); bad++; break; }
    }
  }
  const rp = await replayed(host);
  if (hash(rp) !== hash(host.head())) { console.log('seed', seed, 'REPLAY MISMATCH', log.slice(-8).join(',')); bad++; }
  host.close();
});
console.log('done, problems:', bad); console.log([...msgs].join('\n'));
