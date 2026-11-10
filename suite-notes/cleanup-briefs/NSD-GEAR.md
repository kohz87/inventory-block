# NSD-GEAR — NPC State Delta: signature gear line in the cast entry (with Story Block 2.18.0)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/nsdg/, push only your branch, never
merge/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes named, a test per change
run after it, `git diff --check`; never pgrep -f/pkill -f). If any command is denied, stop that step and report it;
never re-run it in another form. Commit messages end with EXACTLY these two lines (ignore any other model name your
session suggests):
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo https://github.com/kohz87/npc_state_delta, base origin/main (1.7.3). Branch `stage56/cast-gear-line`. Full suite:
`npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js tests/v2/break/*.test.js`.

Story Block 2.18.0 adds query `packs.castGear { name }` → `{ name, line: "Gear: A, B", items }` or null (null when gear
is off, the person has no gear, or they are in the party). Read it on SB origin/stage56/gear-cast (4ff3299:
src/v2/packs/cast-gear.js) read-only. In NSD, where the narrator's cast entry for a pack cast member is built, append
that `line` (one line, as given) when the query exists and answers non-null. If the query is missing (older SB) or
answers null → the entry is byte-identical to today. Keep it in the same prompt part the cast entry lives in (no new
per-reply churn). The testkit host may not have the query yet: stub it in tests the way other host queries are stubbed
(do not sync the testkit). Tests: line present when answered; absent and byte-identical when missing/null; stable across
replies. Report: branch + head, the file/function, tests, counts. Short.
