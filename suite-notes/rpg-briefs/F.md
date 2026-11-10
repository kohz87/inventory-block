# Agent F: Lean RPG fix round 1 (Sonnet), from the lead's browser check (31 Oct)

Branch `stage16/rpg-fix1` from `origin/stage16/lean-rpg` (head 1072b07: C, H, A, B merged; suite 3775 pass).
Read COMMON.md for the rules. Shots of the check: `/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/bc270/shots/rpg-*.png`
(approved mockup: `.../scratchpad/mock-rpg/shots/21-party-*.png`, `11-stats-bars-*.png`).

## F1. Spend points save hits the per-reply cap (blocker)
A reply carries at most `DM_LIMITS.replyRoots` (32) data-module actions (`part.js` `finish`). The sheet
(`lean-rpg/view/distribute.js`) saves one `dm.set` per changed stat plus `points`, so one save costs up to 8; with
the reader's other edits on the same reply it fails with "Character: Data module reply budget exhausted; nothing
applied." (seen live after setting up a 3-character party).
- Add a multi-field form to `dm.set`: `{ module, fields: { <field>: value, … }, who? }` (non-map fields of one block,
  1–16 entries, each checked exactly like the single form; all or nothing). It is ONE action (one root), one
  receipt, rules run once after all the sets. Its summary names every change ("Character: STR 14 → 16, VIT 12 → 13,
  Points 3 → 0") and the "You set" line reads the same. `result` gains `fields: { key: { from, to } }` (keep the
  single form's `field/from/to` exactly as it is). The replay guard/decision covers all fields. The single form is
  byte-identical to today.
- Do NOT change `replyRoots` or any DM_LIMITS value (replay contract).
- The sheet saves with one multi-field `dm.set`.
- When any block edit is refused with DM_BUDGET, the reader sees plain words: "This reply already holds as many
  changes as one reply can. Send your next message, then try again." (the sheet and the generic edit path).
- Tests: the multi form (one root, one receipt, all-or-nothing on a bad field, rules once, swipe/delete/rebuild/
  reload equality, the single form unchanged), the sheet's save as one action, the budget message.

## F2. One tab per RPG block crowds the bar
With the feature on and a 3-character party, the bar shows Character, Character 2, Character 3, Skills, Skills 2,
Skills 3, Foes and Combat rules beside Party; the mockup has Party only. While Lean RPG is on, blocks whose
definition `role` is `character`, `skills` or `rules` get no tab of their own (they stay in Blocks, and Party draws
characters and skills); `foes` keeps its tab. With the feature off, tabs are exactly as today. The Party card's
Skills button opens the Blocks page at that character's Skills block (scrolled/focused to it).
Tests: tab list with the feature on/off, Skills button target.

Report as COMMON.md says.
