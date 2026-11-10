# LEAN1-SB — prompt diet step 1, Story Block part (USER 3 Nov: "plan step 1 after gear, run in parallel")

Read ../PROMPT-AUDIT-REPORT.md first. Goal: cut what every reply sends without losing behaviour. Ships after gear
(2.18.0) as part of the next Story Block release; built in parallel now.
Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/lean1sb/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned changes
named (prompt-byte pins WILL move: name each), a test per change run after it, `npm run check` + full `npm test` +
`git diff --check origin/main HEAD` green before push; timing tests may fail under load — re-run alone once; PID files;
never pgrep -f/pkill -f). If any command is denied, stop that step and report it; never re-run it in another form.
EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage58/gear-bind (latest — the gear release in progress; another agent commits screens there,
so branch off it and `git merge --no-ff` its newer head before you push). Branch `stage59/lean-sb`. No screen changes.
1. Planner gate (audit cut #9): the pre-reply dice planner runs only when (a) a fight is open (a foe group not Down), or
   (b) the reader's message reads as risky — a small static word list (attack, strike, fight, shoot, cast, dodge, block,
   parry, sneak, steal, climb, jump, persuade, lie, threaten, pick a lock, … and their -s/-ed/-ing forms; read the
   planner's own skill/stat words and the Combat rules for the right set), or (c) the last narrator reply opened foes.
   Otherwise no planner call and the reply goes on exactly as a no-roll reply does today. The decision is recorded so
   swipe/Re-read/rebuild repeat it (no new call on replay). Tests: quiet message → no call; risky word → call; open
   fight → call; replay equality.
2. Planner head (cut #10): shorten the planner's fixed text (~1,878 chars) to ~1,000 without dropping any field the
   parser needs; measure before/after; existing planner tests stay green (their prompt-byte pins move — name them).
3. SB static and tail (cuts #6, #8): shorter header; the coin rule once (it appears 3×); mount, weather and `you` lines
   only while their feature is on; the "Your look is not set yet" nag at most once per chat (or until set — choose the
   lighter and say), "Carried" without the "(found at X)" provenance in the prompt (the screens keep it). Measure each.
Report: head, before/after characters per cut (quiet RPG off, quiet RPG on, fight), tests, pinned changes. Short.
