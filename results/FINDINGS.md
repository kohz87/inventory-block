# Beta final break cell — findings (newest first)

Format: `[severity] repo: title — test path — owner area`

## Pass 1 (in progress) — heads SB 81b5da3, RB 3510b50, SD f18d77c, NSD 1156fd7
Code runs now (permission granted). Three breakers running: replay/saving, economy/combat, live matrix.
- [medium] ~~Story_block: a timed-out save that reaches the server late overwrites a newer save~~ FIXED in SB 264e81c (#115); test passes (upstream copy tests/v2/break/f1-late-save-overwrites-newer.test.js) — results/tests/Story_block/f1-late-save-overwrites-newer.test.js — SB-storage
- Re-check of the earlier cells' 29 tests on these heads: 17 still fail, 11 fixed (+1 not a finding); table in REPORT.md.

Heads (v2): Story_block 0a6ed63, rpg_battle a8eca8a, Story_director 9f59baf, npc_state_delta 1156fd7.

## Pass 0 — 2026-10-22 — BLOCKED: this cell may not run the four repos' code
`npm test` in the clones was refused by the session's permission policy ("Code from External"), as for the
beta sim cell. No fuzz, sim, live run or subagent ran; nothing below is proven by a failing run.
Static-read candidates (tests written, NOT RUN — confirm before filing):
- [medium?, unverified] Story_block: a save given up after the 20 s timeout (SB #113) can still reach the server after a newer save and overwrite it (same integrity, abort cannot recall a sent request); verify already passed — results/tests/Story_block/f1-late-save-overwrites-newer.test.js — SB-storage
- [low, known todo] Story_block: a save in flight across a rename still leaves a ghost copy under the old name (#113 left it as test.todo in c4-rename-midsave) — tests/v2/break/c4-rename-midsave.test.js (todo) — SB-storage
