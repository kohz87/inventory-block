# Review (1 Nov): Story Director stage29/ui-b f9a1969, NPC State Delta stage29/ui-d 3d93827
Reviewer: Claude agent rv-ui2. Scope: items 1-4 and 6 (browser spot checks only where needed). No commits or pushes.
Folder: scratchpad/rv-ui2 (clones sd, nsd, sbmerge = stage29/ui-merge 36f31d8, sb-main = 121e49a; shots/; scripts/dump.mjs, t3-t8.mjs).

## Verdicts
- Story Director ui-b f9a1969: OK (no blockers)
- NPC State Delta ui-d 3d93827: OK (no blockers)

## 1. Tests
SD: npm run check ok. npm test 994 tests, 992 pass, 0 fail, 2 skipped. Base 4b188c3: 981 tests, 979 pass, 2 skipped. Test names diffed
  base vs head: 0 removed, 13 added. The "994 -> 992" is total vs pass (same 2 skips on both); no test was lost.
NSD: npm run check ok ("Validation passed"). npm test: 1520 tests, 1515 pass, 0 fail, 5 cancelled (storysuite-participant-selection 777-781,
  "Promise resolution is still pending"). Same 5 cancelled on clean base 13daee6 (1511 tests, 1506 pass), so pre-existing. Because npm test
  chains with &&, compatibility-check.js and runtime-smoke.mjs do not run after that failure; I ran both by hand: both pass.
  (This sandbox has Node 22; package.json engines say >=24: possible cause, not verified.)

Cross-host runs (full SD suite and full NSD suite with the vendored Story Block swapped, scripts/sync-testkit.mjs):
- SD head + old SB 121e49a vendor: 994 / 992 pass / 0 fail.
- SD head + new SB ui-merge vendor: 994 / 991 pass / 1 FAIL: tests/v2/screens/render.test.js:243 "status card: each reply's card is drawn from
  that reply's state". It drives SB's card mount, which the merge changed (one "This reply" card). SD base fails the same test on the new
  vendor (different assertion), so it is test-harness drift, not a product bug. Follow-up for whoever syncs the vendor for the SB 2.12.0 release.
- NSD head + new SB vendor and + old SB vendor: 1520 / 1515 pass / same 5 cancelled as base.

## 2. Off/on and presets
- Default-on prompt: built the whole conversation (14 lines of every owned kind, time jumps, places) on base and head under the real SB testkit
  host (new and old SB): static prompt, kinds, context parts, every tail of 4 replies, receipts, rebuild result, and queries are byte-identical.
  Only differences: state ids (random), `director.status.summary` (new), status card title/summary (new). Fixture prompt-threads-on.json agrees.
- Threads off: static prompt loses Pacing + 2 World paragraphs + 9 grammar kinds (SD part 171 tokens). My chat: Lean total 3,707 vs Standard
  4,394 tokens. State after off = kept; rebuild == live in both modes (dump.mjs; also unit tests incl. Ersveil chronicle.lasting).
- Browser (test ST 8172, real Ersveil chat): Lean -> Full -> Standard -> Lean -> Standard: chat metadata, all chat messages, receipts (111),
  and the NSD state files hash identical before/after every pick; only the reader's feature switches change. Reload with Lean on keeps
  the same state and the same screens. Standard restores every switch to its default (Lean also sets weather/you/loot/mounts, initiative,
  trip, arc, threads, NSD stages/presets/scan-every-reply off, as designed). Custom/derived tile behaves.
- Director grid: no overlap at 1440/1100/900/760/700/600/480/390/320, hidden and revealed.

## 3. Hidden values
Whole-page text search (Ersveil secret "Weir sabotage", clock "Barge pile-up"/"the quay floods") over every reply card opened, every Game view
tab, World Journal, the More sheet, the Story panel tabs: no hit with threads on (Reveal closed) and none with threads off (Lean).
Node: with threads off no owned-kind name reaches the prompt, World/Journal/Behind queries (director.behind answers null). Threads on:
every query identical to base. The status summary is "<clock>, <scene place>" (both already in the hero header); no new surface.

## 4. Ownership
SD/NSD changes touch only SD/NSD files; SB is not changed by them. In SB ui-merge (not these repos) I found SD words/ids added by this work:
see follow-ups 3 and 4.

## 6. Compatibility
- Old SB (121e49a) + new SD + new NSD: nothing crashes; Home/World/Director/cards work; hero shows place/time/weather so SD hiding its
  duplicates is correct; Status card keeps its own "Where things stand" card. Console: 7 warnings "presets on feature X is not a feature field
  this Story Block knows; it is ignored" (SD: initiative, threads, trip, arc; NSD: stages, presets, scan-every-reply). Harmless.
  NSD phone dossier fix works on old SB too (--ss-zoomed exists there).
- New SB (ui-merge) + old SD + old NSD: nothing crashes, no warnings; duplicate scene lines remain (old SD), card heading "Status", no summary part.

## Browser (my scope only)
New/new/new, desktop 1440x900 and phone 390x844: Director, World (on/Lean), tab bar and More (Chronicle disappears in Lean), Story panel
keeps clock/place/weather lines, NSD folds (Scanning, Roster, Meter presets, Portrait, Data, Expert last; Expert note correct), phone dossier is
full width (390) with tabs scrollable. Console: only "Settings not ready" warnings. Shots in shots/.

## Blockers
None.

## Follow-ups, ranked
1. SD release prep: vendor sync with new SB breaks render.test.js:243 (card mount API); rewrite it for the merged "This reply" card.
   SD and NSD must require SB >=2.12.0 (otherwise 7 `presets` warnings and no presets, as above).
2. Pre-existing: NSD 5 cancelled tests (storysuite-participant-selection); `npm test` therefore never reaches compatibility-check/runtime-smoke
   (they pass by hand). Check on Node 24.
3. Ownership (SB ui-a1): src/v2/view/screens.js DEFAULT_BAR names story-director/quests, world, map (follows the existing DEFAULT_ORDER/DEFAULT_HIDDEN
   precedent, but new ids added by this work); a screen-declared `bar` would be cleaner.
4. Ownership (SB ui-c): Lean tile text says "No world-building threads or travel." (SD's feature wording; text mandated by the UC brief).
5. Cosmetic: World -> Now "Here" card in the Game view keeps a bare "HERE" heading above People (place/weather lines hidden).
6. Design note: Lean turns "Scan after every reply" off, so NSD misses up to 2 replies; stored data unaffected.
