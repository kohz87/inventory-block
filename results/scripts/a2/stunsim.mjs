// a2: stun-lock sim. Many auto fights by seed; flags any combatant that loses two of its own turns in a row to a stun.
import { heroParty, PRESET_IDS } from '/home/user/cell/a2/rpg_battle/scripts/balance-lib.mjs';
import { readEncounter } from '/home/user/cell/a2/rpg_battle/src/v2/combat/encounter.js';
import { buildSetup, fightNumbers } from '/home/user/cell/a2/rpg_battle/src/v2/combat/setup.js';
import { fightRules } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
import { startFight, actInPlace } from '/home/user/cell/a2/rpg_battle/src/combat.js';
import { DEFAULT_BESTIARY } from '/home/user/cell/a2/rpg_battle/src/enemies.js';
import { combinedBestiary } from '/home/user/cell/a2/rpg_battle/src/templates.js';
console.warn = () => {};
const seeds = Number(process.argv[2] ?? 200);
const stunners = DEFAULT_BESTIARY.filter(e => JSON.stringify(e).includes('Crushing Blow') || JSON.stringify(e).includes('Stomp')).map(e => e.name);
console.log('stunner creatures', stunners.slice(0, 12).join(', '), stunners.length);
let fights = 0, locks = 0, sample = null;
const words = ['3 Storm Hound', '2 Thunder Lizard', 'Storm Wyrm (boss)', ...stunners.slice(0, 6).map(n => `3 ${n}`), ...stunners.slice(0, 4).map(n => `${n} (boss)`), 'Ogre (boss)'];
for (const preset of PRESET_IDS) for (const level of [1, 10, 40]) {
  const base = heroParty(preset, level);
  for (const w of words) for (const tier of ['trivial', 'even', 'deadly']) for (let s = 0; s < seeds / 10; s++) {
    const read = readEncounter({ op: '!', kind: 'encounter', name: w, text: '', labels: { tier } }, { bestiary: combinedBestiary([], DEFAULT_BESTIARY) });
    if (!read.ok) continue;
    let built; try { built = buildSetup({ id: 'fi_00000001', seed: 5000 + s, offer: { foes: read.foes, stakes: 'normal' }, party: structuredClone(base), chatBestiary: [], numbers: fightNumbers({}) }); } catch { continue; }
    const rules = fightRules(built.setup);
    const f = startFight({ ...built.setup, rules });
    if (f.status === 'active') actInPlace(f, { type: 'auto' }, rules);
    fights++;
    // per actor: sequence of turn outcomes
    const last = {};
    for (const e of f.log ?? []) {
      const who = e.actor ?? e.who ?? e.id; const t = e.text ?? e.message ?? '';
      if (!who) continue;
      if (/is stunned and loses the turn/.test(t)) {
        if (last[who] === 'stun') { locks++; if (!sample) sample = { preset, level, w, tier, s, who, log: (f.log).slice(0, 80).map(x => x.text) }; }
        last[who] = 'stun';
      } else if (e.kind !== 'condition' && e.kind !== 'info') last[who] = 'act';
    }
  }
}
console.log({ fights, locks });
if (sample) console.log(JSON.stringify(sample, null, 1).slice(0, 5000));
