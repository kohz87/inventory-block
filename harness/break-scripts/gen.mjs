// Seeded reply generator for the b6-soak run (beta kinds added by beta-e2e: `? loot`, `~ item | wear:`,
// `! craft`, `+ effect` / `- effect`, lone foes and `| boss: yes` encounters, equip lines, day-crossing time skips): plausible Ersveil story text plus a <Changes> block whose
// lines are ~70% valid, ~20% sloppy (drift, typos, wrong kinds) and ~10% hostile, covering every module:
// scene, items, coin, quests (offer / take / turn in by story), fights, checks (with roll labels), companions,
// rest, wounds, skills, the clock, the atlas, world events / factions, Director threads and NSD's NPC block.
//
// createGen(seed) → { next(hint) → { user, reply, meta } }. `hint` is a small summary of the live state the
// driver reads before each reply (place, present, carried, quests, offers, companions, time), so valid lines
// can refer to things that exist.
//
// Beta (v2 at the 2026-10 soak): kinds as the live static part lists them: `! use` (story-driven consumables,
// F96), `! market` shortages, `? check … | roll: 1|2 | result: success|cost|fail | who:` (dice handed over,
// F80), conditions through `~ wound … — poisoned` / `— cure poisoned`, NPC meters `~ npc Name | trust: +N`
// (F81), quest `rank:` / `progress:` / `turned in|failed|abandoned` (F83–F87), foe `rank:` (F91),
// `~ place … | with:`, `+ landmark … | plane:`, `+ beat … | encounter: | reach:`, `- route`, `- world`,
// `~ faction`. Not on v2 yet (no capture kind there): equip-on, cond, wear/repair, story crafting, timed
// effects, meter presets, the day digest; the generator does not write them as valid lines, only a few as
// unknown-kind sloppy lines (`! craft`, `~ cond`, `~ wear`).

export function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const PLACES = ['Bluewatch Village', 'Guild Office', 'Stray Oar', 'Watch Granary', 'Gate Forge', 'North Culvert', 'East Bluff', 'Inspection Quay', 'Watchhouse', 'Salt-and-Ash Yard', 'Auvoth', 'Wolfmere Outpost', 'Glassdock', 'Old Lantern Post', 'Varnhold Watch'];
const PLACE_KIND = { 'Bluewatch Village': 'settlement', Auvoth: 'settlement', 'Wolfmere Outpost': 'settlement', Glassdock: 'settlement', 'East Bluff': 'wild', 'North Culvert': 'wild', 'Old Lantern Post': 'wild', 'Varnhold Watch': 'settlement' };
const NPCS = ['Fenna', 'Marrit', 'Quay inspector', 'Watch-Captain Rorke', 'Hollis', 'Brannoc', 'Sella the sealer', 'Old Tamsin', 'Dov', 'Ysolde', 'the quartermaster', 'Ketter'];
const DRIFT = { Fenna: ['Fena', 'fenna', 'Fenna the clerk', 'Clerk Fenna', 'FENNA'], Marrit: ['Marit', 'Marrit the bargemaster', 'marrit'], Brannoc: ['Branoc', 'Brannock'], 'Watch-Captain Rorke': ['Captain Rorke', 'Rorke', 'Watch Captain Rorke'] };
const PACK_ITEMS = ['Minor Healing Draught', 'Healing Salve', 'Bandage', 'Common Antidote', 'Leech-salt Pouch', 'Coarse Bread', 'Hot Meal', 'Common Ale', 'Trail Rations', 'Torch', 'Lamp Oil', 'Flint and Steel', 'Hemp Rope', 'Waterskin', 'Bedroll', 'Burlap Sack', 'Coarse Salt', 'Crag Wolf Pelt', 'Crag Wolf Fang', 'Rat Tail', 'Live Leech', 'Small Monster Core', 'Spear', 'Hatchet', 'Iron Cap'];
const STORY_ITEMS = ['Moonveil Trout', 'Bent Copper Key', 'Marrit\'s Crew List', 'Salt-stained Letter', 'River Pebble', 'Tarred Twine', 'Lucky Bone Die', 'Inspector\'s Chit', 'Smoked Eel', 'Cracked Lantern'];
const QUESTS = [
    { name: 'Granary Rats', giver: 'Fenna', goal: 'clear the cellar rats out of the Watch granary', target: '6 cellar rats', reward: '50 marks', foe: 'Cellar Rat Swarm', place: 'Watch Granary' },
    { name: 'East Bluff Wolves', giver: 'Fenna', goal: 'hunt the starved crag wolves off the east bluff', target: '4 crag wolves', reward: '200 marks', foe: 'Starved Crag Wolf', place: 'East Bluff' },
    { name: 'Culvert Leeches', giver: 'Fenna', goal: 'scrape the sluice leeches off the north culvert grate', target: '8 sluice leeches', reward: '120 marks', foe: 'Sluice Leech', place: 'North Culvert' },
    { name: 'Lost Ferry Bell', giver: 'Marrit', goal: 'find the ferry bell lost in the reeds', target: 'the ferry bell', reward: '30 marks', foe: null, place: 'Inspection Quay' },
    { name: 'Salt Crew Debt', giver: 'Ketter', goal: 'make the salt crew pay what they owe', target: 'the salt crew', reward: '40 marks', foe: 'Salt-crew Tough', place: 'Salt-and-Ash Yard' },
];
const FOES = ['Cellar Rat Swarm', 'Starved Crag Wolf', 'Sluice Leech', 'Salt-crew Tough', 'River Drake', 'Crag Wolf Matriarch', 'Bog Lurker'];
const SKILLS = ['stealth', 'athletics', 'perception', 'persuasion', 'insight', 'lockpicking', 'DEX', 'STR', 'survival', 'intimidation'];
const WORLD = ['Hill Rains', 'Confederacy Levy', 'Salt Tax Riots', 'Auvoth Depth Tremors', 'Frontier Road Closure', 'Wolf Winter'];
const FACTIONS = ['Adventurer Guild', 'River Confederacy', 'Salt Crew', 'Bluewatch Watch', 'Hulkrow Collectors', 'Lantern Monks'];
const MONTHS = ['Goldwane', 'Haywane', 'Emberwane'];
const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
const CONSUMABLES = ['Minor Healing Draught', 'Healing Salve', 'Bandage', 'Common Antidote', 'Hot Meal', 'Coarse Bread', 'Trail Rations', 'Common Ale'];
const CONDITIONS = ['poisoned', 'bleeding', 'exhausted', 'frightened', 'chilled'];
const METERS = ['trust', 'affection', 'desire', 'tension'];
const MEETERS = ['Fenna', 'Marrit', 'Hollis', 'Old Tamsin', 'Sella the sealer', 'Watch-Captain Rorke', 'Ketter'];
// Beta (wave B–E) material: Ersveil pack recipes (examples/packs/ersveil-bluewatch, SB-packs2), worn gear, effects.
const RECIPES = [
    { name: 'Leech-salt Pouch', with: 'Coarse Salt x2, Burlap Sack' },
    { name: 'Pitch Torches', with: 'Lamp Oil, Burlap Sack' },
    { name: 'Camp Stew', with: 'Trail Rations, Coarse Bread', at: 'campfire' },
    { name: 'Healing Salve', with: 'Bluecap Moss x2, Lamp Oil' },
    { name: 'Wolf-pelt Mantle', with: 'Crag Wolf Pelt x3' },
];
const GEAR = ['Cane-Blade', 'Spear', 'Hatchet', 'Iron Cap', 'Wolf-pelt Mantle'];
const EFFECTS = [['Keen Sight', 'sharper eyes', 'perception'], ['Steady Hands', 'the shakes are gone', 'DEX'], ['Wolf Fever', 'a hot, aching bite', 'attack'], ['Soaked Through', 'cold to the bone', 'defence'], ['Salt Courage', 'the sealer\'s blessing', 'check']];
const LOOT = ['Bent Copper Key', 'Lamp Oil', 'Torn Map', 'Rusty Nails', 'Coarse Salt', 'Burlap Sack', 'Crag Wolf Fang', 'Small Monster Core', 'Waterskin'];
const BOSSES = ['Crag Wolf Matriarch', 'Bog Lurker', 'River Drake'];

