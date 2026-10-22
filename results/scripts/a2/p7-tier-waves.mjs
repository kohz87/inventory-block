// a2 probe 7: win rate (auto) of tier fights with many foes in waves (quest-sized sizes), level 1 presets.
import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
import { playOut, seeded } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
console.warn = () => {};
const [line, seeds = '12', preset = 'fighter'] = process.argv.slice(2);
let won = 0, total = 0; const hp = [];
for (let seed = 1; seed <= Number(seeds); seed++) {
  const g = globalThis.crypto; let x = seed * 7919;
  const host = await market();
  await host.send('Go.', host.reply('Foes.', [line]));
  const offer = host.q('combat.offers').at(-1);
  const r = await host.cmd('combat.start', { offer: offer.id });
  if (!r.ok) { console.log('refused', r.message); host.close(); break; }
  const st = await playOut(host);
  total++; if (st === 'won') won++;
  host.close();
}
console.log(line, `won ${won}/${total}`);
