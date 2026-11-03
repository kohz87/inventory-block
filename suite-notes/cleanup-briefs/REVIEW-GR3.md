# REVIEW-GR3 — last Opus pass before the gear release (read-only)

Read-only. Clone Story_block into $S/rv-gr3/ and read origin/stage60/gear-release (f69c323 or newer) against
origin/stage58/gear-bind a698231 — the bound screens (GR-UI2: three-line rows, bound chip, locked Edit with note-only
save, slot lock, rarity hidden on phone) and the 2.18.0 release commit (versions, CHANGELOG, Ersveil 2.6.0). Earlier
reviews covered everything before a698231 (rv-gr-1, rv-gr-final, rv-bind). Check: gear-off screens byte-identical;
note-only save cannot change name/count/slot (the command sent); the template sanitizer/badge use (no injection of
item names into HTML); CHANGELOG claims match the code; version spots complete (grep 2.17.0 / 2.5.0 leftovers that
mean "this version"); Ersveil 2.6.0 validates and the zip is current. Blocker bar as REVIEW-GR.md. Never read secrets
or the USER's SillyTavern data; never pgrep -f/pkill -f; if any command is denied, stop that step and report it.
Report per finding: file:line, repro, severity, fix. Short.