const OPENERS = [
    'Rain needles off the palisade and the brazier smoke lies flat over the roofs.',
    'The quay smells of tar, wet rope and fish guts.',
    'Lamplight leaks through the shutters of the Stray Oar.',
    'A gull screams from the signal tower and the chain across the river-gate groans.',
    'Mud sucks at your boots on the storehouse lane.',
    'The Guild office is one room, a board and a counter scarred by a hundred knives.',
    'North of the tower there is nothing but grey, and everyone keeps glancing that way.',
    'Somewhere behind the salt sheds a dog will not stop barking.',
];
const MIDDLES = [
    '{npc} looks you over the way a buyer looks at a mule, then decides you will do.',
    '"You are the one with the stick," {npc} says. It is not a question.',
    '{npc} counts something under their breath and loses the count when you come close.',
    'The ledger on the counter is open at a page full of crossed-out names.',
    'Two watchmen go past with a handcart, and whatever is under the sacking is leaking.',
    '{npc} tells you about the north road, the levy and the price of salt, in that order and at length.',
    'Your walking stick taps the boards. Nobody asks about it, which means everybody noticed.',
    'The wind brings the smell of the bluff: pine resin and something dead.',
];
const CLOSERS = [
    'What do you do?',
    'The moment hangs there, waiting for you.',
    '{npc} waits for your answer.',
    'Outside, the bell of the river-gate counts the hour.',
];
const USER_LINES = [
    'I look around and listen.', 'I ask {npc} what is going on.', 'I check my gear.', 'I walk over to the board.',
    'I keep my hand near the stick and wait.', 'I head to {place}.', 'I buy a round and listen to the talk.',
    'I try to slip past without being seen.', 'I rest for a while.', 'I ask about work.',
];

// Hostile payloads (strings only; never executed by the driver).
const HOSTILE_NAMES = [
    '<img src=x onerror="window.__pwned=1">', '<script>window.__pwned=2</script>', '__proto__', 'constructor', 'prototype',
    '{{user}}', '{{char}}', '<USER>', '"; DROP TABLE items; --', '‮gnirts desrever', 'Zero​width​Name',
    'a'.repeat(3000), '../../../etc/passwd', 'javascript:alert(1)', '</Changes>', '<!-- STORY_SUITE_V2', '-->', '\u0000nul', '😈🔥 Emoji Blade 🗡️',
    'Name | qty: 999999', '~ item Gold', 'toString', 'hasOwnProperty', '$&$1', '${7*7}', '<style>body{display:none}</style>',
];
const HOSTILE_NUMBERS = ['999999999', '-50', '1e308', 'NaN', 'Infinity', '-0', '0x7fffffff', '9007199254740993', '1.5', '3/0', '', ' ', '١٢', '99999999999999999999999'];

