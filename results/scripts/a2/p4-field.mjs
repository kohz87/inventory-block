// a2 probe 4: the on-field cap and waves: rows past MAX_FOES, counts past MAX_COUNT, stunner spreading.
import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
const lines = JSON.parse(process.argv[2]);
const settings = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;
for (const line of lines) {
  const host = await market(settings ? { settings } : {});
  await host.send('Go.', host.reply('Foes.', [line]));
  const offer = host.q('combat.offers').at(-1);
  if (!offer) { console.log(line, '→ NO OFFER', JSON.stringify(host.receipts?.().at?.(-1) ?? '')); host.close(); continue; }
  const r = await host.cmd('combat.start', { offer: offer.id });
  if (!r.ok) { console.log(line, '→ start refused', r.code, r.message); host.close(); continue; }
  const s = sessionOf(host.head().domains.combat);
  const setup = s.setup;
  const w0 = setup.enemies.map(e => `${e.name}${e.boss ? '*' : ''}`);
  const ws = (setup.waves ?? []).map(w => w.enemies.map(e => `${e.name}${e.boss ? '*' : ''}`));
  console.log(line, '\n  offer', JSON.stringify(offer.foes.map(f => [f.name, f.count, f.tier, f.boss ? 'boss' : ''])), '\n  wave0', w0.length, w0.join(','), '\n  later', ws.map(w => `${w.length}:[${w.join(',')}]`).join(' '), '\n  summary', r.receipt?.summary);
  host.close();
}
