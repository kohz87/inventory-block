import { started, seeded, replayed, hash, playOut } from './helpers.js';
const lines = [
  '! encounter 0 Wolf | tier: weak',
  '! encounter 500 Wolf | tier: weak',
  '! encounter 9999999999999999999999 Wolf | tier: weak',
  '! encounter -3 Wolf | tier: weak',
  '! encounter 3 <img src=x onerror=alert(1)> | tier: weak',
  '! encounter 2 __proto__ | tier: weak',
  '! encounter 2 constructor | tier: weak',
  '! encounter 1 Wolf, 1 Bear, 1 Rat, 1 Bat, 1 Snake, 1 Toad, 1 Crow, 1 Imp | tier: weak',
  '! encounter 9 Wolf, 9 Bear, 9 Rat, 9 Bat, 9 Snake, 9 Toad | tier: deadly',
  '! encounter 1 狼 | tier: weak',
  '! encounter 1 🐺🐺 | tier: weak',
  '! encounter 1 ' + 'A'.repeat(500) + ' | tier: weak',
  '! encounter 1 Wolf level 999 | tier: weak',
  '! encounter 1 Lich (boss) | tier: deadly | stakes: death',
  '! encounter Infinity Wolf | tier: weak',
  '! encounter 1e9 Wolf | tier: weak',
  '! encounter a thousand wolves | tier: weak',
  '! encounter 3 Wolf | tier: weak | stakes: death | stakes: normal',
];
await seeded(3, async () => {
  for (const line of lines) {
    const host = await started();
    try {
      const r = await host.send('go', host.reply('x', [line]));
      const offer = host.q('combat.offers').at(-1);
      
      if (!offer) { console.log('NO OFFER', line.slice(0,60), JSON.stringify(host.sdk.problems?.() ?? host.st.ctx.chat.at(-1).extra?.storySuite?.problems ?? '').slice(0,300)); continue; }
      const t0 = Date.now();
      const s = await host.cmd('combat.start', { offer: offer.id });
      if (!s.ok) { console.log('START REFUSED', line.slice(0,60), s.code, s.message); continue; }
      const v = host.q('combat.session');
      const status = await playOut(host, { most: 400 });
      const e = await host.cmd('combat.end');
      console.log(line.slice(0,60), '|', offer.text.slice(0,80), '| foes', v.combatants.filter(c=>c.side==='enemy').length, 'lvls', [...new Set(v.combatants.filter(c=>c.side==='enemy').map(c=>c.level))].join(','), '|', status, e.ok ? '' : e.code+e.message, (Date.now()-t0)+'ms');
      const rp = await replayed(host);
      if (hash(rp) !== hash(host.head())) console.log('   REPLAY MISMATCH');
    } catch (err) { console.log('THROW', line.slice(0,60), err.stack.split('\n').slice(0,3).join(' | ')); }
    finally { host.close(); }
  }
});
