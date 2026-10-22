# Story Suite v2 beta: live UI breaker, pass 1 (interim)

Heads attacked: Story_block 119ead8, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79 (all `v2`).
SillyTavern 1.19.0 with the mock model on ports 8244/5244. Scripts are in `results/scripts/`; `mock2.mjs` routes queued
replies to the preroll classifier, the extractor and NSD's scanner separately.
New on `v2` since alpha.2: Story_block #96 (F100 Features), #97 (docs); Story_director #88, #89.

## Findings

### B-ui-1 [severity: medium] Settings overlay: folds shrink to slivers and clip once content is taller than the screen
- Repo: Story_block, `src/v2/view/host.css:104-108`.
- Repro: open Suite → open the Features fold → open the Story Block fold (390x844, and 1440x900 too).
- Expected: the overlay body scrolls; every fold header stays full height and tappable.
- Actual: the closed folds (Story Suite, NPC State Delta, RPG Battle, Story Director) shrink to about 9 px high, so their
  headers are unreadable and untappable (dead controls). The open Features fold is cut to 96 px of its 520 px.
  Screenshots: `shots/w390-overlay-sb-click.png`, `shots/w390-overlay.png`.
- Invariant 4: dead controls and content cut off.
- Fix: the overlay body is both `.story-suite-panel` (flex item, `overflow: auto`) and `.story-suite-folds`
  (`display: flex; flex-direction: column`), so its folds are flex items that shrink to their min-height, which is 0
  because of `overflow: hidden`. Add `.story-suite-folds > .story-suite-fold { flex-shrink: 0; }`, or use
  `display: grid` (suite.css's `.story-suite-panel .story-suite-folds` grid rule never matches, because both classes
  are on the same element).

### B-ui-2 [severity: low] Feature switches: each id is used twice in the document
- Repo: Story_block, `src/v2/host-ui.js` `featureRow`. The overview and the module fold both render
  `story_suite_feature_<id>`, so each input has two `<label for>` elements and the document has duplicate ids.
  Clicking still works, because both rows are synced. Ids are also built by replacing `.` with `_`, so two different
  feature ids can map to the same element id.
- Fix: prefix the id with where the row is drawn (`overview` / the module id).

### B-ui-3 [severity: low] Escape does not close the Settings overlay (it does close Game view)
- Fix: a keydown handler for Escape on the overlay that calls close() and returns focus to the Suite button.

### B-ui-4 [severity: low] Small tap targets at 390 px
- Map place dots are 8x8 px. Inventory filter selects are about 22 px high, the "Equipped only" checkbox is 15x15 px,
  and the Party tab's "Use or set aside" control is 20 px high. Details: `scripts/out-layout-390.json`.

## What held up
- F100: all 16 on/off combinations of the four Story Block features, set through the overlay's switches, at 1440 px
  and 390 px. sdk.features() matched every time, the HUD and cards followed their switches, and all 11 tabs and
  11 Game view screens rendered with no page errors and no mount problems.
- Preroll and extractor on, with their model calls answering garbage, 20,000 lines, markup or HTTP 500: no stuck
  generation and no page error. Extractor coins were held to the per-reply cap (999999 asked → +400).
- Markup in item, place and coin names (`<b>`, `<img onerror>` setting a flag) shows as text in the inventory, HUD,
  cards and Home; the flag never fired.
- No page-level sideways scroll on any tab or screen at 390 px; only the tab strip, Game view nav and map layers
  scroll inside themselves.
- Reduced motion: no animations or transitions left running in the panel, Game view or overlay.

## Not done yet
Each module missing in turn and a module older than its `requires` (the first run was invalid because of a script
bug); RPG Battle export/import with bad files; the crafting and gear screens; failing node:test files.
