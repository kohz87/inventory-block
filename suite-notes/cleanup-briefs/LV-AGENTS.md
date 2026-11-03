# LV agents (each reads LV-CONTRACT.md first)

## LV-A — Character level, XP, cap, roll term (branch `stage51/lv-character`, clone $S/lva/)
templates.js Character (Standard + Classic), names.js `LEVEL`, formula.js / standard.js / resolve.js party roll term,
the rise rules, the odds math in Settings → RPG (numbers only), New character defaults (level 1), `rpgLevelCap`
setting + schema, the planner party list ("Astra (Lv 14)"). Tests: level-up at 100 with carry, points every 3 levels,
cap holds xp at 100, roll term floor(level/5) both formulas, Custom divisor, old rolls replay.

## LV-B — Foes by level (branch `stage51/lv-foes`, clone $S/lvb/)
templates.js Foes, open.js (`foe X | new | count | level|rank`), precall.js (both heads: foe lines may give level or
rank; foes listed with level), resolve.js foe term + Standard Health `4 + floor(level/30)`, narrator set-slot
`level:`/`rank:`, seeded random level (band / party average ±2). Use LV-C's `rpg.rank` contract (if LV-C's file is not
there yet, put a small local band lookup behind the same signature and say so). Tests: each source of level, seeding
(swipe vs Re-read), Health by level, clamps, old rolls replay.

## LV-C — Ranks + fight XP by level gap (branch `stage51/lv-ranks-xp`, clone $S/lvc/)
New src/v2/lean-rpg/levels.js (`levelLabel`, band lookup), `rpg.rank` query, pack `rpg.ranks` validation
(packs/validate.js) and `rpg.levelCap`, fight.js XP per the contract (replaces the class table). Tests: validation
(gaps, overlaps, order, limits), labels with and without ranks, XP table (−10..+10 gap, 0 → no line, 1..60), replay.

## LV-E — Slimmer stored rolls (branch `stage51/lv-slim`, clone $S/lve/)
`rpg.resolve` receipts stop storing the narrator cue text; the cue is rebuilt from the recorded dice/rules when needed
(prompt, Inspector, Re-read). Old receipts with text stay readable unchanged. Measure: bytes of a fight reply's record
before/after on the off-flow / a fight fixture; report the numbers. Look at `spans` size on a fight reply too and
report what it holds and whether it can shrink safely (change it only if clearly safe and tested).
Tests: prompt bytes identical for a fight before/after (the cue sent must be byte-identical), replay equal.

## LV-F — Load the RPG code only when it is on (branch `stage51/lv-lazy`, clone $S/lvf/)
Story Block registers the lean-rpg part only when the feature is on in this chat (or when the chat holds RPG data/
receipts that replay needs — those must still replay exactly). Dynamic import; no behaviour change with the RPG on.
Measure loaded JS bytes with the RPG off before/after (report). Tests: RPG off loads none of lean-rpg; turning it on
loads it; a chat with RPG receipts replays with the feature off; bootstrap timing tests unchanged.

## LV-G — Ersveil 2.5.0 data (haiku) (branch `stage51/lv-ersveil`, clone $S/lvg/)
examples/packs/ersveil/pack.json: `rpg.ranks` F 1–9, E 10–19, D 20–29, C 30–39, B 40–49, A 50–59, S 60–69, SS 70–79,
SSS 80–99; `rpg.levelCap` 99; any foe/creature content with a class → level per the contract (class n → level
10n−5); the pack's templates if it ships its own Character/Foes templates (Soul Class → Level). Pack version 2.5.0, its
own changelog/README lines, rebuild examples/packs/ersveil.zip with `node scripts/build-example-zip.mjs` (deterministic).
Do NOT edit src/. Tests that pin Ersveil's version/hash: update and name them. The pack must pass validation once LV-C
lands; until then validation may reject `rpg.ranks` — if so, keep the change and report it (the lead merges LV-C first).
