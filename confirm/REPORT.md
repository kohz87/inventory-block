# Story Suite v2 beta candidate: confirmation soak (600 replies, 16k context)

SillyTavern 1.19.0 + mock model, Chromium over raw CDP, instance `confirm` on 8262/5262, Ersveil pack 1.4.0
(`examples/packs/ersveil-bluewatch/pack.json`, coins copper/silver/gold, imported through the Packs panel).
**Context: SillyTavern's `openai_max_context` set to 16,384 (reply 300)**, through the connection panel's slider
(`SOAK_CONTEXT=16384`, `lib.mjs` `connectMock`). Story Block's interceptor received 16,084 (context − reply) in all 600
requests. The final soak ran at the default 4,095.
Run: `soak.mjs --replies 600 --seed 29 --reload-every 150 --window 200 --feature-every 50`. 649 steps in 57 min,
06:13–07:10 UTC.

## Code under test (`v2` HEADs)

| Repo | sha |
|---|---|
| Story_block | `6ae03aa642e842d67616ffa008aeb6ddd9414946` |
| rpg_battle | `73b3cbb999a4f311987917abe38a0f6896b8e1b0` |
| Story_director | `ad7d396aec03253e21501976b2fae7825b5b1344` |
| npc_state_delta | `37addac8a0a3580d57fadacbcfd56db0779fda34` |

## What the run did

