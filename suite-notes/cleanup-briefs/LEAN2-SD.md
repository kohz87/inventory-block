# LEAN2-SD — prompt diet step 2, Story Director part (USER 3 Nov)

Read ../PROMPT-AUDIT-REPORT.md (cut #3: Director 3,077 chars every reply — grammar for 14 kinds 1,567 + rule
paragraphs 1,510; sources src/v2/tracker/note.js, chronicle/note.js, checks/index.js; its Checks rule overlaps the RPG
planner).
Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/lean2sd/, push only your branch, never
merge/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes named (prompt-byte pins
will move), a test per change run after it, the repo's full test + check + `git diff --check origin/main HEAD` green;
never pgrep -f/pkill -f). If any command is denied, stop that step and report it; never re-run it in another form.
EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo https://github.com/kohz87/Story_director, base origin/main (2.9.3). Branch `stage59/lean-sd`. Testkit: SD tests use
SB's testkit (synced copy) — do not resync.
1. Compact grammar: one line per family instead of one per kind where the kinds share a shape; the parser accepts
   exactly the same lines as today (prove with existing capture tests).
2. Merge/shorten the rule paragraphs (keep every rule); say the Checks rule once and only when the RPG is off (when
   Story Block's RPG is on, its planner covers checks — read how SD knows; if it cannot know cheaply, keep it short).
3. Rare kinds (read which) only when the active pack/story uses them, or when a thread of that kind is open.
Target 3,077 → ≤ 1,200. Measure before/after; report head, savings, tests, pinned changes. Short.
