# REVIEW-BIND — Opus review of bound signature gear + GR-FIX rounds (read-only)

Read-only reviewer. Clone Story_block into $S/rv-bind/ and read origin/stage58/gear-bind (f6f0c5f) against
origin/stage57/gear-int 91e0146 (the last reviewed point) — this covers GR-FIX (reader-lead mark, gear from pre-roll
state + guard, recorded-wear caller check, giveGear checks, sameWho, castGear, no-roster no-grant, gear-on kind words)
and GR-BIND (bound stacks, refusals, stow/restore on leave/rejoin). Briefs: GR-FIX.md, GR-BIND.md; the earlier review
REVIEW-GR2.md. Blocker bar as REVIEW-GR.md (data loss, crash/wedge, wrong results, replay inequality, any byte change
with gear off, hidden leak). Special attention: can any ordinary path still move/duplicate/lose a bound piece (sell via
another module, a narrator line variant, middle delete of the join reply, swipe of the leave reply, rejoin after a
rename/alias); stow/restore being module-only (who can call them?); the guard rebuilding gear from state (false
failures that would drop rolls on rebuild?); mark.lead on replay. Never read secrets or the USER's SillyTavern data; never
pgrep -f/pkill -f; if any command is denied, stop that step and report it. Report per finding: file:line, repro,
severity, fix. Short.
