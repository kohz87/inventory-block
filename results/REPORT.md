# Story Suite v2 beta — live matrix report

Write-ups in the BREAK_BRIEF format, newest pass first. Matrix: `matrix.md`. Harness: `harness/matrix/` (run-config.sh, pass.sh, collect.py) and `harness/smoke/st-beta.mjs`.

# Pass 1

## Cell 1 report — Ersveil pack, every feature on (FEATURES=all), desk 1440 px and phone 390 px

Heads (v2): Story_block 5ef7ead632f7, rpg_battle 924b9a3b65fb, Story_director affde13a3cca, npc_state_delta 5243d79dc0e6.
Runs: `$SP/beta-e2e/scenario/p1-c1-desk/`, `$SP/beta-e2e/scenario/p1-c1-phone/`.
Features declared (all turned on): story-block.hud, .cards, .preroll, .extractor; story-director.digest. rpg-battle and npc-state-delta declare none yet.

| run | PASS | FAIL | SKIP | FAILs |
|---|---|---|---|---|
| p1-c1-desk | 15 | 2 | 18 | B01 (rpg-battle, npc-state-delta declare no features yet), B14 (harness, see below) |
| p1-c1-phone | 15 | 2 | 18 | same two |

- A7 and B20 (rebuild from file == live): PASS in both runs.
- static-hashes.txt: one distinct static part across all 22 (desk) / 24 (phone) main requests; the B01 toggle (story-director.digest, prompt=false) correctly did not change it.
- console.txt: only known noise (NSD sidecar 404s, NSD scan "No message generated", ST "Settings not ready", ST Story String validation warnings). No pageerror, no Story Suite error.
- Both FAILs are not product bugs: B01 is "feature not merged yet" in two modules; B14 is a harness artifact (the digest itself works, see harness notes).

