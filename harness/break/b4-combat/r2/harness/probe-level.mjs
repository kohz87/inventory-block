import { withHero, patch } from '../qa/helpers/harness.js';
import { PRESETS } from '../../../src/skills.js';
import { DEFAULT_RULES, xpToNext } from '../../../src/rules.js';
import { gainXp } from '../../../src/growth.js';
import { spendPoints } from '../../../src/sheet.js';
import { fromSheet, toSheet } from '../../../src/v2/party/sheets.js';
const N = Number(process.env.N ?? 100), LV = Number(process.env.LV ?? 10);
function levelled(h, preset) {
  patch(h, s => {
    const party = s.domains.party; const a = party.actors[party.pc];
    let sheet = toSheet(a);
    let xp = 0; for (let l = 1; l < LV; l++) xp += xpToNext(l, DEFAULT_RULES);
    sheet = gainXp(sheet, xp, DEFAULT_RULES).sheet;
    const pts = PRESETS.find(p => p.id === preset).points; const tot = Object.values(pts).reduce((x, y) => x + y, 0);
    const alloc = {}; let left = sheet.points; const keys = Object.keys(pts);
    keys.forEach((k, i) => { const n = i === keys.length - 1 ? left : Math.floor(sheet.points * pts[k] / tot); alloc[k] = n; left -= n; });
    sheet = spendPoints(sheet, alloc, DEFAULT_RULES);
    sheet.hp = { ...sheet.hp, cur: sheet.hp.max }; sheet.mp = { ...sheet.mp, cur: sheet.mp.max };
    party.actors[party.pc] = fromSheet(a, sheet, DEFAULT_RULES);
  });
}
function fight(words, tier, preset, seed) {
  const { h } = withHero({ seed, preset });
  levelled(h, preset);
  h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier } });
  const offer = h.query('combat.offers').at(-1);
  const st = h.command('combat.start', { offer: offer.id }); if (!st.ok) return 'refused:' + st.message;
  for (let n = 0; n < 400 && h.query('combat.session').status === 'active'; n++) h.command('combat.act', { action: { type: 'auto' } });
  return h.query('combat.session').status;
}
const { h } = withHero({ seed: 1, preset: 'fighter' }); levelled(h, 'fighter'); const pc = h.state().domains.party.actors[h.state().domains.party.pc]; console.log('pc', pc.level, JSON.stringify(pc.stats), pc.hp.max);
for (const tier of (process.env.TIERS ?? 'trivial,weak,even,strong,deadly').split(',')) for (const words of ['1 Wolf', '3 Wolf', '6 Giant Rat', '4 Cellar Rat Swarm']) {
  const row = { LV, tier, words };
  for (const preset of ['fighter', 'caster', 'skirmisher']) { let w = 0; for (let s = 0; s < N; s++) if (fight(words, tier, preset, 6000 + s) === 'won') w++; row[preset] = +(w / N * 100).toFixed(1); }
  console.log(JSON.stringify(row));
}
