# Agent H: templates and docs (Haiku)

Branch `stage16/rpg-h`. Read COMMON.md first.

Files: `src/v2/lean-rpg/templates.js` (fill `LEAN_RPG_TEMPLATES`), `docs/v2/LEAN_RPG.md` (new), `docs/v2/GUIDE.md`
(one new section, "Lean RPG", linking to LEAN_RPG.md), tests `tests/v2/lean-rpg/templates.test.js` and fixtures
under `tests/v2/lean-rpg/fixtures/`.

Study first: `src/v2/data-modules/schema.js` (`DM_DESCRIPTORS`, `DM_LIMITS`), `check.js`, an existing pack's data
modules (`examples/packs/`), `docs/v2/DATA_MODULES.md`. Each template is `{ name, definition }` where `definition`
is a data-module definition (slug, name, schema, stateVersion, scope 'chat', state, kinds, rules, prompt, plus the
new keys `role`, `names`, `prompt:false`, card and reply-end functions from COMMON.md).

## The four templates
1. **Character** (`role: 'character'`): the fields in COMMON.md, with `names` on `soul` (I–IX), and on
   `health`/`mana`/`stamina` (the `STAGES` words by index). Labels: Health, Mana, Stamina, STR … CHA, Points,
   Soul Class, XP. Kinds the AI can use: `set-health`, `set-mana`, `set-stamina`, `add-xp` (bounded 0–100),
   `set-alive`. Stats and points are reader-set only (no kinds). Rules: `xp ≥ 100 → soul +1 (max 9), xp 0`.
   Button: Rest (stamina and mana to full). Reply-end: the death latch (COMMON/C4). Card: "The story ends here"
   when `alive` is false (tone end). `down` is `prompt: false`.
2. **Skills** (`role: 'skills'`): `who`; five slots `skillN`, `rankN` (names Novice, Adept, Expert, Master),
   `practiceN`. Kinds: `learn-N` (set the name), `practice-N` (add, bounded). Rules: `practiceN ≥ 100 → rankN +1
   (max 3), practiceN 0` for each slot.
3. **Foes** (`role: 'foes'`): four slots `foeN`, `countN`, `classN` (names I–IX), `hurtN` (health stage names).
   Kinds to set a slot, hurt it and clear it.
4. **Combat rules** (`role: 'rules'`): no fields beyond what the schema requires; its "What it is for" prompt
   (≤ 1200 characters) is the [COMBAT SYSTEM] text from SPEC_RPG_v1.md, trimmed to fit, plus one line of XP
   guidance (small fight 5–15, hard fight 20–40, a boss 50+; practice 5–20 per use).
Stay inside the limits: ≤ 16 fields and ≤ 16 kinds per block, every text field `max` ≤ 240.

## Tests
Each template passes `validateDataModules` (this will fail until C's keys exist; write the test against the
COMMON.md shapes and say in your report that it needs C merged), stays under `definitionBytes`, and has the field
keys A and B read. A fixture chat state with Wessel (Soul II, 3 points, Hurt/Fresh/Spent), Ren and Tamsin as in the
mockup, for B's and A's tests.

## Docs
`LEAN_RPG.md` for players and pack authors: turning it on, the Party tab, automatic rolls and the off switch, the
stage bars, how Soul Class and ranks rise, death and undo by swipe, the four templates and how to change them.
Plain words, short sections, no model or vendor names.
