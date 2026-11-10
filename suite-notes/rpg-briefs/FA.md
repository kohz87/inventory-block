# FA — the roll engine for the Standard formula

Read F-COMMON.md first. Branch `stage31/fa` from `origin/stage31/formula-base`. Test ST port 8176.
You own: rules.js, resolve.js, plan.js, precall.js, cue.js, join.js, start.js, names.js, strings.js (your strings),
the Settings → RPG view and the creation wizard's Stats step, docs/v2/RPG.md (rules sections). FB owns the bars and
blocks (see FB.md); do not edit templates.js, read.js, tail.js or the Party/Fight/hero views.

1. Rules payload: `formula` ('standard' | 'classic') plus Standard's numbers (startStat, createPoints, createMin,
   createMax, pointsPerSoul, statMax, foeBase, foeClassWeight, quickStartMargin) in the recorded rules; a payload with no
   `formula` is Classic (old rolls replay exactly). Settings → RPG: a "Stat formula" card (Standard / Classic) as in the
   mockup, with the roll table and the four numbers; Difficulty presets for Standard (Gentle/Standard/Harsh move foeBase);
   Custom shows Standard's numbers; the odds bar uses the formula in force. Packs may set formula + numbers.
2. Planner (plan.js/precall.js/cue.js): each action carries a type (physical, magic, defence, social, check), an
   optional fitting stat for checks, `area: true` for area skills, `support: true` with a difficulty, `againstMagic` for
   a defence against a spell. Keep the fixed planner prompt as small as possible; Classic chats get the same planner
   output as today (byte-identical prompts).
3. Resolution (resolve.js): Standard rolls use formula.js (statPart, edgeWithLuck, foeBonus); damage 1 block (2 on
   Decisive) applied to the target's bar via the existing change path, clamped to the bar's size (formula.blocksFor
   for characters, foeHealthBlocks for foes); area = one roll vs each target; support vs difficulty heals 1/2 blocks.
   Turn order: rolled once at the fight's start (initiativeBonus / foeInitiativeBonus / turnOrder), kept for the fight
   in recorded state, rerolled on swipe, kept on Re-read; late arrivals roll on entry; quick start; a foe or character
   beaten/Down before its turn does not act; a group acts once. Battle log lines show the formula breakdown as in the
   mockup (e.g. "Physical: d20 17 + (AGI 10 + DEX 6/2)/2 = 6 + Expert 2 + Class II 4 = 29 · vs …").
4. Creation (Stats step) for Standard: start 5, 10 points, 3..10, with the line "Health N blocks (next at VIT …) ·
   Stamina … · Mana … · Luck … (next at LUK …)". Soul Class rises give pointsPerSoul. Companions via `+ party` use
   companionStats. Spend points shows the same next-block/next-luck line.
5. The Combat rules template text explains the roll types for Standard (Classic text unchanged).
6. Simulation: `scripts/sim-standard.mjs` (no network) — success / at a cost / fail and decisive rates for a focused
   and a spread build at Soul Class I, III, V, VII, IX vs same-class and ±1 foes, Gentle/Standard/Harsh, plus how many
   exchanges a same-class fight lasts. Tune foeBase/foeClassWeight so a focused build vs a same-class foe stays near
   today's Classic Standard (Wessel case ≈ 69% success) across classes; report the table and the numbers you chose
   (change STANDARD_NUMBERS only through a new exported preset, keeping formula.js's meaning).
7. Tests for each item; Classic byte-identity tests (prompts, rolls, fingerprints).
