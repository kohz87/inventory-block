# SG-FIX222 (4 Nov) — fixes from rv222-startgear ($S/rv222-startgear/REVIEW.md, read it first; probes in
$S/rv222-startgear/sb/tests/v2/rvprobe/)
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, PID files, no playwright install, never use USER chats). If any command is denied, stop
that step and report it; never re-run it in another form. Shared machine: --test-concurrency=2, timing flakes alone.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/sg-fix222/Story_block; commit on `stage66/startgear` (8ca9566) and push. No version bumps.
Fix, one test each:
- B1 the kit is open only while no message after the opening greeting carries a Story Block reply record AND no reader
  message exists (head carrier still the first message). Test: [g,u1,r2(rare grant)] delete u1 → kit closed,
  legendary add refused; delete r2 too → open. Group auto-mode / narrator-only progress closes it too.
- F1 the 32 px input rule only at (min-width: 760px) and (pointer: fine); phone controls 44 px again.
- F2 greeting swipe: show the one-line hint "Starting kit belongs to this greeting" in the kit form (do not move data).
- F5 character export keeps hand-set slot and stats exactly (VIT+1 AGI+1 stays; chosen accessory slot stays).
- F6 groups as in the approved mockup: Count + Kind share a row, Slot + Rarity side by side, Bonus rows 0 spread,
  rarity word coloured, "Astra (you)". Compare against $S/startgear/mockup.html at 1440 and 390.
- F7 Kit Edit Goods→Equipment saves the shown rarity.
- F8 empty chat (no greeting): the kit reads closed and Add says one plain sentence why.
- F9 add the new add/edit words to the fuzz generator (CLAUDE.md rule 3).
- F3 and F4 WAIT for the lead's go (USER decision pending): do not build them until told.
Full suite at the end, npm run check, git diff --check, prompt bytes unchanged gear off/on. Real ST (8680/8681): B1
repro closed; shots of Add/Edit at 1440 and 390. Report: head sha, items, tests with counts.
