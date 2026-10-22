# Story Suite v2: beta-candidate breaker pass, report

## Heads tested (branch `v2`)
| repo | head | previous pass |
|---|---|---|
| Story_block | 6ae03aa | 81b5da3 |
| rpg_battle | 73b3cbb | 3510b50 |
| Story_director | ad7d396 | f18d77c |
| npc_state_delta | 37addac | 1156fd7 |

Breakers: a1 (new capture/display kinds + replay fuzz), a2 (economy and combat edges), a3 (live: settings and screens).
Totals: **critical 0 · high 0 · medium 14 · low 16** (a1: 6M 10L · a2: 6M 4L · a3: 2M 2L). There are 29 failing tests under `results/tests/<repo>/`, written to drop into `<repo>/tests/v2/break/` (NSD tests run with `--import ./tests/active-runtime-test-setup.mjs`, as that repo's suite does). The lead re-ran each one on a clean clone of these heads, and each fails on an assertion (0 setup errors). There were no duplicates across breakers or with earlier passes. The one-line list is in FINDINGS.md.

Each finding's full write-up (BREAK_BRIEF format: repo, file:line, exact repro, expected vs actual, invariant, suggested fix) is in that breaker's report, linked below. They are kept verbatim so the line references stay right.
- a1, capture/display kinds and replay fuzz: [breakers/a1-REPORT.md](breakers/a1-REPORT.md) (B-a1-1..16)
- a2, economy and combat: [breakers/a2-REPORT.md](breakers/a2-REPORT.md) (B-a2-1..10)
- a3, live settings and screens: [breakers/a3-REPORT.md](breakers/a3-REPORT.md) (B-a3-1..4)

## Lead summary, by theme
- **Stray change lines (#123) take too much and too little.** a1 found 7 findings here. The stray reader takes dialogue ("+ coin 5, she said"), code fences, quotes and HTML blocks, and cuts them out of the story, which pays coin from prose (medium ×2). Near-miss dashes and `+ coins` are neither taken nor reported. Live capture and Re-read disagree after Continue, after a stop, and when a line contains a `<Changes>` tag. The hidden comment's "--" → "- -" rewrite makes even an unedited Re-read change names (medium).
- **Budgets that can be scaled from outside.** A long rank ladder multiplies the per-reply money budget about 3 million times (B-a2-1). A story line that names a pack item gets round the new story-goods sell cap (B-a2-2). Neither comes from model numbers, but both let a reply mint far beyond the budget the rules intend (invariant 3).
- **Per-reply limits that reset or move.** SD maxJump resets on Continue (90 days in one reply). NSD's meter cap window is keyed by message index and moves on a middle delete. A story-time heal survives a Re-read that removes its time.
- **Fight composition.** A 7th-row boss is dropped. Counts over 9 are cut without a Problem. Quest sizing is per row, so the 24 cap doesn't hold. Stunner waves can exceed the field cap. Pack creatures are never used, so a quest for a pack material never progresses.
- **Coins (§F108).** Item-vs-money forms are inconsistent, a missing currency name pays copper, and SD reads coin rewards too low.
- **Live: diagnostics privacy and unload.** The report carries story names and three key shapes. Keepalive's size check counts characters, not bytes, so non-English chats are not saved on close and the reader is not asked.

## What held up
- **Replay (a1):** 125 seeds, 37,315 steps, 17,391 replies with all four modules and Ersveil. Swipes, swipe-back, middle and last deletes, rewinds, Continue (split blocks too), edits, Re-read, reloads, and Feature/Choices/Chatter/Recovery/Coins toggles were all exercised. There were **0 divergences** between live and any of: cold rebuild, checkpoint-stripped replay, reload, swipe-back snapshot or prefix rebuild. Nothing threw, and choice or chatter lines never minted state. The pure capture fuzz (1M replies, 200k Continue pairs, 140k stops, 150k display) found only the filed classes. The owners' delete fuzzers (RB, SB qa, SD) pass with extra seeds. RB pools as counts and fights keyed by id held through middle deletes.
- **Economy (a2):** coins convert to the smallest unit before the budget on 8 money paths. Fuzzing 20,000 market records gave no throw, finite prices and environment tags within ±30%. Buy-low/sell-high between places is blocked by the paid-price cap. Duplicate `+ quest`, re-open, two quests sharing one delivery and finish/swipe/swipe-back all held. AoE rolls per target (40 fights). Flee mid-wave held. Cold rebuild matched live at 6 checkpoints.
- **Live (a3):** 5 module rows × 2 widths, 688 clicks, **0 page errors**, 0 console.error from our code apart from the known NSD dossier scan. There was no sideways scroll, no blank screen, and the markup markers never ran. These new screens worked: the assist profile dropdown (markup names, reload, deleted profile), the NSD scanner profile, lists as text (CRLF, 100/101 limit, 20k lines in 65 ms), the Features fold and filter, prompt-size clamps, the RB wizard (pick/unpick, cap, summary, toast, story released), the last fight in parts, and NSD Cast in the game view. Purify fix #120: checkboxes and radios are real controls live.
- **Not filed (observation):** with all four modules at defaults on SillyTavern's default 4,095-token context, every new chat starts with "context too small". This is the soak's B-final-1 area and is now told rather than silent.

## Previous pass's tests re-run on these heads (by the lead)
| test | result on these heads |
|---|---|
| SB a1-late-rescue-write, a1-late-save-chat-switch, a1-late-save-reload, a1-late-save-rename, a1-unload-behind-hung-save, f1-late-save-overwrites-newer | pass (fixed, #122 / #128) |
| SB a2-reread-after-vouched-click | pass (fixed, #119) |
| SB a3-purify-drops-input-type | still fails, but it's obsolete: it checks raw PURIFY_CONFIG. #120 restores control types after sanitizing (sanitize.js, testkit stPurify). a3 checks this live. |
| RB a2-boss-held-back | still fails, but it's obsolete: `combat.session` became `combat.fights[id]`. Checked by hand: `4 Wolf, Rat King (boss)` now fields Wolf A–C + Rat King, with Wolf D in wave 2. Fixed. |
| RB a2-prices-ignore-money-scale, a2-ranked-boss-below-strong | pass (fixed) |
| SD a3-alone-digest-says-fights, a3-map-centre-me-dead | pass (fixed) |
| Earlier cells' 27 c1–c4 tests in SB/SD/RB `tests/v2/break/` | all pass. `c4-rename-midsave` keeps its upstream todo (old-name ghost copy). |
