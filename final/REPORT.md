# Story Suite v2 beta: final long soak (1,500 replies)

SillyTavern 1.19.0 + mock model, Chromium over raw CDP, instance `soak` on 8252/5252, Ersveil pack
(`examples/packs/ersveil-bluewatch/pack.json`, imported through the Packs panel). The lore folder `$SP/lore-ersveil`
is not on this machine. The narrator card uses `setup-beta.mjs`'s own plain Bluewatch greeting instead.
Run: `soak.mjs --replies 1500 --seed 23`, 1,612 steps in 3 h 29 min, finished 05:36 UTC.

## Code under test (`v2` HEADs)

| Repo | sha |
|---|---|
| Story_block | `0a6ed63aefe62bc02405a0a5cf52606fb193d6d5` |
| rpg_battle | `a8eca8a6816952b59634fbf0ae147041315282b5` |
| Story_director | `9f59baf8483f18269bfc2f87afcb4c89d63171e3` |
| npc_state_delta | `1156fd72164ff223854097ed59d0ebf936d5dbd9` |

## What the run did

| Action | Count | | Action | Count |
|---|---|---|---|---|
| send | 1,179 | | delete (last 1–2) | 46 |
| swipe | 185 | | edit | 33 |
| regenerate | 92 | | middle cut (`/cut`) | 20 |
| Continue | 44 | | rewind (`sdk.rewind`) | 9 (a branch each; 4 more skipped by the driver: the last reply held a single change block) |
| reloads | 7 (every 200 replies) | | Feature switches flipped (settings overlay) | 27 |

The generator writes every change-line kind the static part teaches today: milestone, npc (±N and `=N`), check
with dice, craft, effect (timed, `- effect`), encounter (tier/rank/boss), join, leave, market (`!`/`~`), recipe
(`+`/`-`), refine, repair, rest, skill, use, wound and conditions, coin, item (wear, equip, key items worth more than the
goods budget), loot, place (`with:`), present, agenda, beat, clock, event, faction, hook, landmark (`plane:`),
quest (rank, progress, `met:`), route, secret, time (`~`/`!`), world. About 1 line in 8 is sloppy or hostile on
purpose. Reader actions between replies: fights (auto), party offers, equip/unequip, equip on a companion,
loot take, repair, craft (make and commission), trade, point spend, and UI tours (tabs, game view, cards).
Generator and driver changes are in `harness/break-scripts/` (gen.mjs, soak.mjs) on this branch.

## Measurements per 250-reply window, next to the earlier soak

Medians over replies the model was asked for (send/swipe/regenerate/continue). Saves and MB are over send steps,
including the reader's actions after the reply. Heap is after a forced GC.

| Replies | Saves/send | MB up/send | Chat file MB | Send→request ms | Capture ms | Prompt build ms | Heap after GC MB (max) | Rebuild == live |
|---|---|---|---|---|---|---|---|---|
| 1–250 | 4.15 | 3.93 | 2.37 | 742 | 276 | 251 | 180.5 | 3/3 |
| 251–500 ¹ | 3.85 | 12.76 | 4.66 | 1,412 | 1,060 | 844 | 242.2 | 3/4 ² |
| 501–750 | 3.75 | 19.34 | 6.60 | 2,533 | 1,537 | 1,583 | 238.3 | 3/3 |
| 751–1000 | 3.72 | 25.82 | 8.77 | 4,994 | 3,427 | 3,725 | 159.6 | 5/5 |
| 1001–1250 | 3.76 | 35.03 | 10.89 | 4,131 | 3,596 | 3,033 | 262.5 | 3/3 |
| 1251–1500 | 3.87 | 44.27 | 12.87 | 4,008 | 3,268 | 2,659 | 243.3 | 4/4 |

¹ Between replies ~330 and ~500 my own testkit fuzz runs (see findings) shared the 4 CPUs, so this window's
times are high. ² The n300 miss is explained under "Rebuild checks".

**Against the earlier soak (older code, 1,202 replies):**