### B-c1-1 [severity: medium] A fight-left condition grows from 1 round to 3 in the next fight, and never wears off with story time
- repo: rpg_battle
- file:line: src/v2/combat/setup.js:66-69 (`roundsOf`: stacks 1 → 3), src/v2/party/sheets.js:129 (`fromSheet`: `stacks: int(entry.rounds, 1)`), src/sheet.js:797 (v1 `applyResult` keeps the fight's lasting conditions as they are)
- repro (live): A3's rat fight leaves the character bleeding (Fight tab "Last fight … HP 55/82 … · bleeding"). The party keeps `bleeding` (stacks 1); it is in every later tail ("Party: User (you): … · bleeding"), on the HUD chip and the Party card through a `! time +30h` sleep and to the end of the run (desk and phone). repro (testkit): `node --test tests/v2/break/c1-fight-left-condition-grows.test.js` — a fight result with `{ name: 'bleed', rounds: 1 }` → `applyResult` + `fromSheet` keeps `{ kind: 'bleeding', stacks: 1 }` → `partyCombatants` starts the next fight with bleed `rounds: 3`.
- expected: a bleed with 1 round left either ends (with the fight, or with story time/a rest) or starts the next fight with 1 round. actual: it is indistinguishable from a story-given condition (stacks 1 = "no rounds"), so it lasts forever outside fights and gets the story default of 3 rounds in the next fight (3× the DOT the fight left).
- invariant: 3 (code sets numbers by the rules: the DOT rounds grow between fights with no rule saying so); also a reader-visible stale status in the tail for days of story time.
- suggested fix: keep a fight-left condition's rounds distinct from a story condition (e.g. store `rounds` on the party condition, or `stacks: rounds` with a `from: 'fight'` marker and use it as-is in `roundsOf`), and drop fight conditions (bleed/poison/burn/stun/slow/weaken) when story time moves past the fight (a few minutes is far more than the rounds left) or at least on any rest; a rounds ≤ 0 entry should never be written to the party.

### B-c1-2 [severity: low] Battle board shows "bleeding 0" on the acting member
- repo: rpg_battle
- file:line: src/v2/board/query.js:71 (turns = cond.rounds), src/v2/board/widget.js:304-306; source: src/combat.js:461 (`beginTurn` decrements before the player chooses; the 0-round entry is only filtered in `endTurn`, :479)
- repro: live phone run, `shots/fight-fight1-board.png` (round 2, waiting for the player): the character's card has a chip "bleeding 0", aria "bleeding: 0 turns left".
- expected: a condition that still applies this turn shows ≥ 1 (or "last turn"), never 0. actual: "0 turns left" while it is still on.
- invariant: none (display only).
- suggested fix: show `rounds + 1` for the acting member after `beginTurn`, or hide the counter at 0 / label it "ends this turn".

### B-c1-3 [severity: low] Days screen reads each day's date twice
- repo: Story_director
- file:line: src/v2/chronicle/days-screen.js:25 (`{{ d.date }}` then `{{ d.line }}`), src/v2/chronicle/days.js:350 (the line starts with its date, made for the [Yesterday] tail)
- repro: live desk/phone `shots/p-Days.png`: "CY 611, Goldwane 12 CY 611, Goldwane 12: took on Granary Rats; …". testkit: `node --test tests/v2/break/c1-days-date-twice.test.js` → head "June 3, 1200 June 3, 1200: to Harrow; 40 gold in."
- expected: the date once in the folded head. actual: twice; on a 390 px phone the duplicate takes a whole line.
- invariant: none (readability).
- suggested fix: have `dayBoard` give the line without its date prefix (e.g. a `short` field = facts only) and use it in the template; keep the dated line for the tail.

## Held up
- FEATURES=all on desk and phone: every alpha row (A0–A12, A11p) PASS; rebuild == live after the alpha steps (A7) and after all beta steps (B20), with the day-digest receipt committed by a beforeGenerate hook in the chat.
- Day digest (story-director.digest, new in affde13): `! time +30h` across midnight → the next reply's hook writes exactly one finished day (Goldwane 12) from receipts (quests taken/finished, fights won — 1 on desk, 2 on phone, matching the fights fought — 50 marks in, 1 world event); `[Yesterday] …` line is in that reply's tail and not in the following ones; the static part is unchanged; Days tab lists it with a working search box on phone.
- Toggling story-director.digest off/on through settings: static part byte-identical before, while off, after (prompt=false is honest).
- Phone (whole scenario at 390 px): no horizontal page scroll; wizard (5 steps) fits; fight board, Quests, Party, Inventory, Trade, Map, Days, Director, Chronicle panes readable, no overlapping controls; A11p tab edge check clean.
- A6 chat switch right after equip: nothing lost or leaked on phone either.
- Console: no pageerror and no unclassified error in either run.

## Harness notes (st-beta.mjs; not edited)
1. B14 FAILs on three harness checks while the feature works: (a) it opens the **Chronicle** tab and looks for "Days" there — the Days screen is its own tab ("Days"); open `tab('Days')` (or accept either) and check for the written date; (b) it looks for the digest receipt on the reply with `! time +30h`, but the digest is committed by the next reply's beforeGenerate hook, so it is on the following reply ("I go out into the lane."); read `lastReceipts()` after `nextReq` and look for type `chronicle.digest`; (c) the reminder regex `\b(yesterday|…|Goldwane \d+)` matches "Goldwane 14 dusk" in the [Happened] pack-event text before the real `[Yesterday] CY 611, Goldwane 12: …` line; match `/^\[(Yesterday|Last day)\] .+/m` instead. With these the row would PASS in this configuration (req-53 in the phone run's mock log holds the line).
2. B01: when a module declares no features yet, the row FAILs; consider SKIP-with-note for the not-yet-merged modules (rpg-battle, npc-state-delta) and FAIL only for a module whose branch is merged. Also "settings switches in page 0": the row flips via `extension_settings` directly (not the switch), so `createFeatureStore.set`/`onChange` is never exercised; open the Suite settings drawer first so the `.story-suite-feature` switch path is the one tested.
3. On phone the tab helper clicks off-screen tabs by JS, so shots of Map/Fight/Trade/Director/Days show the strip still on Party…Inventory with no active tab visible; scroll the clicked tab into view before the shot (or check `scrollIntoView` on activation in the product) so shots show what a reader would see.
4. run-config.sh wipes `$SP/inst/m<slot>/` (incl. the mock request log) at the start of the next cell on the same slot; copy `log/` into the scenario folder at the end so tails can be checked after a second run.
