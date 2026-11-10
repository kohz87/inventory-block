// B4r2-8: "Counted in levels, the same budget holds at any level" (setup.js, RB-fix1 #83). A level-20
// character (made from the preset by v1's own gainXp and spendPoints, its points spent in the
// preset's proportions; skills left at mastery 1) loses to four WEAK Cellar Rat Swarms about half
// the time as a caster (46 %) and a quarter as a fighter (74 %), against the weak target ≥ 90 %;
// at level 10 the same character wins 100 %. Numbers: r2/sim/level10.jsonl, level20.jsonl.
import test from 'node:test';
import assert from 'node:assert/strict';
import { patch, withHero } from '../qa/helpers/harness.js';
import { PRESETS } from '../../../src/skills.js';
import { DEFAULT_RULES, xpToNext } from '../../../src/rules.js';
import { gainXp } from '../../../src/growth.js';
import { spendPoints } from '../../../src/sheet.js';
import { fromSheet, toSheet } from '../../../src/v2/party/sheets.js';

/** Test setup only: your character raised to `level` by v1's rules, points spent like the preset. */
function levelled(h, preset, level) {
    patch(h, state => {
        const party = state.domains.party;
        const actor = party.actors[party.pc];
        let xp = 0;
        for (let lv = 1; lv < level; lv += 1) xp += xpToNext(lv, DEFAULT_RULES);
        let sheet = gainXp(toSheet(actor), xp, DEFAULT_RULES).sheet;
        const points = PRESETS.find(entry => entry.id === preset).points;
        const total = Object.values(points).reduce((a, b) => a + b, 0);
        const keys = Object.keys(points);
        let left = sheet.points;
        const allocation = {};
        keys.forEach((key, index) => {
            const n = index === keys.length - 1 ? left : Math.floor(sheet.points * points[key] / total);
            allocation[key] = n;
            left -= n;
        });
        sheet = spendPoints(sheet, allocation, DEFAULT_RULES);
        sheet.hp = { ...sheet.hp, cur: sheet.hp.max };
        sheet.mp = { ...sheet.mp, cur: sheet.mp.max };
        party.actors[party.pc] = fromSheet(actor, sheet, DEFAULT_RULES);
    });
}

function fight(words, tier, preset, seed, level) {
    const { h } = withHero({ seed, preset });
    levelled(h, preset, level);
    h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier } });
    assert.equal(h.command('combat.start', { offer: h.query('combat.offers').at(-1).id }).ok, true);
    for (let n = 0; n < 400 && h.query('combat.session').status === 'active'; n += 1) h.command('combat.act', { action: { type: 'auto' } });
    return h.query('combat.session').status;
}

test('B4r2-8: weak foes stay weak at level 20 (four Cellar Rat Swarms, caster and fighter ≥ 90 %)', { timeout: 600000 }, () => {
    for (const preset of ['caster', 'fighter']) {
        let won = 0;
        for (let seed = 6000; seed < 6050; seed += 1) if (fight('4 Cellar Rat Swarm', 'weak', preset, seed, 20) === 'won') won += 1;
        assert.ok(won >= 45, `level-20 ${preset}: ${won}/50 won against four weak Cellar Rat Swarms`);
    }
});
