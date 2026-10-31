# To-do list (updated 31 Oct ~09:35 UTC)

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
1. **Timeline big beats** for Ersveil: what happens and roughly when (CY 611 onward). Needed for K.
2. **UI redesign (P6)**: a direction (minimal/flat, classic RPG, MVU-style, mobile HUD, or a reference).

## Next, in order
| # | Work | Who | Size | Needs |
|---|---|---|---|---|
| K | Ersveil 2.2.0: hidden timeline events from the big beats (written with Studio's AI help), plus the "Sealwarden recruit" RPG skill set | lead | ~½ day | USER item 1 |
| ~~S~~ | DONE 31 Oct: vendored Story Block 2.8.0 in SD (#145), Studio (#20), NSD (#225) | — | — | — |
| P4 | P4 trim: lazy-load the pack checker, Diagnostics, UI sample | Haiku or Sonnet | ~½–1 day | Any time |
| L | UI redesign mockups | lead / agents | — | USER item 2 |

## Small follow-ups (any time)
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
- **Reviews:** Codex when available (fresh session); otherwise a Sonnet reviewer, or the USER's go. **Blocker bar
  (USER, 31 Oct):** only ordinary-use data loss/corruption, crash/wedge, wrong rules, or a hidden-value leak in normal
  play; everything else is a follow-up.
- **Tests (USER, 31 Oct):** write a test per fix and run it after the fix only; no failing-before runs.
- **Merges:** merge commits only, after green CI; agents never merge.
- **UI:** a mockup is approved before any UI is built.
