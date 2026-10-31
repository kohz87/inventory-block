# To-do list (updated 31 Oct ~14:25 UTC)

State: everything in flight is released. Story Block main f182f2c (**2.8.0, the RPG**; Ersveil 2.1.0); Story Director
main 908bfa6 (2.3.0, the Timeline's lasting changes); Story Studio main 061ca41 (**0.4.0, Write timeline events with an
AI**). No branches or PRs open.

## Released 31 Oct
| Work | PR | Reviews |
|---|---|---|
| RPG (Story Block 2.8.0) | kohz87/Story_block#225 → f182f2c | 155, 157, 158, 160, 163, 164, 166 → final 167 HOLDS |
| AI writing help (Studio 0.4.0) | kohz87/Story_studio#19 → 061ca41 | 159, 161, 162, 165 → final 168 HOLDS |
| Timeline (SD 2.3.0, Studio 0.3.0) | Story_director#144, Story_studio#18 | 154, 156 |

Approved mockups: RPG https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R (v8); Studio Timeline
https://claude.ai/artifact/AJZkpqZigE5TvZRRh4jrMK (v3); AI writing help https://claude.ai/artifact/EanYreZdULFAjKTf2reV2K.

## Waiting on the USER
2. **UI redesign (P6)**: a direction (minimal/flat, classic RPG, MVU-style, mobile HUD, or a reference).

## Next, in order
| # | Work | Who | Size | Needs |
|---|---|---|---|---|
| ~~K~~ | RELEASED 31 Oct: Story Block 2.8.1 / Ersveil 2.2.0 (#226): hidden history CY 611+, Court favour, Sealwarden recruit, 56 notable people | — | — | — |
| ~~N~~ | RELEASED 31 Oct: Story Block 2.9.0 (#227): RPG new chat / held first send / companions who join, Blocks in Suite settings (+ Hidden), Money cap removed, slider hardening | — | — | — |
| ~~2.9.1~~ | RELEASED 31 Oct: Story Block 2.9.1 (#228, f81e052): Create sets up Combat rules/Foes, +3 points per Soul Class, defence skills, "full above 10", Soul Class field name | — | — | — |
| ~~2.9.2~~ | RELEASED 31 Oct: Story Block 2.9.2 (#229, 224f7c9): wizard Stats step keeps "Points left" out after a click | — | — | — |
| ~~2.9.3~~ | RELEASED 31 Oct: Story Block 2.9.3 (#230, 0a0254d): wizard summary row spacing | — | — | — |
| G | Gear = stat bonuses (equipped items add to stats) | lead mockup, then Sonnet | — | USER says draw it |
| S2 | Re-sync vendored Story Block (test-only) in SD/Studio/NSD to 2.9.3 | Sonnet | ~1 h | USER go |
| ~~S~~ | DONE 31 Oct: vendored Story Block 2.8.0 in SD (#145), Studio (#20), NSD (#225) | — | — | — |
| P4 | P4 trim: lazy-load the pack checker, Diagnostics, UI sample | Haiku or Sonnet | ~½–1 day | Any time |
| L | UI redesign mockups | lead / agents | — | USER item 2 |

## Small follow-ups (any time)
- 2.9.0 (review 171): refuse `- party` on the player's own character; a character made on the greeting is lost if the greeting is swiped (pre-existing); Home card lingers after turning the RPG off until Home redraws; old capped reply Re-read now pays in full (CHANGELOG could say).
- 2.9.1 (review 172): Re-read of an old `- party X` after a persona rename refuses the leave; "+1 points" singular
  when the clamp limits it; the first-character `dm.join` docs paragraph describes an unreachable path; a Create
  on the greeting is lost if the greeting is swiped (add a one-line note in the dialog).
- 2.9.1 (R8, review 173): "full above 10" goes negative under stat 5 ("+-4"); Settings hint "rounded down" under
  it; foes' class words follow the party's soul field; `+ party` grammar says I–IX; statDivisor 0 encoding; unused
  soulOne string; wizard/join characters carry the stock "Soul Class" label.
- Pack checker doesn't parse event `when` conditions (an apostrophe in a quoted name went unnoticed until a test).
- Ersveil: split news events can repeat the same bulletin when the player moves between region groups; Ardelia deadlocks (outline said elects).
- RPG: a reply where the story changes nothing doesn't settle the death check (it waits for the next reply with lines).
- RPG: an optional real-host integration test for review 166 (rollPrepared wiring + narrator request).
- RPG: class-up note weight; names no cut can separate; the rank-0 death card distinguishes only the character role;
  a remove-then-define pin leak.
- Studio AI help: a hand-made parent name with a carriage return plus an invalid delay unit shows "Just the 2 days is
  fine" although the delay is dropped (a second warning still blocks Keep). Factions are read up to the first five.
- Timeline: an "Any time" lasting event never fires in a story with no date (add a help line); sync `chronicle-lasting`
  at export too; drop the stale `time() != null` guard when the last delayed child goes.
- Block chooser says "1 buttons" (pre-existing in 2.7.2).
- Studio: event names are shown from their ids, so capitals are lost; consider an optional display name.
- Block prompts are stored on one line, so the RPG combat text loses its line breaks.
- Story Block keeps a pack enabled when a module capability it needs goes missing after install; consider skipping such
  events with one Problems line.
- A merge-on-rename can drop "from the story" after an earlier reply is re-read (pre-existing; 151 note).
- Story Director clock editing (a pencil on the date and time).
- `b1r2-capture.test.js` 10 s backstop trips under heavy load (passes alone); watch it in CI.

## Rules to keep in mind
- **Reviews:** Claude reviewer agents (USER, 31 Oct: no Codex quota). **Blocker bar
  (USER, 31 Oct):** only ordinary-use data loss/corruption, crash/wedge, wrong rules, or a hidden-value leak in normal
  play; everything else is a follow-up.
- **Tests (USER, 31 Oct):** write a test per fix and run it after the fix only; no failing-before runs.
- **Merges:** merge commits only, after green CI; agents never merge.
- **UI:** a mockup is approved before any UI is built.
- **RB = rpg_battle (USER, 31 Oct):** stop updating the rpg_battle extension (kohz87/rpg_battle). No work, syncs, reviews or pushes touch it.
