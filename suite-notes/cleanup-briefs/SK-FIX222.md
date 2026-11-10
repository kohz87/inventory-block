# SK-FIX222 (4 Nov) — fixes from rv222-skills ($S/rv222-skills/REVIEW.md, read it first; probes in $S/rv222-skills/probes/)
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, PID files, no playwright install, never use USER chats). If any command is denied, stop
that step and report it; never re-run it in another form. Shared machine: --test-concurrency=2, timing flakes alone.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/sk-fix222/Story_block; commit on `stage66/skills` (d81df59) and push. No version bumps.
Blockers (each with the review's repro as the test; old chats made on main with the reviewer's make-old*.mjs):
- B1 Re-read of a pre-2.22 join: when the standing Skills pin has no `sig`, build from a frozen copy of the 2.21 Skills
  templates (Classic + Standard), seed nothing. Fields, pin, problems unchanged.
- B2 castSeeds Re-read branch: `if (!marked) return [];` — old join+learn Re-read keeps learn receipts, no Problems.
- B3 Re-read seeds come from the standing pin's definition defaults (bits in sig.default), not the standing fields
  (P-pencil probe passes).
- B4 grow only when a line would otherwise be refused for lack of a slot; on Re-read grow only if the standing state
  holds the grown pin (old Lv 30 chat Re-read unchanged).
Follow-ups to fix now (one test each):
- F1 Ask mode: Re-read of the offer reply keeps the offered skills; "Edit first" cannot rename/re-stat/remove
  signature skills (pencil rules apply) and writes the receipt tiles.
- F2 charfile import keeps up to 8 skills after a level drop (no slice to current skillSlots; extra slots kept).
- F3 tailRoom reserves the extra room only for slots that hold a skill; CHANGELOG and RPG.md give the same measured
  number.
- F4 refusal text after a level drop when all 8 are full says so (no "next slot opens at Lv 40").
- F7 the growth refusal lists only learn kinds the block has.
- F8 check on origin/main (a2d57b1) whether a Re-read of the opening reply that holds the dm.define clicks removes
  the dataModules domain. If main does it too, STOP and report with a repro (it may be a 2.21.1 fix); if only this
  branch does, fix it here.
Full suite at the end, npm run check, git diff --check. Report: head sha, items, tests with counts, F8 finding.
