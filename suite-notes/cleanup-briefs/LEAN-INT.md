# LEAN-INT — integrate the prompt diet for Story Block 2.19.0

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/leanint/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG (the lead bumps), never weaken/skip/delete a test — pinned changes named,
`npm run check` + full `npm test` + `git diff --check origin/main HEAD` green before push; timing tests b1r2-capture /
settings B8 may fail under load — re-run each failing one alone once and report; PID files; never pgrep -f/pkill -f).
If any command is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main (233b131, 2.18.0). Branch `stage62/lean-int`. `git merge --no-ff`, in order:
1. origin/stage59/lean-sb (7d786fe: planner gate, planner head, SB header/coin/look/Carried trims, kind `heads`)
2. origin/stage59/lean-rpg (0e6a173: slot-family grammar, shorter Standard texts, quiet replies, deterministic
   legendary test)
3. origin/stage59/lean-lore (607c037: Ersveil lore trim + keyword triggers; bump the pack to 2.6.1 in pack.json and
   ERSVEIL.md/AI-README sample-pack lines and the Ersveil tests that pin the version; rebuild the zip)
Resolve conflicts keeping both sides (both touch prompt.js/registry.js/turn.js/part.js/precall-related tests and prompt
fixtures: regenerate fixture hashes only where the merged prompt legitimately changed — name each).
Then measure the merged result exactly like the audit (static + tail, quiet RPG off / quiet RPG on / fight, planner call
or not): use the testkit host with Ersveil lore, or reuse $S/paudit's harness on ports 8300/8400 with this checkout
(PID files; stop after). Report: head, conflicts and resolutions, the measured table vs the audit's (14.5k / 20.0k /
21.2k OURS; planner every reply), pinned changes, counts. Short.
