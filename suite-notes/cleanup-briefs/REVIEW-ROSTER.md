# REVIEW-ROSTER — Opus review of Story Block 2.18.1, the party roster (read-only)

Read-only. Clone Story_block into $S/rv-roster/ and read origin/stage61/roster (6c93286 or newer) against origin/main
233b131 (2.18.0). Brief: ROSTER.md. Lead decision after 6c93286: the roster answers only while gear is on (a small
follow-up commit may land while you read — fetch at the end and check it).
Blocker bar: data loss, crash/wedge, wrong results (who owns/wears gear, whose roll gets a bonus, signature gear grant/
bind/stow/restore), replay inequality (a 2.18.0 chat must rebuild byte-identical; live == rebuild == reload == swipe ==
Re-read == middle delete), any change for gear-off chats, hidden-value leak. Special attention: the id scheme (hash of
the block's module id — collisions? a block re-created with the same id after delete?), the registry `fallback` rule
(can a later module silently lose its own query? does an old RPG Battle chat still win?), party.pc choice vs the
persona, the guard's owner check (false failures that drop rolls?), the lazy stand-in answering before load, the
lazy-load size cap raise (80000 → 90000). Never read secrets or the USER's SillyTavern data; never pgrep -f/pkill -f;
if any command is denied, stop that step and report it. Report per finding: file:line, repro, severity, fix. Short.
