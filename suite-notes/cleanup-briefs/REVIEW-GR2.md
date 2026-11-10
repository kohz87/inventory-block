# REVIEW-GR2 — final Opus pass on the gear release (read-only)

Read-only reviewer. Clone Story_block into $S/rv-gr-final/ and read origin/stage57/gear-int (91e0146 or newer) against
origin/stage57/levels-release (9d1a41f) — that diff is the whole gear release (inventory side, narrator grammar,
screens, gear in rolls, signature cast gear, Ersveil items, and the G1–G9 fixes from rv-gr-1; see ../V2_LOG.md 3 Nov
and GR-INT.md). Verify G1–G9 are real and tested, and find any NEW correctness bug against the blocker bar in
REVIEW-GR.md: data loss, crash/wedge, wrong results (effective stat, wear, encumbrance, legendary, who owns the gear),
replay inequality (live == rebuild == reload == swipe == Re-read == middle delete), ANY byte change with gear off
(rolls, witnesses, receipts, prompts, screens), hidden-value leak. Special attention: G3 `recorded: true` (can a
narrator/command path pass it to bypass the gear switch?), G4 legendEarned reading Story Director threads, G7
`item.equip transfer:true` atomicity, the cue budget with wear (G6), packs.castGear via readSheet with RPG off, the
lazy-load shared set. Never read secrets or the USER's SillyTavern data; never pgrep -f/pkill -f; if any command is
denied, stop that step and report it. Run targeted tests where useful. Report per finding: file:line, repro, severity,
fix. Short.