export function createGen(seed = 1) {
    const r = rng(seed);
    const pick = list => list[Math.floor(r() * list.length)];
    const chance = p => r() < p;
    const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    let clockDay = 12;
    let clockMin = 6 * 60 + 40;
    const stats = { lines: 0, valid: 0, sloppy: 0, hostile: 0, kinds: {}, noBlock: 0, nsd: 0, nsdBad: 0 };

    const dateText = (addMin = 0) => {
        const total = clockMin + addMin;
        const day = clockDay + Math.floor(total / 1440);
        const m = ((total % 1440) + 1440) % 1440;
        let h = Math.floor(m / 60); const mm = m % 60; const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
        return `${MONTHS[0]} ${Math.min(day, 30)}, ${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`;
    };
    const drift = name => (DRIFT[name] && chance(0.6) ? pick(DRIFT[name]) : name.toLowerCase());

    // ---- valid line makers: each returns { kind, line } -------------------------------------------
    function valid(h, plan) {
        const q = plan.quest;
        const makers = [
            () => ({ kind: 'place', line: (() => { const p = pick(PLACES); return `~ place ${p}${PLACE_KIND[p] ? ` | kind: ${PLACE_KIND[p]}` : ''}`; })() }),
            () => ({ kind: 'present', line: `+ present ${pick(NPCS)}` }),
            () => ({ kind: 'present', line: h.present?.length ? `- present ${pick(h.present)}` : `+ present ${pick(NPCS)}` }),
            () => ({ kind: 'item', line: `+ item ${pick(chance(0.6) ? PACK_ITEMS : STORY_ITEMS)} | qty: ${int(1, 3)}${chance(0.3) ? ' | note: found under a loose board' : ''}` }),
            () => ({ kind: 'item', line: h.carried?.length ? `- item ${pick(h.carried)} | qty: 1` : `+ item ${pick(PACK_ITEMS)} | qty: 1` }),
            () => ({ kind: 'item', line: h.carried?.length ? `~ item ${pick(h.carried)} | note: ${pick(['scuffed', 'wet through', 'freshly oiled', 'chipped at the edge'])}` : `+ item Torch | qty: 2` }),
            () => ({ kind: 'coin', line: `+ coin ${int(1, 25)} | from: ${pick(NPCS)}` }),
            () => ({ kind: 'coin', line: `- coin ${int(1, Math.max(1, Math.min(15, h.wallet ?? 5)))} | to: ${pick(['the Stray Oar', 'Watch Stores', 'Sella the sealer', 'a ferryman'])}` }),
            () => ({ kind: 'hook', line: `+ hook ${q.name} — ${q.goal} | giver: ${q.giver} | reward: ${q.reward}` }),
            () => ({ kind: 'quest', line: `~ quest ${pick(h.quests?.length ? h.quests : [q.name])} | step: ${pick(['asked around the granary', 'found tracks by the culvert', 'counted the wolves from the tower', 'the cellar is half clear'])}` }),
            () => ({ kind: 'encounter', line: `! encounter ${int(1, 4)} ${q.foe ?? pick(FOES)} — ${pick(['boiling out of the dark', 'circling at the treeline', 'rising out of the sluice'])} | tier: ${pick(['trivial', 'weak', 'even', 'strong'])} | stakes: normal` }),
            () => ({ kind: 'check', line: `? check ${pick(SKILLS)} — ${pick(['slipping past the gate guard', 'climbing the wet palisade', 'talking the inspector down', 'spotting the tripwire'])} | dc: ${pick(['easy', 'normal', 'hard', String(int(8, 20))])}${chance(0.5) ? ` | roll: ${int(1, 20)} | result: ${pick(['success', 'failure'])}` : ''}` }),
            () => ({ kind: 'join', line: `+ join ${pick(['Brannoc', 'Ysolde', 'Dov'])} — ${pick(['a hired spear with debts', 'a runaway acolyte', 'a quay brat who knows every alley'])} | level: ${int(1, 6)} | role: ${pick(['guard', 'scout', 'healer'])}` }),
            () => ({ kind: 'leave', line: h.companions?.length ? `- leave ${pick(h.companions)} — ${pick(['owes money upriver', 'had enough of wolves'])}` : `+ present ${pick(NPCS)}` }),
            () => ({ kind: 'rest', line: `! rest ${pick(['short', 'long'])} — ${pick(['by the brazier at the Stray Oar', 'under the salt shed eaves', 'in a rented cot'])}` }),
            () => ({ kind: 'wound', line: `~ wound Wessel — ${pick(['a rat bite on the calf', 'a slip on the wet stones', 'a fist in the ribs'])} | harm: ${pick(['scratch', 'wound'])}` }),
            () => ({ kind: 'wound', line: `~ wound Wessel — ${pick(['the sealer binds the cut', 'a hot meal and sleep'])} | heal: ${pick(['scratch', 'wound'])}` }),
            () => ({ kind: 'skill', line: `+ skill Wessel — ${pick(['River Sense', 'Quick Knot', 'Rope Climb'])}: ${pick(['reads currents and weather', 'ties fast knots under stress'])} | taught by: ${pick(['Marrit', 'Old Tamsin'])}` }),
            () => ({ kind: 'time', line: `! time +${pick(['20m', '1h', '2h', '30m', '3h'])}` }),
            () => ({ kind: 'time', line: `~ time ${dateText(int(10, 180))}` }),
            () => ({ kind: 'clock', line: `+ clock ${pick(['Culvert Backs Up', 'Levy Collectors Arrive', 'Wolves Grow Bold'])} — ${pick(['the lane floods', 'the Watch empties the granary'])} | due: ${dateText(int(600, 3000))} | shown: ${pick(['none', 'sign', 'warning'])}` }),
            () => ({ kind: 'route', line: `+ route ${pick(PLACES)} — ${pick(PLACES)} | hours: ${int(1, 9)} | kind: ${pick(['road', 'river', 'trail'])}` }),
            () => ({ kind: 'landmark', line: `+ landmark ${pick(['Drowned Shrine', 'Split Oak', 'Old Salt Kiln', 'Weir Stones'])} | region: ${pick(['River Confederacy', 'the north marches'])} | kind: ${pick(['ruin', 'cave', 'shrine'])}` }),
            () => ({ kind: 'world', line: `+ world ${pick(WORLD)} — ${pick(['the hills are drowning', 'the levy takes every second son', 'the depths shake at night'])} | state: ${pick(['looming', 'ongoing'])} | place: ${pick(['the northern hills', 'Auvoth', 'the river'])} | factions: ${pick(FACTIONS)}` }),
            () => ({ kind: 'world', line: `~ world ${pick(WORLD)} — ${pick(['it spreads south', 'it eases for a day', 'the Watch posts notices about it'])}` }),
            () => ({ kind: 'faction', line: `+ faction ${pick(FACTIONS)} — ${pick(['merchants who own the river', 'the law at the edge of the map', 'debt collectors with long memories'])} | area: ${pick(['Bluewatch', 'the river', 'Hulkrow'])} | stance: ${pick(['wary', 'friendly', 'hostile', 'neutral'])}` }),
            () => ({ kind: 'agenda', line: `+ agenda ${pick(['Hulkrow Collector', 'Ketter', 'Watch-Captain Rorke'])} — ${pick(['asking about a runaway bondsman', 'buying up salt'])} | now: ${pick(PLACES)} | then: ${pick(['comes to Bluewatch', 'leaves on the barge'])} | on: ${dateText(int(300, 2000))}` }),
            () => ({ kind: 'beat', line: `+ beat ${pick(['The Collector Arrives', 'Flood Night', 'Wolf Moon'])} — ${pick(['a man in a good coat steps off a barge', 'the culvert gives way'])} | on: ${dateText(int(600, 3000))}` }),
            () => ({ kind: 'secret', line: `+ secret ${pick(['The Bond Name', 'The Cane-Blade', 'Fenna\'s Debt'])} — ${pick(['Wessel signed a bond under another name', 'the stick hides a blade'])}` }),
            () => ({ kind: 'event', line: `+ event ${pick(['Market Day', 'Levy Count', 'Drowned Bell'])} — ${pick(['stalls on the quay', 'the Watch counts heads'])} | on: ${dateText(int(200, 2000))}` }),
            // ---- beta kinds ----
            () => ({ kind: 'use', line: `! use ${pick(h.consumables?.length ? h.consumables : CONSUMABLES)} | on: ${pick(h.party?.length ? h.party : ['Wessel'])}${chance(0.3) ? ` | by: ${pick(h.party?.length ? h.party : ['Wessel'])}` : ''}${chance(0.3) ? ' | qty: 1' : ''}` }),
            () => ({ kind: 'market', line: chance(0.6) ? `! market ${pick(['Bluewatch Village', 'Glassdock', 'Auvoth'])} — ${pick(['no salt to be had', 'the levy took the grain', 'lamp oil ran out'])} | until: ${dateText(int(600, 4000))}` : `~ market ${pick(['Bluewatch Village', 'Glassdock', 'Auvoth'])} — ${pick(['barges brought salt again', 'supplies back'])}` }),
            () => ({ kind: 'check', line: `? check ${pick(SKILLS)} — ${pick(['slipping past the gate guard', 'climbing the wet palisade', 'talking the inspector down', 'spotting the tripwire'])} | dc: ${pick(['easy', 'normal', 'hard', String(int(8, 20))])} | roll: ${pick(['1', '2'])} | result: ${pick(['success', 'cost', 'fail'])}${h.companions?.length && chance(0.3) ? ` | who: ${pick(h.companions)}` : ''}` }),
            () => ({ kind: 'wound', line: `~ wound ${pick(h.party?.length ? h.party : ['Wessel'])} — ${chance(0.6) ? pick(CONDITIONS) : `cure ${pick(CONDITIONS)}`}` }),
            () => ({ kind: 'npc', line: `~ npc ${pick(h.present?.length ? h.present : MEETERS)} | ${pick(METERS)}: ${pick(['+', '-'])}${int(1, 12)}${chance(0.3) ? ` | ${pick(METERS)}: ${pick(['+', '-'])}${int(1, 6)}` : ''}` }),
            () => ({ kind: 'npc', line: `~ npc ${pick(MEETERS)} | meter: ${pick(['+', '-'])}${int(1, 9)}` }),
            () => ({ kind: 'quest', line: `~ quest ${pick(h.quests?.length ? h.quests : [q.name])} | progress: ${pick(['two rats left', 'the trail goes cold at the weir', 'half the leeches scraped', 'Marrit pointed at the reeds'])}` }),
            () => ({ kind: 'encounter', line: `! encounter ${int(1, 3)} ${q.foe ?? pick(FOES)} — ${pick(['out of the reeds', 'blocking the lane'])} | rank: ${pick(RANKS.slice(0, 4))} | stakes: normal` }),
            () => ({ kind: 'place', line: `~ place ${pick(PLACES)} | region: ${pick(['the River Confederacy', 'the north marches'])}${h.companions?.length ? ` | with: ${pick(h.companions)}` : ''}` }),
            () => ({ kind: 'landmark', line: `+ landmark ${pick(['Sunken Cistern', 'Old Salt Mine', 'Leech Warren'])} | region: ${pick(['under Bluewatch', 'the north marches'])} | kind: ${pick(['cave', 'ruin'])} | plane: underground` }),
            () => ({ kind: 'beat', line: `+ beat ${pick(['Ambush at the Weir', 'Wolves at the Gate'])} — ${pick(['the matriarch leads the pack down', 'toughs wait in the reeds'])} | on: ${dateText(int(600, 3000))} | encounter: ${int(2, 4)} ${pick(FOES)} | reach: ${pick(['the road north closes', 'the Watch owes Wessel'])}` }),
            () => ({ kind: 'route', line: `- route ${pick(PLACES)} — ${pick(PLACES)}` }),
            () => ({ kind: 'world', line: `- world ${pick(WORLD)} — ${pick(['the rains stop', 'the levy is paid', 'the riots burn out'])}` }),
            () => ({ kind: 'faction', line: `~ faction ${pick(FACTIONS)} | stance: ${pick(['wary', 'friendly', 'hostile', 'neutral'])}` }),
            () => ({ kind: 'quest', line: `- quest ${pick(h.quests?.length ? h.quests : [q.name])} — ${pick(['failed', 'abandoned'])}` }),
            () => ({ kind: 'loot', line: `? loot ${Array.from({ length: int(1, 4) }, () => { const n = pick(LOOT); return chance(0.3) ? `${n} x${int(2, 4)}` : n; }).join(', ')} — ${pick(['on the cellar shelf', 'in the wolf den', 'under the culvert grate', 'in a drowned man\'s pack'])}` }),
            () => ({ kind: 'wear', line: `~ item ${pick(h.carried?.length ? h.carried : GEAR)} — ${pick(['torn by brambles', 'nicked on a wolf\'s skull', 'soaked in the sluice', 'scraped on the quay stones'])} | wear: ${pick(['scuff', 'scuff', 'tear', 'ruin'])}` }),
            () => { const rc = pick(RECIPES); return { kind: 'craft', line: `! craft ${rc.name} | with: ${rc.with} | by: Wessel${chance(0.6) ? ` | roll: ${pick(['1', '2'])} | result: ${pick(['fail', 'made', 'fine', 'masterwork'])}` : ''}${rc.at ? ` | at: ${rc.at}` : ''}` }; },
            () => { const [n, note, on] = pick(EFFECTS); return { kind: 'effect', line: `+ effect ${n} — ${note} | on: ${on} | for: ${pick(['20m', '1h', '2h', '3 replies', '1 reply'])} | who: ${pick(['Wessel', ...(h.companions ?? [])])} | kind: ${pick(['buff', 'debuff'])}` }; },
            () => ({ kind: 'effect', line: `- effect ${pick(EFFECTS)[0]} | who: Wessel` }),
            () => ({ kind: 'encounter', line: `! encounter 1 ${pick(FOES)} — ${pick(['alone on the ridge', 'blocking the culvert', 'waiting at the ford'])} | tier: ${pick(['weak', 'even', 'strong'])} | stakes: normal` }),
            () => ({ kind: 'encounter', line: `! encounter 1 ${pick(BOSSES)} — ${pick(['the thing the wolves follow', 'the old terror of the sluice'])} | tier: ${pick(['even', 'strong', 'deadly'])} | stakes: normal | boss: yes` }),
            () => ({ kind: 'encounter', line: `! encounter ${int(2, 5)} ${pick(FOES)} — ${pick(['a mixed pack', 'what the levy left behind'])} | tier: ${pick(['weak', 'even', 'strong'])} | stakes: normal` }),
            () => ({ kind: 'item', line: `~ item ${pick(h.carried?.length ? h.carried : GEAR)} | equip: ${pick(['Wessel', ...(h.companions ?? []), 'Brannoc'])}` }),
            () => ({ kind: 'time', line: `! time +${pick(['14h', '20h', '26h', '1d'])}` }),
            () => ({ kind: 'quest', line: `+ quest ${pick(QUESTS).name} — ${pick(QUESTS).goal} | giver: ${pick(['Fenna', 'Marrit'])} | rank: ${pick(['F', 'E', 'D'])}` }),
        ];
        // Arc-specific lines first (a quest being taken or turned in this reply).
        if (plan.take) return { kind: 'quest', line: `+ quest ${q.name} — ${q.goal} | giver: ${q.giver} | goal: ${q.target ? `kill ${q.target}` : q.goal} | reward: ${q.reward}${chance(0.5) ? ` | rank: ${pick(RANKS.slice(0, 3))}` : ''}` };
        if (plan.turnIn) return { kind: 'quest', line: `- quest ${plan.turnIn} — turned in` };
        if (plan.met) return { kind: 'quest', line: `~ quest ${plan.met} | met: yes` };
        return pick(makers)();
    }

    // ---- sloppy: drift, typos, wrong kinds, wrong ops, wrong labels --------------------------------
    function sloppy(h, plan) {
        const base = valid(h, plan).line;
        const variants = [
            () => base.replace(/^([+\-~!?]) (\w+)/, (m, op, kind) => `${op} ${kind.slice(0, -1) + kind.slice(-1).repeat(2)}`), // typo kind
            () => base.replace(/^([+\-~!?]) item/, '$1 itme').replace(/^([+\-~!?]) quest/, '$1 quset').replace(/^([+\-~!?]) place/, '$1 palce'),
            () => base.replace(' — ', ' - '),
            () => base.replace(' — ', ' -- '),
            () => base.replace(/ \| /g, ' |'),
            () => base.replace(/\| (\w+):/g, (m, l) => `| ${l[0].toUpperCase()}${l.slice(1)}:`),
            () => base.replace(/qty: \d+/, `qty: ${pick(['two', 'a few', 'x2', '2 pcs', 'one'])}`),
            () => base.replace(/^\+/, '!').replace(/^~/, '+'),                    // wrong op
            () => `* ${base}`,                                                     // markdown bullet
            () => `- ${base}`,
            () => `${base}.`,
            () => base.replace(/(Fenna|Marrit|Brannoc|Watch-Captain Rorke)/, m => drift(m)),
            () => `+ npc ${pick(NPCS)} | trust: +${int(1, 5)}`,                    // kinds nobody keeps
            () => `~ npc ${pick(NPCS)} | meter: +${int(1, 9)}`,
            () => `+ gold ${int(5, 40)}`,
            () => `+ money ${int(1, 9)} silver | from: ${pick(NPCS)}`,
            () => `+ coin ${int(2, 9)} silver | from: ${pick(NPCS)}`,
            () => `+ coin three | from: ${pick(NPCS)}`,
            () => `~ hp Wessel | -5`,
            () => `+ xp 50`,
            () => `~ quest ${drift('Fenna')}'s job | step: done`,
            () => `- quest ${pick(QUESTS).name.toLowerCase()} — done`,
            () => `+ quest ${pick(QUESTS).name}`,                                  // no goal (F82)
            () => `! encounter wolves`,
            () => `! encounter ${int(2, 5)} ${pick(FOES)}s — attack | tier: medium`,
            () => `? check — sneaking | dc: very hard`,
            () => `? check stealth | roll: 25 | result: success`,
            () => `~ time tomorrow morning`,
            () => `! time +2 hours`,
            () => `~ place ${pick(PLACES).toUpperCase()} | kind: Settlement`,
            () => `+ item ${pick(PACK_ITEMS).toLowerCase()}s | qty: 1`,
            () => `- item ${pick(STORY_ITEMS)} | qty: 1`,                         // not carried
            () => `+ route ${pick(PLACES)} to ${pick(PLACES)} | hours: two`,
            () => `+ world ${pick(WORLD)} | state: maybe`,
            () => `+ faction ${pick(FACTIONS)} | stance: 7`,
            () => `+ join ${pick(NPCS)} | level: high`,
            () => `! rest overnight`,
            () => `~ wound Wesel — bruised | harm: bruise`,
            () => `+ present ${pick(NPCS)}, ${pick(NPCS)} and ${pick(NPCS)}`,
            () => `! craft Iron Cap | with: Crag Wolf Pelt, Small Monster Core`,  // not on v2 yet: unknown kind
            () => `~ cond Wessel | poisoned`,
            () => `~ wear Spear | -1`,
            () => `! use ${pick(STORY_ITEMS)} | on: Wessel`,                  // not a consumable / not carried
            () => `! use Minor Healing Draught`,                                  // no on:
            () => `? check stealth — x | dc: normal | roll: 3 | result: success`, // only two rolls handed over
            () => `~ npc ${pick(MEETERS)} | trust: high`,
            () => `~ npc ${pick(MEETERS)} | stage: smitten`,                       // stages are code's
            () => `~ quest ${pick(QUESTS).name} | rank: S`,
            () => `! market — nothing`,
            () => `Changes: + item Torch`,
            () => `   `,
            () => `+`,
            () => `? loot`,                                                        // beta kinds, sloppy
            () => `? loot ${pick(LOOT)}; ${pick(LOOT)} and ${pick(LOOT)}`,
            () => `! loot ${pick(LOOT)} x2 — on the floor`,
            () => `~ item ${pick(GEAR)} | wear: ${pick(['scratched', 'broken', 'Tear', '2'])}`,
            () => `~ item ${pick(GEAR)} | cond: ${pick(['50%', 'worn', '3/4'])}`,
            () => `! craft ${pick(RECIPES).name.toLowerCase()}`,
            () => `! craft ${pick(RECIPES).name} | result: masterwork`,
            () => `! craft Iron Sword | with: Iron Ore x2 | by: Wessel`,         // unknown recipe
            () => `+ effect ${pick(EFFECTS)[0]} | for: two hours`,
            () => `+ effect ${pick(EFFECTS)[0]} — x | on: luck | for: 2h | who: Wesel`,
            () => `! encounter 1 ${pick(BOSSES)} | boss: maybe`,
            () => `~ item ${pick(GEAR)} | equip: on`,
        ];
        return pick(variants)();
    }

    // ---- hostile: injections, numbers out of rules, minting, prototype keys, huge input ------------
    function hostile(h) {
        const n = pick(HOSTILE_NAMES);
        const num = pick(HOSTILE_NUMBERS);
        const variants = [
            () => `+ item ${n} | qty: ${int(1, 3)}`,
            () => `+ item ${pick(PACK_ITEMS)} | qty: ${num}`,
            () => `+ coin ${num} | from: ${pick(NPCS)}`,
            () => `+ coin ${pick(['999999', '50000', '1000000000'])} | from: the dragon hoard`,
            () => `- coin -${int(100, 9999)} | to: ${pick(NPCS)}`,
            () => `+ present ${n}`,
            () => `~ place ${n} | kind: ${n}`,
            () => `+ quest ${n} — ${n} | giver: ${n} | goal: ${n} | reward: ${pick(['9999999 marks', '1000000 gold', 'every coin in Ersveil'])}`,
            () => `- quest ${pick(QUESTS).name} — done | reward: 5000 marks`,
            () => `~ quest ${pick(QUESTS).name} | met: yes`,                       // claim met without doing it
            () => `! encounter 999 ${pick(FOES)} — the horde | tier: deadly | stakes: death`,
            () => `! encounter ${num} ${n} | tier: ${n}`,
            () => `? check stealth — ${n} | dc: ${num} | roll: 20 | result: critical success`,
            () => `? check ${n} — x | dc: -100`,
            () => `+ join ${n} — ${n} | level: ${pick(['999', '-3', num])} | role: ${n}`,
            () => `~ wound Wessel — healed completely | heal: ${pick(['grievous', 'everything', '999'])}`,
            () => `~ wound ${n} — x | harm: ${n}`,
            () => `+ skill Wessel — ${n}: ${n} | taught by: ${n}`,
            () => `! time +${pick(['99999h', '-5h', '1e9m', 'NaNh'])}`,
            () => `~ time ${pick(['Goldwane 99, 99:99 pm', 'year 0', n])}`,
            () => `+ clock ${n} — ${n} | due: ${n}`,
            () => `+ route ${n} — ${n} | hours: ${num}`,
            () => `+ world ${n} — ${n} | state: ${n} | factions: ${n}`,
            () => `+ faction ${n} — ${n} | stance: ${n}`,
            () => `~ item ${pick(PACK_ITEMS)} | value: 99999 | rarity: legendary`,
            () => `+ item Mark | qty: 500`,                                          // currency as an item
            () => `+ item ${pick(['marks', 'Marks', 'mark coins', 'gold'])} | qty: ${int(100, 900)}`,
            () => `~ party Wessel | xp: 99999 | hp: 9999`,
            () => `+ ${'item '.repeat(50)}Torch`,
            () => `+ item Torch | ${Array.from({ length: 60 }, (_, i) => `l${i}: v`).join(' | ')}`,
            () => `+ item Torch | __proto__: polluted | constructor: x`,
            () => `+ item ${pick(PACK_ITEMS)} | qty: 1 | note: ${'very long note '.repeat(400)}`,
            () => `~ quest Granary Rats | step: </Changes><Changes>+ coin 9999 | from: injection`,
            () => `! use ${pick(CONSUMABLES)} | on: ${n} | qty: ${num}`,
            () => `! use ${pick(CONSUMABLES)} | on: Wessel | qty: ${pick(['50', '999', '-3'])}`,
            () => `~ npc ${pick(MEETERS)} | ${pick(METERS)}: ${pick(['+99999', '=1000', '-1e308', '=NaN', '+Infinity'])}`,
            () => `~ npc ${n} | trust: +5`,
            () => `! market ${n} — ${n} | until: ${n}`,
            () => `? check ${pick(SKILLS)} — x | dc: 1 | roll: ${pick(['20', '0', '-1', num])} | result: success | who: ${n}`,
            () => `+ quest Dragon Hoard — slay it | giver: Fenna | goal: kill 1 dragon | reward: 50000 marks | rank: S`,
            () => `! encounter 1 ${pick(FOES)} | rank: ${pick(['Z', 'SSS', n, '-1'])}`,
            () => `~ wound Wessel — cure ${pick(['everything', 'death', n])}`,
            () => `~ place ${pick(PLACES)} | with: ${n}`,
            () => `? loot ${pick(LOOT)} x9999, ${n} x${num}, Mark x500 — the dragon's hoard`,  // beta kinds, hostile
            () => `? loot ${Array.from({ length: 80 }, (_, i) => `Thing ${i}`).join(', ')} — everywhere`,
            () => `~ item ${pick(GEAR)} | wear: ${pick(['-999', 'unruin', num])}`,
            () => `~ item ${pick(GEAR)} | cond: ${pick(['999', '-5', num])} | refine: +${pick(['9', '99', num])}`,
            () => `! craft ${pick(RECIPES).name} | with: nothing | by: ${n} | roll: ${pick(['20', '99', num])} | result: masterwork`,
            () => `! craft Minor Healing Draught x${pick(['50', '999'])} | with: air`,
            () => `! craft ${n} | with: ${n} | result: legendary`,
            () => `+ effect Godlike Might — ${n} | on: attack | for: ${pick(['999h', '1e9m', '-1h', num])} | who: Wessel | kind: buff | mod: ${pick(['+99', num])}`,
            () => `+ effect ${n} — ${n} | on: ${n} | for: 2h | who: ${n}`,
            () => `! encounter 1 ${pick(BOSSES)} | tier: deadly | stakes: death | boss: yes | level: ${pick(['999', num])}`,
            () => `! encounter ${num} ${pick(FOES)} | boss: yes`,
            () => `~ item ${pick(GEAR)} | equip: ${n}`,
            () => `+ quest ${pick(QUESTS).name} — x | giver: Fenna | rank: ${pick(['S', 'SSS', n])} | reward: 3000 marks`,
        ];
        return pick(variants)();
    }

    function nsdBlock(h) {
        const who = (h.present?.length ? h.present : NPCS).filter(name => !/inspector|quartermaster/i.test(name));
        const name = pick(who.length ? who : ['Fenna']);
        const npc = {
            name, present: chance(0.8), role: pick(['guild clerk', 'bargemaster', 'watchman', 'sealer', 'hired spear']),
            mood: pick(['wary', 'tired', 'amused', 'irritated']),
            relationshipImpact: pick(['none', 'minor', 'meaningful']),
            relationshipDelta: { trust: int(-2, 3), affection: int(-1, 2), desire: 0, tension: int(-2, 2) },
            relationshipEvidence: { trust: `${name} lets Wessel see the ledger.`, affection: '', desire: '', tension: '' },
            relationshipChangeReason: `${name} warms a little to Wessel.`,
        };
        const roll = r();
        stats.nsd += 1;
        if (roll < 0.75) return `\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: [npc], relationshipsCovered: true })}\n-->`;
        stats.nsdBad += 1;
        const bad = [
            `\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: [npc] }).slice(0, int(10, 80))}`,                 // cut off
            `\n\n<!--npc_state_delta\n{npcs: [${name}]}\n-->`,                                                      // not JSON
            `\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: [{ ...npc, name: pick(HOSTILE_NAMES), relationshipDelta: { trust: 99999, affection: -99999, desire: 'NaN', tension: 1e308 } }] })}\n-->`,
            `\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: [{ ...npc, __proto__x: 1 }], ['__proto__']: { polluted: true } }).replace('"__proto__x"', '"__proto__"')}\n-->`,
            `\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: Array.from({ length: 6 }, (_, i) => ({ ...npc, name: `Extra ${i}` })) })}\n-->`,
            `\n\n<npc_state_delta>${JSON.stringify({ npcs: [npc] })}</npc_state_delta>`,
        ];
        return pick(bad);
    }

    function changesText(lines, style) {
        const body = lines.join('\n');
        switch (style) {
            case 'lower': return `\n\n<changes>\n${body}\n</changes>`;
            case 'fence': return `\n\n\`\`\`\n<Changes>\n${body}\n</Changes>\n\`\`\``;
            case 'twice': return `\n\n<Changes>\n${body}\n</Changes>\n\n<Changes>\n${lines.slice(0, 1).join('\n')}\n</Changes>`;
            case 'unclosed': return `\n\n<Changes>\n${body}`;
            case 'think': return `\n\n<Changes>\n${body}\n</Changes>`;
            default: return `\n\n<Changes>\n${body}\n</Changes>`;
        }
    }

    // A small story arc state, so quests are offered, taken, fought for and turned in by story.
    const arc = { quest: QUESTS[0], stage: 'idle', since: 0 };

    function next(h = {}) {
        const plan = { quest: arc.quest };
        arc.since += 1;
        // Arc progress: idle → offered (hook) → taken (+ quest) → fight lines → met/turn-in → idle.
        const kinds = [];
        if (arc.stage === 'idle' && chance(0.15)) { arc.quest = pick(QUESTS); plan.quest = arc.quest; arc.stage = 'offered'; arc.since = 0; kinds.push('offer'); }
        else if (arc.stage === 'offered' && arc.since > 1 && chance(0.4)) { arc.stage = 'taken'; arc.since = 0; plan.take = true; kinds.push('take'); }
        else if (arc.stage === 'taken' && arc.since > 2 && chance(0.25)) { arc.stage = 'idle'; plan.turnIn = arc.quest.name; kinds.push('turnin'); }
        else if (arc.stage === 'taken' && !arc.quest.foe && chance(0.2)) { plan.met = arc.quest.name; }
        const npc = pick(h.present?.length ? h.present : NPCS);
        const place = pick(PLACES);
        const fill = s => s.replaceAll('{npc}', npc).replaceAll('{place}', place);
        let user = fill(pick(USER_LINES));
        if (plan.take) user = `I tell ${arc.quest.giver} I will take the ${arc.quest.name} job.`;
        if (plan.turnIn) user = `I go back to ${arc.quest.giver} and report the ${arc.quest.name} job done.`;
        if (kinds.includes('offer')) user = `I ask ${arc.quest.giver} about work.`;

        const paras = [];
        paras.push(pick(OPENERS));
        for (let i = 0, n = int(1, 4); i < n; i += 1) paras.push(fill(pick(MIDDLES)));
        if (chance(0.3)) paras.push(fill(pick(MIDDLES)) + ' ' + fill(pick(MIDDLES)));
        paras.push(fill(pick(CLOSERS)));
        let story = paras.join('\n\n');

        const lines = [];
        const count = chance(0.08) ? 0 : int(1, 7);
        if (kinds.includes('offer')) { lines.push(`+ hook ${arc.quest.name} — ${arc.quest.goal} | giver: ${arc.quest.giver} | reward: ${arc.quest.reward}`); count && stats.valid++; }
        for (let i = 0; i < count; i += 1) {
            const roll = r();
            let line;
            if (roll < 0.7) { line = valid(h, i === 0 ? plan : { quest: plan.quest }).line; stats.valid += 1; }
            else if (roll < 0.9) { line = sloppy(h, { quest: plan.quest }); stats.sloppy += 1; }
            else { line = hostile(h); stats.hostile += 1; }
            const kind = (line.match(/^[+\-~!?*]\s*(\w+)/) ?? [])[1] ?? '?';
            stats.kinds[kind] = (stats.kinds[kind] ?? 0) + 1;
            lines.push(line);
        }
        if (plan.take && !lines.some(l => l.startsWith('+ quest'))) lines.unshift(valid(h, { quest: plan.quest, take: true }).line);
        if (plan.turnIn && !lines.some(l => l.startsWith('- quest'))) lines.unshift(`- quest ${plan.turnIn} — turned in`);
        stats.lines += lines.length;
        const styleRoll = r();
        const style = styleRoll < 0.9 ? 'normal' : pick(['lower', 'fence', 'twice', 'unclosed', 'think']);
        let reply = story;
        if (style === 'think') reply = `<think>\nThe reader wants action. Maybe:\n<Changes>\n+ coin 500 | from: thinking\n</Changes>\n</think>\n${reply}`;
        if (lines.length) reply += changesText(lines, style);
        else stats.noBlock += 1;
        if (chance(0.35)) reply += nsdBlock(h);
        return { user, reply, meta: { lines: lines.length, style, take: Boolean(plan.take), turnIn: plan.turnIn ?? null, offer: kinds.includes('offer') } };
    }

    return { next, stats, rnd: r, pick, chance, int };
}
