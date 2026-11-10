# Agent G: New character wizard, Skills view, fixed skill stats (Sonnet)

USER approved RPG mockup v6 (31 Oct): https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R, sections 3 and 4 and "How a
skill's roll is defined". Shots and the exact injected markup/CSS:
`/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/mock-rpg/shots/31-skills-*.png`, `41-wizard-*.png`,
scripts `mock-rpg/mock4.mjs` (Skills view) and `mock-rpg/mock5.mjs` (wizard). Build them for real, in Story Block's
own code and styles, matching the shots.

Branch `stage16/rpg-g` from `origin/stage16/lean-rpg` AFTER the lead merges F (the lead gives you the head). Read
COMMON.md for the rules (clone under `scratchpad/rpg-g/`, exact trailer, push only your branch, never merge).

## G1. Data (src/v2/lean-rpg/templates.js, names.js, read.js)
- Character: add `about` (text ≤240, label "Who they are", visible to the AI in the tail).
- Skills: per slot N=1..5: `skillN` (text 40), `aboutN` (text 120, AI-visible), `rankN` (int 0–3, names
  Novice/Adept/Expert/Master, `edit: false`), `practiceN` (0–100, `edit: false`), `statN` (enum of the seven stats),
  `usesN` (enum stamina/mana); plus `who`. 31 fields. Kinds: `learn-N` (labels name, about, stat, uses; sets the
  four), `practice-N` (as now). Rules unchanged.
- read.js: a skill carries `{ name, about, rank, practice, stat, uses }`.
- Keep H's existing tests passing or update them to the new shape (say which).

## G2. Rolls use the skill's stat (lean-rpg/plan.js, precall.js, resolve.js)
- A skilled act or check rolls with the skill's own `stat` and `uses`; the plan's `stat`/`uses` are ignored for it
  (the pre-call prompt asks for a stat only when there is no skill). Unskilled and untrained acts keep the AI's stat
  at rank 0. Pin the formula: d20 + floor(stat/2) + rank + 2×soul + edge. Update the pre-call grammar text and tests.

## G3. Skills view (lean-rpg/view/, replacing F2's "Skills opens the Blocks page")
Mockup section 3: in place of the cards, like Spend points. Per skill: name, rank pill toned by rank, "STAT · Uses",
the description, a 4-cell `ss.meter` mastery bar (segments 4, value rank+1+practice/100, Master full; tone Novice
neutral, Adept info, Expert accent, Master good; text "Expert · 40 / 100 to Master" / "Master"), and "Rolls with it:
d20 +N = STAT v → +v/2 · Rank +r · Soul Class X +2c" from the live sheet. The rank legend pills use the same tones.
Empty slots show the dashed line. The pencil edits only name and description (one multi-field `dm.set`, F1).
Back to the party.

## G4. New character wizard (lean-rpg/view/, SB's dialog mount, `width: 'wide'`)
Opens from "+ New character" on the Party tab and "Create your character" in its empty state. Steps Who · Stats ·
Skills · Review, summary row on top (mockup section 4):
- Who: name (default the persona name), You / A companion (only one "You" per chat), "Who they are" ≤240 with count.
- Stats: the Spend points view's steppers + radar. Creation budget as named constants in names.js (`CREATION`):
  every stat starts at 10, 6 points to spend, a stat may go down to 8 to free a point and up to 15 at creation.
- Skills: template cards (built-in sets in templates.js `SKILL_SETS`: Guild fighter, River scout, Hedge mage, Field
  medic, Silver tongue, each 3 skills with about/stat/uses as in the mockup) plus pack sets (`content.leanRpg.skillSets`,
  ≤12 sets × ≤5 skills, validated in the pack validator, shown "From the <pack> pack"; no Ersveil content change in
  this piece — add a test fixture pack). Rows: name, what it does (≤120), Stat dropdown, Uses dropdown, Starts at
  dropdown (Novice; Adept for at most one skill — the others' Adept option disabled). Up to 5; Add a skill; remove.
  Rank and practice are never typed.
- Review: everything, then Create. Create makes the Character block and the Skills block (role set, `who` set) with
  ONE `dm.define` each, writing the wizard's values as the new definitions' field defaults (no `dm.set`, so rank
  stays `edit:false` and the per-reply budget costs 2). Names "Wessel" and "Wessel's skills", unique slugs. Plain
  errors; nothing half-made on failure (remove the first block if the second define fails).
- Phone: the dialog's bottom sheet; rows stack as in `41-wizard-skills-p.png`.

## Tests
Data shapes and limits (31 fields ≤ 32, kinds ≤ 16); rank/practice reader edits refused; G2 formula and grammar;
Skills view DOM (tones, roll line, empty slot, pencil scope); wizard DOM (steps, budget, one-Adept rule, templates,
pack sets, create = two defines, rollback, one You); live = reload = rebuild after create; feature off ⇒ nothing.
Update docs/v2/LEAN_RPG.md (creation, skills, the roll rule).
