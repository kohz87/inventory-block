# LEAN1-NSD — prompt diet step 1, NPC State Delta part (USER 3 Nov)

Read ../PROMPT-AUDIT-REPORT.md first (cut #11: the dossier scanner is a second full call every reply, 7.6–10.8k chars,
~6.5k of fixed rules; scanEvery 1 by default).
Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/lean1nsd/, push only your branch, never
merge/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes named, a test per change
run after it, `git diff --check origin/main HEAD`; never pgrep -f/pkill -f). If any command is denied, stop that step and
report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo https://github.com/kohz87/npc_state_delta, base origin/stage56/cast-gear-line (bbaf869, 1.7.4 in progress).
Branch `stage59/lean-nsd`. Full suite: `npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test
tests/*.test.js tests/v2/break/*.test.js`.
1. Scanner cadence: run the dossier scanner only when the latest reply names someone new or a tracked NPC whose
   dossier would change (a cheap local check first: new capitalised names / known names present / NPC State lines), else
   skip; plus a safety scan every N replies (N = the existing scanEvery setting, default raised from 1 to 5 — say if a
   setting row would need a UI change; if so keep the default change only and no new row). Recorded so replay doesn't
   re-call. Tests: quiet reply with no names → no call; a new name → call; every-N safety.
2. Scanner fixed rules: shorten the ~6.5k fixed rules text without losing any field its parser reads; measure
   before/after; parser tests green.
3. Dossier text (cut #7, small): merge the 4× repeated 62-char secrets prefix into one line.
Report: head, before/after chars, calls saved per 10 replies in a quiet scene, tests, pinned changes. Short.
