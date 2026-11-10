# LEAN2-RPG — prompt diet step 2, RPG part (USER 3 Nov: run step 2 concurrently)

Read ../PROMPT-AUDIT-REPORT.md (cuts #4 and #5: RPG static 5,197 chars every reply — module descriptions 1,274,
skills learn/practice ×5 945, foes ×4 slots 1,004, [COMBAT SYSTEM] 1,183, character 358, party 232, header 201).
Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/lean2rpg/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned changes
named (prompt-byte pins WILL move: name each), a test per change run after it, `npm run check` + full `npm test` +
`git diff --check origin/main HEAD` green before push; timing tests may fail under load — re-run alone once; PID files;
never pgrep -f/pkill -f). If any command is denied, stop that step and report it; never re-run it in another form.
EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage60/gear-release (latest). Branch `stage59/lean-rpg`. Another agent (LEAN1-SB,
stage59/lean-sb) is changing the planner gate/head and SB's header/money/tail — do NOT touch precall.js's planner text,
domains/index.js header/money lines or tail.js; keep to the data-module prompt for the RPG blocks and lean-rpg rules.
1. One template line per slot family instead of the same grammar written per slot (skills learn-1..5/practice-1..5,
   foes set/hurt/clear ×4): e.g. "~ dm skills — why | kind: learn-N | … (N = 1..5)". The parser must accept exactly the
   same lines as today (no grammar change for the narrator's output) — prove with the existing capture tests.
2. Health/stage words listed once; shorter module descriptions (keep every rule a narrator needs); dedupe with the
   [Rolls] cue text.
3. Combat text ([COMBAT SYSTEM]), foes grammar and party grammar only while a fight is open (a foe group not Down) or
   the planner returned foes/rolls this reply; on quiet replies they are left out. Must be replay-stable: the same reply
   rebuilt gives the same prompt; and a fight that the narrator opens without a plan still parses (the foes kinds are
   always ACCEPTED, only their grammar text is left out of quiet prompts) — test that.
4. Old pinned blocks keep their stored prompt text (pins) — only new/active definitions change; check how templates are
   pinned and say what an existing chat sees.
Measure before/after chars (quiet RPG on, fight) and report. Report: head, per-cut savings, tests, pinned changes. Short.
