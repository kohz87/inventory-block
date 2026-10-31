# Agent B: screens (Sonnet)

Branch `stage16/rpg-b`. Read COMMON.md first. The mockup v3 shots are the target; match them.

Files: new `src/v2/lean-rpg/view/{party,distribute,battle-log,settings}.js` and `src/v2/lean-rpg/view/lean-rpg.css`,
new `src/v2/lean-rpg/strings.js` (all your reader-facing text), `src/v2/ui-host.js` (one mount line, loaded only
when the feature is on: dynamic `import()`), `src/v2/screens/changes-card.js` (only the RPG lines), the history
strip in `src/v2/turn.js` (the `[battle]` marker only: one small function, the lead merges it with A's prelude
change), tests under `tests/v2/lean-rpg/view/`.

Widgets: `ss.meter`, `ss.stepper`, `ss.radar` from `src/v2/view/widgets/` (read `docs/v2/WIDGETS.md`). Tones:
neutral, accent, good, warn, bad, info. Use the existing scope selectors and theme tokens; no new colours.

## B1. Party tab (mockup section 0: `21-party-d.png`, `21-party-p.png`)
One "Party" tab (shown while the feature is on and the chat has a Character block), one card per Character block
(`role: 'character'`, ordered: the reader's own character first, then by block order). Each card: name (`who`) and
role line, Soul Class (`soul` with its name, e.g. "Soul Class II"), an XP bar (`xp`/100), the three stage bars,
the seven stats in a row, and the skills from that character's Skills block (`skillN` with `rankN` name). Cards sit
side by side on desktop and stack on a phone. A card with `points > 0` shows "N points to spend" and a
**Spend points** button; otherwise a **Stats** button. Both open B2 for that character. **Skills** opens the
character's Skills block (the existing block view). A dead character (`alive` false) shows greyed with "Fallen".

## B2. Stage bars
`ss.meter` with `segments` = the stage count, value = the stage index, `text` = the stage word (`STAGES`), tone by
stage: good near full, warn in the middle, bad near empty (mockup: Hurt amber, Fresh green, Spent red). Same row on
the card and in B3. Tapping a bar opens the existing inline edit for that field.

## B3. Spend points / Stats view (mockup section 1: `11-stats-bars-*.png`)
RB's Stats step: the three stage bars on top, then an `ss.stepper` per stat (1–20) spending a shared `points`
budget, the points-left pill, and an `ss.radar` with the new shape over the old one. Save writes all the stats and
`points` through `dm.set` as one edit set on the latest reply (the "You set" lines). Cancel discards. Opened as a
sheet over the Party tab; on a phone, anchor sheets with `top`, never `position:fixed; bottom` (SillyTavern's html
has a transform).

## B4. Battle log D (approved: https://claude.ai/artifact/Hs3sTqDMLPPedhREoopGLb)
Drawn at the narrator's `[battle]` marker inside the message from A's `data.v2.result` record (read A's brief for
the shape; code against a small adapter you define and A will match), with a fallback card under the reply when
there is no marker. Short lines, aligned solid bars, the fold, the breakdown on tap. The marker is stripped from
prompt history (the turn.js strip function).

## B5. "Changed this reply" lines (mockup section 2: `12-auto-lines-*.png`)
"Rolled for you: N exchanges" from A's reply summary; the class and rank rises come from C's display names on the
normal change lines (check they read "Soul Class II → III" and "Iron Breath: Adept → Expert"; if not, report it).

## B6. Settings → Lean RPG
A small page or fold with "Rolls: automatic / off" (A owns the value `rolls`). Only while the feature is on.

## Tests
DOM tests in the style of `tests/v2/ux/` for each view (desktop and phone widths), the tab's presence rules,
Save as one edit set, the battle-log marker and fallback, the history strip, feature off ⇒ nothing mounted and
nothing imported.
