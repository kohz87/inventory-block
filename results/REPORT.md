# Story Suite v2 beta — final combined breaker cell: report

## Status: BLOCKED (no code run)
Cloned `v2` of all four repos into /home/user/cell/:

| repo | HEAD |
|---|---|
| Story_block | 0a6ed63aefe62bc02405a0a5cf52606fb193d6d5 (#113 fuzz-cell fixes) |
| rpg_battle | a8eca8a6816952b59634fbf0ae147041315282b5 |
| Story_director | 9f59baf8483f18269bfc2f87afcb4c89d63171e3 |
| npc_state_delta | 1156fd72164ff223854097ed59d0ebf936d5dbd9 |

Running any of these repos' code (`npm test`, the testkit, the live harness) was refused by this session's
permission policy ("Code from External"). The beta sim cell hit the same block. I did not try to get
around it (that includes subagents). So none of the three angles (replay/saving fuzz, economy/combat
edges, live module matrix) ran. The session owner has to allow running these repos' code (a Bash
permission rule) before this cell can do its job; then re-run the brief as written.

What was done: the earlier cells' FINDINGS/REPORT were read for dedupe, and the new save code (SB #113:
persist.js `answered` timeout, rename re-save, chat-file.js `signal`) and the RB refine/resale pricing were
read statically.

## Candidates from the static read (unverified)

### F1-1 [severity: medium (unverified)] A timed-out save that reaches the server late overwrites a newer save
Repo Story_block, src/v2/persist.js createSaver `answered()` (#113) and the `exclusive` write chain;
src/v2/chat-file.js write() (`force: false`, same chat_metadata on every save).
Repro (testkit, fake server): the save of change Bo is held in transit; after 20 s `answered` aborts the
page's wait and calls it failed; the retry and then change Cy save fine (verify passes); the held request then
arrives at the server and is written. The file on disk holds Ann+Bo, without Cy. A real proxy or slow upload
delivers a request after the client abort, and SillyTavern's integrity check passes because the integrity
token is the same on both saves.
Expected: the newest change survives on disk. Actual (by reading): the stale body wins and nothing re-checks.
Invariant 7. Suggested fix: after a timed-out save, the next successful save is followed by a read-back
verify again a while later (or every save carries a rising sequence number in chat_metadata and the page
re-saves when a read-back shows an older one). Optionally keep `exclusive` held until the aborted fetch
actually settles.
Test: results/tests/Story_block/f1-late-save-overwrites-newer.test.js (NOT RUN; the mock ignores the abort
for the server side on purpose). Owner SB-storage.

### Known open: ghost copy under the old name after a rename mid-save
#113 says so itself ("the old-name copy stays: todo"); test.todo in tests/v2/break/c4-rename-midsave.test.js.
Owner SB-storage. Low.

### Lead to check (not written up)
rpg_battle src/v2/items/condition.js resaleOf: `Math.max(1, …)` sells any piece for at least 1. A piece
whose worth is 0 (a crafted or story piece valued 0) may then fetch 1 coin per sale. Whether such a piece
can reach a buyer was not traced. Owner RB-gear.

## What held up
Nothing could be exercised in this cell. The refine fee floor (repair.js planRefine: fee ≥ REFINE_STEP ×
maxResaleShare × worth) reads as sound against refine-and-resell profit, but it was not run.

## Still open from earlier cells (not re-checked here; re-run their tests on the heads above)
Fuzz cell: c1-wear-after-middle-delete, c2-spoof-marker-reread, SD c1-time-after-middle-delete (unfiled),
c2-cut-mid-reasoning, c2-hide-masked-body, c3-features-reread-off, c3-features-commit-after-off,
c3-features-whole-context-static, c2-coin-amount-forms, SD c2-time-jump-per-reply, c3-features-onblocked-off,
c4-slow-reread. #113 claims fixes for c1-swipe-delete-save-verify, c1-rewind-after-middle-delete,
c1-damaged-spans-append, c2-continue-split-block, c3-equipon-carry, c3-features-def-changed, c4-save-hang,
c4-rescue-pristine, c4-rescue-shifted, c4-rename-midsave (todo left).
Matrix cell: extractor-failed-no-note, SD digest-off-queries, digest-back-on, RB fight-left-condition-grows,
"bleeding 0" on the board, Days date twice.

## Pass 1 (code runs) — re-check of earlier cells' tests
Heads: Story_block 81b5da313635e3688aa96489bc8ed81b042b5c88, rpg_battle 3510b504d51b1f038dc48496b02766a87f86f8e0,
Story_director f18d77c01fd778469bb722e99871b7666163b455, npc_state_delta 1156fd72164ff223854097ed59d0ebf936d5dbd9.
Suites: SB 1864 tests / 0 fail, RB 1389 / 0 fail, SD 898 / 0 fail, NSD npm test passes.

F1-1 (late timed-out save) ran on 0a6ed63 and failed as predicted (file kept Ann+Bo, lost Cy). It is fixed in SB #115 (264e81c), and the upstream test passes.

| cell | repo | test | on these heads |
|---|---|---|---|
| fuzz | SB | c1-wear-after-middle-delete | FAILS |
| fuzz | SB | c2-coin-amount-forms | FAILS (11) |
| fuzz | SB | c2-cut-mid-reasoning | FAILS |
| fuzz | SB | c2-hide-masked-body | FAILS |
| fuzz | SB | c2-spoof-marker-reread | FAILS |
| fuzz | SB | c3-features-commit-after-off | FAILS |
| fuzz | SB | c3-features-onblocked-off | FAILS |
| fuzz | SB | c3-features-reread-off | FAILS |
| fuzz | SB | c3-features-whole-context-static | FAILS |
| fuzz | SB | c4-rename-midsave (old-name ghost copy) | FAILS (upstream keeps it as todo) |
| matrix | SB | c2-extractor-failed-no-note | FAILS |
| fuzz | SD | c1-time-after-middle-delete | FAILS |
| fuzz | SD | c2-time-jump-per-reply | FAILS |
| matrix | SD | c1-days-date-twice | FAILS |
| matrix | SD | c2-digest-back-on | FAILS |
| matrix | SD | c2-digest-off-queries | FAILS |
| matrix | RB | c1-fight-left-condition-grows | FAILS |
| fuzz | SB | c1-damaged-spans-append, c1-rewind-after-middle-delete, c1-swipe-delete-save-verify, c2-continue-split-block, c3-equipon-carry, c3-features-def-changed, c4-rescue-pristine, c4-rescue-shifted, c4-save-hang, c4-slow-reread | pass (fixed) |
| fuzz | SD | c2-fetch-quest-story-items | pass (fixed) |
| fuzz | RB | c1-effect-replies-after-delete | pass (was never a finding) |
