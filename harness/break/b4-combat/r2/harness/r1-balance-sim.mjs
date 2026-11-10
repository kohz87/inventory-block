// Balance simulation (B4): win rates of a fresh level-1 character on auto against weak / trivial /
// even foes through v2's real encounter → offer → combat.start path (the QA harness on Story
// Block's real bus), and the same foes in v1's engine with a v1 sheet (startFight, all auto).
import { withHero } from '../qa/helpers/harness.js';
import { DEFAULT_RULES, makeRules, suggestRank } from '../../../src/rules.js';
import { parseEncounter, resolveThreats } from '../../../src/story.js';
import { DEFAULT_BESTIARY, findCreature } from '../../../src/enemies.js';
import { DEFAULT_SKILLS, PRESETS } from '../../../src/skills.js';
import { combatantFromSheet, enemiesFromRows, engagements } from '../../../src/party.js';
import { makeRng } from '../../../src/rng.js';
import { newSheet } from '../../../src/sheet.js';
import { startFight, act } from '../../../src/combat.js';
import { cleanCreature, combinedBestiary, creaturesToMake } from '../../../src/templates.js';

const SEEDS = Number(process.env.SEEDS ?? 200);
const FIRST = Number(process.env.FIRST ?? 1000);

function v2(words, tier, preset, seed) {
    const { h } = withHero({ seed, preset });
    const offered = h.capture({ op: '!', kind: 'encounter', name: words, text: '', labels: { tier } });
    if (!offered.ok) return 'refused';
    const offer = h.query('combat.offers').at(-1);
    const start = h.command('combat.start', { offer: offer.id });
    if (!start.ok) return 'refused';
    for (let n = 0; n < 400; n++) {
        const s = h.query('combat.session');
        if (s.status !== 'active') return s.status;
        h.command('combat.act', { action: { type: 'auto' } });
    }
    return 'stuck';
}

const rules = makeRules({ turns: { mode: 'timeline' } });
function v1(words, tier, preset, seed) {
    const p = PRESETS.find(x => x.id === preset);
    const sheet = newSheet({ name: 'Ren', stats: p.points, skills: p.skills }, DEFAULT_RULES);
    const pc = combatantFromSheet(sheet, { memberId: 'pc', controller: 'auto', library: DEFAULT_SKILLS, rules });
    const rows0 = resolveThreats(parseEncounter(`${words} (${tier})`, DEFAULT_BESTIARY, rules), 1, rules);
    const fair = suggestRank(1, rules);
    const rows = rows0.map(row => {
        const lv = Number(row.level) >= 1 ? Math.round(Number(row.level)) : null;
        const rank = lv ? null : row.rank || (findCreature(DEFAULT_BESTIARY, row.name) ? null : fair);
        return { ...row, level: lv, rank, makeAt: lv ?? rules.ranks[rank ?? fair]?.level ?? 1 };
    });
    const made = creaturesToMake(rows.map(r => ({ ...r, level: r.makeAt })), { chatBestiary: [], defaults: DEFAULT_BESTIARY, rules, seed: String(seed) }).map(e => cleanCreature(e, rules)).filter(Boolean);
    const bestiary = combinedBestiary(made, DEFAULT_BESTIARY);
    const { enemies, waves } = engagements(enemiesFromRows(rows, { bestiary, library: DEFAULT_SKILLS, rules, rng: makeRng(`${seed}:enemies`) }));
    let f = startFight({ id: 'f', seed, party: [pc], enemies, ...(waves.length ? { waves } : {}), turns: 'timeline', rules });
    if (f.status === 'active') f = act(f, { type: 'auto' }, rules);
    return f.status === 'victory' ? 'won' : f.status === 'defeat' ? 'lost' : f.status;
}

const CASES = [
    ['3 Wolf', 'weak'], ['6 Giant Rat', 'weak'], ['Giant Rat Swarm', 'weak'], ['2 Giant Rat', 'weak'],
    ['6 Cellar Rat Swarm', 'weak'], ['2 Cellar Rat', 'weak'], ['3 Bandit', 'weak'], ['a pack of wolves', 'weak'],
    ['3 Wolf', 'trivial'], ['3 Wolf', 'even'], ['1 Wolf', 'even'], ['2 Goblin', 'even'], ['1 Ogre', 'strong'],
];
const rows = [];
for (const preset of (process.env.PRESETS ?? 'fighter,caster,healer,archer,skirmisher').split(',')) {
    for (const [words, tier] of CASES) {
        const tally = { v2: 0, v1: 0, n: 0, other: 0 };
        for (let s = FIRST; s < FIRST + SEEDS; s++) {
            const a = v2(words, tier, preset, s);
            const b = v1(words, tier, preset, s);
            tally.n++;
            if (a === 'won') tally.v2++;
            if (b === 'won') tally.v1++;
            if (!['won', 'lost', 'fled'].includes(a)) tally.other++;
        }
        const row = { preset, words, tier, v2: +(tally.v2 / tally.n * 100).toFixed(1), v1: +(tally.v1 / tally.n * 100).toFixed(1), other: tally.other, n: tally.n };
        rows.push(row);
        console.log(JSON.stringify(row));
    }
}