| Window | | Capture ms | Build ms | Send→request ms | Saves/send | MB/send | File MB |
|---|---|---|---|---|---|---|---|
| 1–250 | earlier | 717 | 375 | 1,337 | 4.26 | 8.6 | 7.2 |
| | **final** | **276** (−62%) | **251** (−33%) | **742** (−45%) | **4.15** | **3.93** (−54%) | **2.37** (−67%) |
| 1001–1202 / 1001–1250 | earlier | 5,558 | 4,349 | 8,456 | 4.12 | 273 | 74.8 |
| | **final** | **3,596** (−35%) | **3,033** (−30%) | **4,131** (−51%) | **3.76** | **35.0** (−87%) | **10.9** (−85%) |

At reply 1,202 itself the chat file was **10.37 MB vs 74.8 MB (−86%)**. Story Block's storage PR claims −54% at 3,000
replies; this run did not reach 3,000. At 1,200 it does far better than the claim. The generators differ (this one
writes more kinds), so treat these as same-scale numbers, not exact pairs. At the end (1,500 replies, 2,272 messages)
the 12.87 MB file held 8.57 MB of `extra.storySuite`: ops 4.22, checkpoints 2.30, receipts 1.68, swipe_info copies 1.57.
The head state was 217 KB.

Still growing per reply (invariant 8): upload per send rises linearly with the file (~3.4 whole-file saves per send). Capture
and build plateau at 2.5–4 s from ~800 replies. Two reloads (at 1,000 and 1,200) roughly halved capture and build
for the next 40 replies (build 3,460 → 1,612 ms and 3,405 → 2,018 ms), as the page's DOM dropped from ~39k to ~20k
nodes. The other reloads did not, so there is a per-session cost on top of file size, but not one I could pin down.
Each rewind copies the whole chat to a new branch file: 9 branches (plus the probe's rename) left 12 chat files, 69 MB, on disk.

Raw run data: `run/` (metrics.csv per step, log, rebuild and reload results, summary). Charts: `charts/old-vs-final.png` (the comparison above), `charts/time-capture-prompt.png`, `charts/time-latency.png`,
`charts/saves.png`, `charts/size-growth.png`, `charts/memory-dom.png`, `charts/tail-budget.png`,
`charts/shared-prefix.png`, `charts/console.png`. Progress lines: `progress.md`.

## Rebuild checks (invariant 1), every 100 replies and at each reload

- **Store rebuild from the saved file == live head: 22 of 23** snapshots (n100 … final). The miss, n300, is real and
  explained by finding B-final-2: the harness's rebuild had no module validators and kept a block the runtime
  had skipped.
- From n500 on, `rebuild.mjs` also replays the file through the **real runtime**: all four modules plus the pack, so
  their validators and replay rules apply, as after a reload. **17 of 17 equal live.** Run on the kept n300 file, it
  equals live too, and names the skipped block (message 329, "HP must be whole numbers with 0 ≤ cur ≤ max").
- **Reloads: 7 of 7 kept the head byte-identical** (sha before == after, at 200, 400 … 1,400).
- No swipe_info copy mismatched its message in any snapshot. Store problems after replay: 0 at every snapshot.
- The naive op replay (from the first checkpoint, ignoring later ones) differs from live after the first middle cut.
  That is expected: it does not apply the replay rules for deleted replies. Informational only.

## Prompt (invariant 5)

- **Static part byte-identical in all 1,500 main requests** (one sha, `c054799ca3e9`, 8,937 characters). Feature switches
  (cards, status strip, extractor) never changed it.
- Tail: where the request held it (171 requests with a user message), max ~1,042 estimated tokens, median ~851, all
  under the 1,500 budget. Five one-request blips in the system-message prefix were a tail placed before an empty
  history (see B-final-1), not a static change.
- **But 1,329 of 1,500 main requests carried no chat history and no user message**, and 1,324 had no Story Suite tail
  either. See B-final-1.

## Console and Problems

- 0 stuck generations, 0 driver errors, 0 held-back sends, 0 browser relaunches, no memory pauses (≥ 12 GB free
  throughout).
- **Page errors: 27**, all one bug (B-final-5).
- **Console errors: 1,584.**
  - 1,549 are `[NPC State Delta] dossier scan failed … No message generated`. NSD makes one extra model call per
    reply, and the mock answers non-main calls with nothing. This is harness-induced, but NSD logs a console error
    on every reply when its scan gets no answer.
  - 35 are 404s for `/user/files/npc-state-delta-*.json` that NSD reads before it has written them.
- Console warnings: 1,981. 185 are SillyTavern's own "missing or invalid swipe_info … backfilled"; the rest are Story
  Suite telling why a sloppy or hostile line was not used.
- **Problems: 1,736.** Top codes: rpg-battle NOT_FOUND 345, REFUSED 335; npc-state-delta REFUSED 170; story-block INVALID 170;
  host UNKNOWN_KIND 125; rpg-battle INVALID 124; story-block NOT_FOUND 118; host UNREADABLE 103; story-block LIMITED 81.
  All come from the generator's sloppy and hostile lines. No Problem was thrown at the reader as an exception.

## Save races asked about

- **A timed-out save landing late after a newer save: it overwrites.** Confirmed live and in the testkit (B-final-4).
- **A chat renamed mid-save: held up live.** On a 12.9 MB chat, with the save held 4 s while `/renamechat` ran, the
  change landed in the renamed file. No file came back under the old name, and only one chat file remained. The open
  `test.todo` in `c4-rename-midsave.test.js` (a ghost under the old name) did not reproduce on SillyTavern 1.19.0
  here. I did not check how the server answered the late request.

Probe script: `harness/break-scripts/probe-save-race.mjs`. Output:

```
stale:  first/second commands ok; live has "Probe Beta"; file has "Probe Alpha", NOT "Probe Beta"; after reload: Beta gone
rename: renamed file has "Probe Gamma"; old name: no file; chat files with that name: 1
```

## Findings

Counts: **high 2, medium 2, low 1.** Each has a failing `node:test` under `tests/<repo>/` that drops into that repo's
`tests/v2/break/` (helpers alongside where named). All five fail on the shas above.

### B-final-1 [severity: high] The reader's context size is ignored: on SillyTavern's default 4,095-token context the conversation never reaches the model

- **Repo:** Story_block. **Owner area:** prompt / turn interceptor. `src/v2/turn.js:311`
  (`interceptor(_chat, _contextSize, abort, type)`: the size is unused) and `src/v2/prompt.js:128` (`assemble`: the tail is
  cut only to its own `tailBudget`, default 1,500).
- **Repro (live):** SillyTavern 1.19.0, chat completion at its default `openai_max_context` 4,095 (`max_4k`) with 300
  for the reply, all four modules plus Ersveil. Play past ~120 replies.
- **Repro (test):** `tests/Story_block/final-context-size-ignored.test.js`. 200 generator replies, then the interceptor
  is handed 4,095. Story Suite then uses 3,502 tokens (static ~2,230 + tail ~1,280), leaving 293 for SillyTavern's prompt
  and the whole conversation, and nothing says so.
- **Expected:** the tail (and optional static parts) fit what the context allows, leaving room for the conversation, or
  the reader is told the context is too small.
- **Actual:** SillyTavern fits the extension prompts and drops the rest. 1,329 of 1,500 main requests in the soak held no
  user message and no history; 1,324 also lost the tail. First at request 254 (step ~124). From then on most replies
  were written from the static part alone. No Problem or notice was raised.
- **Invariant:** 5 (the tail stays within budget: a budget that cannot fit the reader's context is no budget). Also
  hurts every reply's quality, silently.
- **Suggested fix:** use `contextSize` in the interceptor. Cap the tail at `contextSize − reply tokens − static − a
  floor for the conversation` (say a quarter of the context). Below a minimum, cut optional static parts, or show a
  notice ("Your context of 4,095 tokens is too small for Story Suite; 8k or more recommended"). Also say so in the guide.

### B-final-2 [severity: high] Deleting an earlier reply skips a later reply's whole block when it stored party pools as whole values (rest heal and its claim lost, PC left at 0 HP)

- **Repo:** rpg_battle. **Owner area:** party pools in capture/commands (rest, heal, level-up), with Story Block's replay
  (`store.js` `replayRecord`: a block that fails validation is skipped as a whole).
- **Repro (test):** `tests/rpg_battle/final-cut-levelup-drops-rest.test.js` (+ `helpers/suite-final.js`).
  1. Fights in reply A level Wessel up (max HP 98 → 102).
  2. Reply B wounds him; reply C (`! rest long`) heals him to 102/102.
  3. Delete reply A (not the last).
- **Expected:** the state is A's removal applied under B and C. C's rest still heals and keeps its `rest:<sid>` claim.
- **Actual:** C's stored `hp.cur: 102` is over the new max of 98. The block fails "HP/MP/SP must be whole numbers with
  0 ≤ cur ≤ max" and is skipped whole: Wessel is at 0/98 HP after a rest that is still in the chat, and the claim is
  gone. A reload replays the same way, and the next checkpoint stores it.
- **Live:** this is what made the soak's n300 check fail. A `/cut` at step 269 removed message 326, and message 329's rest
  block was skipped, rest claim with it. The checkpoints at 429 and 545 then stored the state without it.
- **Invariant:** 2 (a delete restores the state of that point; later replies' changes go on top of it) and 7.
- **Suggested fix:** store pool changes as deltas (or clamp on replay: a pool `cur` over the replayed `max` is taken as
  `max`), so a block stays valid when an earlier reply is removed. More generally, Story Block could replay a failing
  block op by op and skip only what does not apply, rather than dropping the whole block.

### B-final-3 [severity: medium] Deleting an earlier reply drops a later reply's world line (chronicle.seen written whole with rounds from a deleted cue)

- **Repo:** Story_director. **Owner area:** chronicle. `src/v2/chronicle/pick.js:131` (`surface`: raises `round`, writes
  `seen` whole as a slot) and `src/v2/chronicle/domain.js:236` (validation: `seen[id] ≤ round`).
- **Repro (test):** `tests/Story_director/final-cut-surface-drops-later-block.test.js`, Story Director alone.
  1. Four ongoing world events, then a few replies.
  2. The last reply writes `- world Salt Tax Riots — the riots burn out`. Its carrier before holds the
     `chronicle.surface` cue (round 71).
  3. Delete that earlier carrier.
- **Expected:** the riots stay resolved; no stored change of the later reply is skipped.
- **Actual:** the round goes back to 70. The later block's `seen` (written whole with 71s) no longer validates
  ("chronicle.seen[…] must be a round so far"), and the whole block is skipped: the event is ongoing again, along with
  anything else in that block. Found by a testkit fuzz of the soak generator (seed 4, step 277; the quest, item and
  faction lines in that block were lost too).
- **Invariant:** 2 and 7.
- **Suggested fix:** do not validate `seen` against `round` on replay (clamp `seen[id]` to `round`), or make `seen` and
  `round` scratch that is recomputed. A later reply's world lines should never depend on a pre-generation cue that a
  delete can take away.

### B-final-4 [severity: medium] A save that times out on the page but is written late by the server overwrites a newer save

- **Repo:** Story_block. **Owner area:** persistence. `src/v2/persist.js:378-396` (`answered`: aborts after 20 s and the
  saver moves on) and `src/v2/persist.js:450-492` (`saveNow`).
- **Repro (test):** `tests/Story_block/final-stale-timeout-save.test.js`.
  1. A change's save reaches the server but is not answered; a newer change follows.
  2. After 20 s the page aborts, retries, and the retry (both changes) is written.
  3. Then the server writes the first request.
- **Repro (live):** `harness/break-scripts/probe-save-race.mjs` on the soak chat (12.9 MB). Hold the first save 26 s
  (ignoring the abort, as an uploaded body is), add "Probe Alpha" then "Probe Beta".
- **Expected:** the newest change is on disk, or the saver notices and writes it again.
- **Actual:** the file ends with Alpha and without Beta. The saver counts both as saved (`dirty()` false), so nothing
  writes the file again; a reload loses Beta.
- **Invariant:** 7 (saves never lose a reply's state).
- **Likely when:** a slow link or server with large chats. The soak uploaded 44 MB per send at 1,500 replies.
- **Suggested fix:** after a save that timed out, treat the next successful save as unconfirmed. Write again once more
  after a delay longer than the timeout, or read the file back and compare. Better: send a save sequence number (in
  `chat_metadata`) and have the page re-save when it reads back an older one. SillyTavern's integrity slug does not
  catch this (both requests carry the same one).

### B-final-5 [severity: low] Every Feature switch flip throws `root.querySelectorAll(...).find is not a function`

- **Repo:** Story_block. **Owner area:** settings UI. `src/v2/host-ui.js:253` (`setFeature`: `.find` on a NodeList).
- **Repro (live):** Story Suite settings → Features → flip any switch. 27 page errors in the soak, one per flip. The
  testkit's fake DOM returns arrays, so the existing tests pass.
- **Repro (test):** `tests/Story_block/final-feature-switch-nodelist.test.js` hands `renderSettingsHost` a NodeList-like
  result.
- **Expected:** no throw; the switch keeps the focus.
- **Actual:** the choice is stored and the overlay redrawn, then the handler throws; the focus is lost and an
  uncaught page error is logged.
- **Invariant:** 4.
- **Suggested fix:** `[...root.querySelectorAll(…)].find(…)`. This is the only `querySelectorAll(…).<array method>` in
  the four repos' `src`. Let the fake DOM return a NodeList-like object so tests catch the next one.

## What held up (no need to repeat)

- 1,500 replies with every merged kind, 0 stuck generations, 0 exceptions to the reader apart from B-final-5, no
  markup or script from model text running (`window.__pwned` never set).
- Invariant 1 through the real runtime: 17/17 snapshots from 500 on, and 7/7 reloads with a byte-identical head.
  That includes 185 swipes, 92 regenerates, 44 Continues, 46 end deletes, 20 middle cuts, 33 edits (one strips the
  hidden comment, one adds `+ coin 9000`), 9 rewinds onto branches and 27 Feature flips.
- Rewind (`sdk.rewind`) on the last carrier: 9 branches made and opened, with live == file afterwards.
- Static prompt part byte-identical for all 1,500 requests, Feature flips included. The tail stayed within its own
  budget wherever it was sent.
- Rename mid-save: no ghost file (see above).
- Storage: −86% file size and −87% upload per send against the earlier soak at ~1,200 replies. Capture, build and
  send→request are all well below the earlier soak in both comparable windows.
- Hostile numbers, names and kinds in change lines (NaN, 1e308, `toString`, 80-item loot, `wear: -999`, `refine: +99`,
  `mod: +99`, `rank: SSS`, …) became Problems or LIMITED clamps, never a throw. Coin per reply stayed clamped (81
  LIMITED).

## Harness changes on this branch

- Merged the newer harness lineage (break rounds b1–b7 and the beta generator) into this branch's earlier soak scripts.
- `gen.mjs`: recipe, refine, repair, milestone, key items, `=N` meters, `met:`, more loot for real recipes.
- `soak.mjs`: Continue, middle cuts (`/cut`), rewinds (switches to the branch), progress into `final/progress.md`
  (`PROGRESS_DIR`).
- `rebuild.mjs` + `suite-host.mjs`: the rebuild check now also replays the file through the real runtime (validators,
  replay rules) and saves its report next to each snapshot. Without validators, a block the runtime skips looks like a
  live-vs-file mismatch (how n300 first showed).
- `probe-save-race.mjs`: the live save-race probes. `compare-final.py`: the comparison chart.
- Chat files are not committed (the final chat is 12.9 MB).
