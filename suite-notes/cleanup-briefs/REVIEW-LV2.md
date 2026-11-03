# REVIEW-LV2 — final Opus pass on the levels release (read-only)

Read-only reviewer. Clone Story_block into $S/rv-lv-final/ and read origin/stage57/levels-release (12c4954 or newer)
against origin/main cea0b4b. Earlier reviews (rv-lv-1/2/3) found B1–B14 and follow-ups; LV-INT says all B-items are
fixed with tests (see ../V2_LOG.md 3 Nov entries). Your job: (1) verify each B1–B14 fix is real and tested; (2) find
any NEW correctness bug introduced by the merge/fixes (the XP overflow `rise` field and multi-level rule, the lazy
guard mark `rpg:missing`, the bounded import wait, the computed receipt summary, levelled-only witnesses, character
files with `level`, levelCapFor via packLevelsOf, the Ersveil 2.5.0 data). Blocker bar as in REVIEW-LV.md (data loss,
crash/wedge, wrong results, replay inequality, RPG-off prompt bytes changed, hidden-value leak). Never read secrets or
the USER's SillyTavern data; never pgrep -f/pkill -f; if any command is denied, stop that step and report it. Run
targeted tests where useful (the lead is running the full suite). Report per finding: file:line, repro, severity,
fix. Short.
