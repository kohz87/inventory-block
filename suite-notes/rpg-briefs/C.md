# Agent C: block engine additions (Sonnet)

Branch `stage16/rpg-c`. Read COMMON.md first.

Files: `src/v2/data-modules/{schema,check,interpreter,part,grammar,block-builder,block-screen,block-templates}.js`,
`src/v2/screens/blocks-editor.js`, `src/v2/screens/changes-card.js` (only for C2's names), `src/v2/strings.js`
(the `blocks` section only), tests under `tests/v2/data-modules/` and `tests/v2/screens/`.

Facts you can rely on: `rules` already run after every kind's effects (`part.js` ~412/449/479), so "XP ≥ 100 →
soul +1, xp 0" and "practice ≥ 100 → rank +1, practice 0" already work as plain rules. Add a test proving both
(with `add` bounds capping soul at 9 and rank at 3) and that a swipe/delete takes the rise back.

## C0. `role`
Optional definition key, one of `ROLES` (import from `src/v2/lean-rpg/index.js`). Checked in `check.js`; kept by
`blockDraft`/`buildBlock`/templates; ignored otherwise. Not shown to players.

## C1. Longer "What it is for"
Block prompt cap 600 → 1200 characters (check.js ~411, blocks-editor.js ~162, strings). The static total stays
≤ `DM_LIMITS.staticCharacters` (2000) with the grammar; keep the existing refusal when the total is over.

## C2. Display names for int fields
`names`: `{ "<value>": "<name ≤ 40>" }`, at most 32 entries, keys must be integers inside min..max. Used wherever a
value is shown to a person or the AI: the block card/tab, the tail line, the "You set" and "Changed this reply"
lines, and the grammar's description (so the AI may write either the number or the name in a `set-<field>` line;
the parser maps a name back to its number, case-insensitive). Stored values stay numbers. The editor: an optional
"Names" row for a number field (one `value = name` per line is fine).

## C3. Card functions
`{ type: "card", when, tone: "info"|"warn"|"end", title ≤ 60, text ≤ 240, button? }` in a definition's functions
(builder) / a new definition key (your choice of storage, say which). Derived from the head reply's state, never
stored, drawn under the head reply through the existing reply-cards socket (`src/v2/reply-cards.js`,
`src/v2/view/reply-cards-ui.js`). `button` names one of the same block's Button functions and runs it as a reader
command on the latest reply. Limit 4 per block. The death card is the only user: "The story ends here" (tone end).

## C4. Reply-end functions
`{ type: "reply-end", when, effects }`: settled once per reply after the reply's own lines, as a system step
(`dm.settle` like timers; replan on swipe/delete/edit; NO_LONGER_DONE when nothing to settle). Effects only on
the block's own fields. Limit 4 per block. Order: in definition order. The death latch uses two:
1. `when health == 0 and down` → `set alive false`;  2. `when true` → `set down (health == 0)` (or two rules
   `health == 0 → down true`, `health > 0 → down false`, whichever the effect language allows).
So a character dies only if already Down when the reply started and still Down at its end.

## C5. Hidden fields
Field `prompt: false`: left out of the tail and the grammar (no `set-<field>` kind is offered to the AI; a hand-
written kind on it is refused by the checker unless the kind is a Button). Reader edits and rules still work.

## Builder vs hand-authored definitions
H's templates are hand-authored definitions (more than one set-kind per block, add-kinds like `practice-3`). Make
sure the checker accepts them, the chooser can create a block from them, and `editableBlockDraft` either edits
them faithfully or opens them read-only with a plain note ("Made from a template: edit its fields here, its rules in
the pack file"). Say which you chose.

## Template chooser
When the Lean RPG feature is on, Blocks → New block → from a template also lists `LEAN_RPG_TEMPLATES`
(`src/v2/lean-rpg/templates.js`, empty for now; H fills it) under a "Lean RPG" heading. They are not counted in the
16 reader templates and cannot be removed.

## Tests
Live = rebuild = reload for C2–C5; swipe and delete; every new limit at its edge and one past it; old hashes
unchanged (a 2.7.2 definition hashes the same); grammar and prompt bytes unchanged for blocks that use none of the
new keys.
