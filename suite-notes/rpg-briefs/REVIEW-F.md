# Review F (1 Nov) — Standard stat formula: Story Block `stage31/fa` b1df710 (includes stage31/fb; base 2.13.0 0a68271)

Claude reviewer agent. Hard rules of suite-notes/ui-briefs/UI-COMMON.md; NO commits or pushes. Read F-COMMON.md, FA.md,
FB.md, the 1 Nov V2_LOG entries (USER decisions: luck window table incl. the softened 9–12 rows, foe Health
4 + class/3, skill costs by code, pack defaults) and docs/v2/RPG.md "The stat formulas".

Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong rules results
(a roll, damage, cost, bar size or turn order that differs from the agreed rules), or leaks a hidden value.

Check at least:
1. `npm run check`, full `npm test`, `git diff --check origin/main`; `node scripts/sim-standard.mjs` runs.
2. Classic byte-identity: prompts, plans, rolls, cue, receipts, data-module hashes vs 2.13.0 (0a68271) on a Classic chat.
3. Standard rules vs the agreed table: every roll type (physical/magic/defence dodge-block-ward/social/check), skill
   stat in the main slot, luck windows at each LUK band, rounding once, foe bonus, foe Health 4 + class/3, hits 1/2,
   area per target, support vs difficulty, skill cost 1 block (and "without the skill" when empty), turn order once per
   fight (ties, late arrivals, beaten-before-turn, groups once, quick start ≥10), bars from blocksFor, new block full
   except Down, stat drop clamps without Down.
4. Replay: swipe rerolls (first reply of a fight rerolls the order; later keeps it), Re-read keeps, delete gives
   blocks back, rebuild == live == reload, across a 3–4 reply fight. Old Classic records replay unchanged.
5. Creation (start 5, 10 points, 3..10), Spend points (4 per Soul Class), companions (`+ party`), Add Combat rules,
   pack defaults shown, Settings → RPG Standard/Classic switch.
6. Browser on your own test ST (port 8178), desktop + phone: a new Standard chat, make a character, fight a Class II
   and a Class IV foe over several replies with the mock LLM the U1/UE agents used, check Party/Fight/battle log/
   hero bars/tail words; console errors.
Report: verdict BLOCK/OK, blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-f/REVIEW.md.
