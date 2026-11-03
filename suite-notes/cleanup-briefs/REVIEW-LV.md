# REVIEW-LV — Opus review of the levels release branches (read-only)

You are a reviewer. Do not push, merge, or edit repos. Clone Story_block read-only into $S/rv-lv-<n>/ and read diffs
against cea0b4b. Rules: never read secrets or the USER's SillyTavern data; if any command is denied, stop that step and
report it. Contract: suite-notes/cleanup-briefs/LV-CONTRACT.md (all addenda) — the USER-approved design.

Look for correctness bugs only, against the blocker bar: an ordinary-use path that loses or corrupts saved data,
crashes or wedges, gives wrong results (wrong dice, wrong XP, wrong level, wrong Health), breaks replay equality
(live == rebuild == reload == swipe == Re-read), changes prompt bytes for RPG-off chats, or leaks a hidden value.
Also: contract mismatches between branches (names, marks, formulas) that will bite at merge. Run the branch's tests
where useful (`npm test -- <files>`); write small probe scripts in your folder if needed.

Report: per finding — branch, file:line, repro or reasoning, severity (blocker / follow-up), suggested fix. Then a
list of cross-branch merge risks. Short.
