# REVIEW-GR — Opus review of the gear-in-fights branch (read-only)

You are a reviewer. Do not push, merge, or edit repos. Clone Story_block read-only into $S/rv-gr-<n>/ and read
origin/stage56/gear-fight (64f0685) against its base origin/stage53/levels-int 4eced17 (so you see gear only). Rules:
never read secrets or the USER's SillyTavern data; never pgrep -f/pkill -f; if any command is denied, stop that step
and report it. Design: GR-INV.md, GR-P2B.md, GR-UI.md (approved mockup https://claude.ai/artifact/DE52d6FCt7Zijwn1R1wKqc).
Note: 71 tests already fail at 4eced17 (levels fixes are landing on levels-int separately) — judge only gear changes.

Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results (wrong
effective stat, wrong wear, wrong encumbrance, wrong legendary), breaks replay equality (live == rebuild == reload ==
swipe == Re-read == middle delete), changes ANY bytes (rolls, witnesses, receipts, prompts) when the gear feature is off,
or leaks a hidden value. Check especially: the gear record in the predicate/guard (equip after a roll must not change
it; an old roll without gear replays), wear called from inside a roll (undo on swipe/Re-read/delete; double-apply on
rebuild?), owner matching by name, cap 30 and the −2 floor, ruin → broken only with gear on, legend mark.
Run the branch's gear tests where useful. Report: per finding — file:line, repro or reasoning, severity (blocker /
follow-up), suggested fix; then merge risks against the levels fixes. Short.