| Action | Count | | Action | Count |
|---|---|---|---|---|
| send | 483 | | delete (last 1–2) | 23 |
| swipe | 62 | | edit | 16 |
| regenerate | 39 | | middle cut (`/cut`) | 8 |
| Continue | 16 | | rewind (`sdk.rewind`) | 2 (two branches; the run ended on Branch #2) |
| reloads | 4 (every 150 replies) | | Feature switches flipped (settings UI) | 13 |

**Generator** (`harness/break-scripts/gen.mjs`): the final soak's kinds, plus the kinds merged since then.

- **Coins:** `+ coin N silver`, `+ coin N copper`, `+ coin 1 gold`, `- coin N silver`. Sloppy: two coins in one line, `platinum`,
  `1.5 gold`, `Silvers`. Hostile: `999 gold`, negative silver. 178 coin lines.
- **Story XP:** `+ xp minor|major|milestone — why`. Sloppy: `~ xp`, `+ xp huge`, no size. Hostile: numbers and injected
  names. 53 lines.
- **`? choice` and `~ chatter`:** in about 30% of replies each: 445 choice and 381 chatter lines. About 1 in 10 of those
  sets is over the cap or hostile (6 choices, markup, an 80× text, no name).
- **Stray change lines** outside the block in 56 replies (about 1 in 10). 39 were valid lines in the last story
  paragraph or after the block. 17 were close but wrong (`+ itme`, `! encounter wolves`, `~ quest | met: yes`).
- **Quests straight to Active:** `+ quest` with no hook first. 10 such arcs, besides the hook → quest arcs.
- **Story-time moves** for RPG Battle's recovery: in 25% of replies, plus the makers. They step forward from 10 min to
  14 h (6 h and over is a full rest) and set the clock back by 30–300 min (12%). 150 extra moves.
- **Feature flips** in the settings UI, one every 50 steps. The cycle is `story-block.choices`, `story-block.chatter`,
  `rpg-battle.recovery`, `story-block.cards`, `story-director.digest` and `story-block.hud`. Choices and chatter were on
  for windows of 50–200 steps.

Totals: 3,252 block lines (1,604 valid, 426 sloppy, 227 hostile, the rest choice/chatter/time).

## Measurements per 200-reply window, next to `final/`'s first 600 replies

Same columns and method as `final/`: medians over replies the model was asked for (send/swipe/regenerate/continue).
Saves and MB are over send steps. Heap is after a forced GC. `final` rows are recomputed from `final/run/metrics.csv`
by `harness/break-scripts/confirm-table.py`. The final soak's rebuild used the store only until n500.

| Replies | Run | Saves/send | MB up/send | Chat file MB | Send→request ms | Capture ms | Prompt build ms | Heap after GC MB (max) | DOM nodes (end) | Rebuild == live |
|---|---|---|---|---|---|---|---|---|---|---|
| 1–200 | final (4k) | 3.98 | 3.05 | 1.76 | 598 | 239 | 191 | 180.5 | 18,592 | store 3/3 |
| 1–200 | **confirm (16k)** ¹ | 3.99 | 4.08 | 2.20 | 1,186 | 486 | 421 | 214.0 | 24,123 | runtime 3/3 |
| 201–400 | final (4k) | 4.11 | 10.60 | 3.90 | 1,316 | 815 | 736 | 242.2 | 22,450 | store 2/3 |
| 201–400 | **confirm (16k)** ¹ | 3.99 | 11.76 | 4.05 | 1,738 | 1,013 | 665 | 286.6 | 28,037 | runtime 4/4 |
| 401–600 | final (4k) | 3.81 | 15.86 | 5.24 | 1,804 | 1,306 | 1,124 | 238.3 | 19,178 | store 3/3 |
| 401–600 | **confirm (16k)** | 3.80 | 17.69 | 6.30 | 2,879 | 1,708 | 1,672 | 345.6 | 20,910 | runtime 6/6 |

¹ From reply ~1 to ~290, my testkit probes and fuzz (`nice 19`) shared the 4 CPUs. Window 1's times are inflated: its
prompt build is 3.3 ms per chat message against 1.6–2.2 in the clean stretches. Window 3 (401–600) ran on an idle
machine.

**Reading it:**

- **Saves per send are unchanged** (3.8–4.0). Upload per send follows the file (~2.8 whole-file saves per send).
- **The file is 20% bigger at 600 replies** (6.30 vs 5.24 MB) and has more messages (928 vs 891). The generator writes more
  per reply (choice/chatter lines stay in the hidden comment, more time moves). At the end, 4.17 MB of the file is
  `extra.storySuite`: ops 2.08, checkpoints 1.08, swipe_info copies 0.97, receipts 0.86. The head is 201 KB.
- **The 16k context is not what costs.** On the final 928-message chat, 6 sends at 4,095 and 6 at 16,384 alternated
  (`confirm-ab-context.mjs`, `run/ab-context.json`). Median send→request was 2,359 ms at 4k vs 2,190 ms at 16k, and the
  interceptor 1,682 vs 1,557 ms. The request grew from 14 to 123 messages, and its size from 12.7k to 42.6k characters.
- **Window 3 is slower than final's** (prompt build +49%, send→request +60%, capture +31%). Per chat message, build was
  2.15 ms against final's 1.50. A fresh page on the same final chat builds in ~1.6 s (≈1.7 ms per message). Within a
  page session, build per message rose from ~1.1 to ~1.8 ms between reloads (session 2: steps 326–485). This is the
  per-session cost `final/` also saw, on a bigger file. It is not a finding: 600 replies are too few to separate
  growth from noise, and no number ran away. Watch it in the 3,000-reply run.
- **Heap after GC** swings between 100 and 346 MB and drops again (236 MB at step 600 and 200 MB at 625, after the last
  reload). It is a sawtooth, not a steady climb. Its maximum is higher than final's (346 vs 238 MB).

Progress lines: `progress.md`. Raw data: `run/`. That holds metrics.csv per step, log, rebuild and reload results,
the summary, the generated replies and the A/B and save-race outputs. Chat files are not committed (the final chat is
6.3 MB).

## Rebuild checks (invariant 1): every ≤100 replies and at each reload

- **Rebuild through the real runtime == live: 13 of 13.** The runtime is all four modules plus the pack, with their
  validators and replay rules; the saved file is loaded as after a reload. Snapshots: n100, r150 before/after,
  n250, r300 before/after, n400, r450 before/after, n550, r600 before/after, and the final one.
  - My driver restarts the 100-reply count at each reload, so the checks fell at 100, 150, 250, 300, 400, 450, 550 and
    600. They were never more than 100 replies apart, but 200 and 500 themselves were not snapshotted.
- **The store-only rebuild matched live 13/13 as well.** Store problems after replay: 0. Swipe_info copies out of step: 0.
- **Reloads: 4 of 4 kept the head byte-identical** (sha before == after at 150, 300, 450 and 600). The last reload was
  on Branch #2, after two rewinds.
- The naive op replay (first checkpoint, later checkpoints ignored) differs from live after the first middle cut, as
  in `final/`. That is expected and informational.
- **Testkit fuzz of this generator:** `harness/break/confirm/fuzz/fuzz.mjs` drives sends, swipes, regenerates,
  Continues, end and middle deletes, fights and feature flips. After **every** step it loads the chat into a fresh
  four-module host and compares. **24 seeds × 200 steps: 0 mismatches.**

## Prompt and context (invariant 5)

- **The static part was byte-identical within each feature set.** `story-block.choices` and `story-block.chatter` carry
  prompt text, so each set has its own static part. That makes 4 sets, each with exactly one sha:

  | Prompt features on (besides the default ones) | Requests | Static sha |
  |---|---|---|
  | — | 208 | `69fbcbe5965d` |
  | choices | 72 | `d595c7148061` |
  | choices + chatter | 137 | `6e5787997681` |
  | chatter | 183 | `8cf83c8e0f69` |

  The static part changed 5 times, each on the first request after a choices or chatter flip. The other flips
  (recovery, digest, cards, hud) never changed it.
- **History fits: 0 of 600 main requests dropped history.** All 600 have a user message and the Story Suite tail. They
  carried a median of ~111 chat messages (max 128) and an estimated ~10.0–10.3k tokens (chars/4, an over-estimate) of
  the 16,084 allowed. As the chat grew, SillyTavern trimmed the oldest messages to fit, in 529 of 600 requests,
  as it should.
- **Tail:** median ~773 / 1,155 / 1,373 estimated tokens per window, max ~1,503. That max is chars/4, so it sits at
  the 1,500 budget within the estimate's rounding. No `CONTEXT_SMALL` notice at 16k (0).
- At 4,095 (the A/B above), the request now keeps 14 chat messages and the user message. B-final-1 holds.

## Console and Problems

- 0 stuck generations, 0 driver errors, 0 held-back sends, 0 browser relaunches, no memory pauses. **0 page errors**,
  with 13 feature flips through the settings UI (B-final-5 holds). `window.__pwned` was never set.
- Console errors: 630. 624 are NSD's `dossier scan failed … No message generated`, because the mock answers the extra
  call with nothing (harness-induced, as in `final/`). 6 are 404s for NSD's own files before they exist.
- Console warnings: 805. 62 are SillyTavern's swipe_info backfill; the rest are Story Suite saying why a line was not used.
- **Problems: 1,204.** `FEATURE_OFF` 468 are choice/chatter lines while the feature is off: a quiet Problem, as
  designed. Then rpg-battle REFUSED 139, NOT_FOUND 114; story-block INVALID 95; rpg-battle INVALID 74; npc-state-delta
  REFUSED 55; host UNKNOWN_KIND 48, UNREADABLE 46; story-block NOT_FOUND 43, LIMITED 40; host STRAY 4. All come from the
  generator's sloppy, hostile or close-but-wrong lines.

## Findings

Counts: **medium 2, low 1.** Each has a failing `node:test` under `tests/<repo>/` that drops into that repo's
`tests/v2/break/`. All fail on the shas above.

### C-1 [severity: medium] A change line written in the story and again in the block is applied twice (two fight offers, double items and coin)

- **Repo:** Story_block (capture). RPG Battle's encounter is where it shows most. **Owner area:**
  `src/v2/capture.js:474-488` (strayLines, fix-encounter #123) and `extractBlock` at `capture.js:330-334`. The lines
  taken from the story are appended after the block's lines, with no check that the block already has them.
- **Repro (test):** `tests/Story_block/confirm-stray-echo-twice.test.js`, core only. Run
  `Fenna hands it over.\n+ item Moonveil Trout | qty: 1\n\n<Changes>\n+ item Moonveil Trout | qty: 1\n</Changes>`.
  It gives 2 trout; the same reply with `+ coin 12` pays 24. Also `tests/rpg_battle/confirm-stray-encounter-twice.test.js`:
  one `! encounter 3 Cellar Rat — … | tier: weak | stakes: normal` in the story and in the block makes **2 fight offers**.
- **Expected:** one change. The line in the story is the same line the block lists.
- **Actual:** both are read; the hidden comment keeps two blocks with the same line. Re-read, reload and rebuild
  agree, so invariant 1 holds, and the double is permanent.
- **Why it matters:** this is the case fix-encounter was made for. A model writes the encounter (or item, or coin)
  line in the story and then lists it, which is a common habit. Coin stays within the per-reply budget (4 gold), but
  items and fights double.
- **Invariant:** 3 (the model's text makes more items and fights than the one change it describes) and 2/7 in spirit.
- **Suggested fix:** in `extractBlock`/`hideBlock`, drop a stray line whose normalized text (trimmed, decoration
  stripped) equals a line the reply's blocks already hold. Keep it out of the story either way, and tell it once as
  a quiet Problem ("written twice; read once"). An exact match is enough; two different lines stay two changes.

### C-2 [severity: medium] Deleting an earlier reply keeps a later reply's level-up that the remaining XP no longer reaches (a free level, points and HP; later XP swallowed)

- **Repo:** rpg_battle. **Owner area:** the party counters in `src/v2/party/pools.js:15-41` (level, xp, points as counts:
  "a later reply's level-up or spend adds its own step to what is there"). Story XP comes through
  `src/v2/party/capture.js:201-224` (`applyXp` → `grantXp`); fight XP shares the same path.
- **Repro (test):** `tests/rpg_battle/confirm-delete-keeps-unearned-level.test.js`.
  1. Reply A: `+ xp milestone`, `+ xp minor` ×2 (70 XP).
  2. Reply B: `+ xp milestone` (level 1 → 2, xp 20, +4 points, max HP 90 → 94).
  3. Reply C: `+ xp major` (xp 45).
  4. Delete A (not the last reply).
- **Expected:** B and C on top of the state before A. A chat of B and C alone gives **level 1, 75 XP, 0 points,
  max HP 90**.
- **Actual:** **level 2, stored xp −25** (shown as 0), **4 points, max HP 94**. B's stored step (level +1, xp −100 + 50)
  replays onto 0 XP. No Problem is raised, and the rebuild agrees with live, so invariant 1 does not catch it. The next
  award writes the fitted number (+10 → xp 10): C's 25 XP and the debt are gone, and the character keeps a level no
  reply in the chat earns.
- **Invariant:** 2 (a delete restores the state of that point, later changes on top) and 3 (code, not the model's
  deleted text, sets level and points).
- **Suggested fix:** keep XP as the only count and derive level-ups from it. On replay, a level step applies only when
  the replayed XP reaches the threshold (or level is recomputed from total XP, with points and pool max following the
  level). Alternatively, store an award as "+N XP" and let level-up happen in a derived step after every replayed block.
  Stored XP should never go below 0.

### C-3 [severity: low] `</Changes>` inside a change line closes the block early; the rest of the block and its closing tag show in the story

- **Repo:** Story_block. **Owner area:** block finding in `src/v2/capture.js` (`findBlocks`) and the display strip
  (`stripBlock`, `capture.js:337-346`).
- **Repro (live):** soak message 466 (step 329). The generator's hostile name `</Changes>` was in
  `? check athletics — x | dc: 1 | roll: 20 | result: success | who: </Changes>`. The reader saw two `? choice` lines
  and a bare `</Changes>` under the story. The quest line between them was read as a stray, and the choices were not
  read.
- **Repro (test):** `tests/Story_block/confirm-close-tag-in-line-leaks.test.js` (choices off and on). A block whose first
  line ends `| note: </Changes>` leaves `? choice …` lines and `</Changes>` in the shown text.
- **Expected:** a close tag that is not on a line of its own does not end the block (or the leftover lines and tag
  are hidden with it), and nothing of the block is shown.
- **Actual:** the block's tail and its close tag are shown to the reader. The item line after the early close is still
  applied (as a stray), so no state is lost.
- **Invariant:** 4 (the reader sees block text).
- **Suggested fix:** treat `</Changes>` as a close only when it is alone on its line (or at the end of the block's
  last line), as the open tag is. Otherwise, hide a trailing orphan `</Changes>` and the change lines just before it.

## What held up (no need to repeat)

- **The final soak's 5 findings are fixed.** Their `node:test` files pass on these shas: B-final-1 context fit,
  B-final-2 cut/level-up/rest, B-final-3 chronicle `seen`, B-final-4 stale save, B-final-5 NodeList `.find`. Live:
  - **0 page errors** with 13 Feature flips.
  - At 4k the request keeps history and the user message.
  - The save race on the 6.3 MB chat: with the first save held 26 s past its timeout, the newer change ("Probe Beta")
    was in the file after a reload, **2 of 2 runs** (`run/probe-save-race.json`). In one run the file held it only after
    the 6 s check.
  - Rename mid-save still leaves no ghost file.
- **Invariant 1** through the real runtime: 13/13 snapshots, 4/4 reloads with a byte-identical head, and 24 × 200 fuzz
  steps checked after every step. That covers 62 swipes, 39 regenerates, 16 Continues, 23 end deletes, 8 middle cuts,
  16 edits, 2 rewinds and 13 flips.
- **Coins:** silver, gold and copper are converted to copper. One reply gives at most 4 gold in total, across block
  lines, stray lines and a Continue (`9 gold` → 3 gold 7 silver paid; the rest refused). Two coins in one line,
  unknown coins, `1.5 gold` and negative amounts become Problems.
- **Story XP:** one major or milestone and two minors per reply, also across a stray line, a Continue and a swipe.
  Numbers written are never the amount; XP during a fight is refused.
- **Recovery** (`rpg-battle.recovery`):
  - 5%/h, and 6 h or more is a full rest.
  - A clock set back heals nothing twice.
  - Hours while the feature is off are never healed later.
  - Deleting the reply that moved the clock takes its heal back, though the heal is stored in the next reply's cue.
  - Rebuild == live throughout.
- **Quests straight to Active:** `+ quest` with no hook is active at once. A repeat or a case-changed name does not
  duplicate it, a hook after it changes nothing, and a failed quest can be taken again.
- **Stray lines:** 39 valid stray lines were taken and hidden. Close-but-wrong ones stay in the story with a STRAY or
  UNREADABLE Problem. Prose bullets ("- present company excluded") are not taken. Lines in the user's message, in
  `<think>` and far up the story are not read. The only visible block text left in the final chat is C-3's.
- **Choices and chatter:** 353 choice and 277 chatter lines are kept in the hidden comments, never in the story text
  (apart from C-3). Off, their lines are quiet `FEATURE_OFF` Problems, and the static part follows the switch exactly.
- **Context at 16k:** 600/600 requests with history, the user message and the tail; SillyTavern trims only the oldest
  messages.
- Hostile names and numbers in the new kinds (`999 gold`, `+ xp 99999`, markup in choices and chatter, 6 choices, an
  80-word choice) became Problems or cuts, never a throw.

## Harness changes on this branch

- `gen.mjs`: the new kinds above (coins, xp, choice and chatter, stray lines, direct quests, time moves with set-backs).
- `soak.mjs`:
  - `--reload-every`, `--window`, `--feature-every`, and the feature cycle (`SOAK_FEATURES`).
  - Per request: context size, history messages, user message present, estimated tokens, tail present, dropped
    history.
  - Static sha per prompt-feature set (read before the step's action).
- `lib.mjs`: `SOAK_CONTEXT` sets the context slider in `connectMock`. `confirm.env` is this instance's environment.
- `progress.py` / `progress.sh`: `SOAK_WINDOW`, a DOM-nodes column, the runtime rebuild count, a dropped-history
  column, and commit trailers.
- New: `confirm-table.py` (the comparison table), `confirm-ab-context.mjs` (4k vs 16k on one chat), `confirm-probe.mjs`,
  and `harness/break/confirm/` (fuzz and probes).
- **Note for the next breaker: `final/tests/rpg_battle/helpers/suite-final.js` gives every record the same id.** Its
  seeded `crypto.randomUUID` starts with `00000000-0000`, and Story Block's record id takes the first 12 hex digits
  (`sw_000000000000`). Per-reply budgets and claims in tests on that helper then span every reply: coin and XP look
  refused "in this reply" after the first one. The copy in `harness/break/confirm/fuzz/helpers/` is fixed. The repos'
  `tests/v2/break/helpers/suite-final.js` copies have the same `randomUUID`, so check them before trusting a cap test
  built on them.
