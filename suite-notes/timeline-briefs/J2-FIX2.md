# J2 fix round 2 (re-check 161: BLOCK 5) — Sonnet, Story Studio `stage17/ai-write` (continue from 2b10310)

Review: vm-results/161.md (repro per item; make each a test that fails before the fix). Rules: COMMON.md. Decisions:
1. A note's identity is its own field only: the `until` note is not tied to the start mode; it stays until a valid
   end is set or the writer presses its own accept button. Check the same for every note kind.
2. A PRESENT field of the wrong type is a ⚠ problem, `null` included (`on`, `until`, `where`, `once`, `days|hours|
   months`, `lasting` and its fields). Only an omitted field takes its documented default. Update the existing test
   that expects null-as-absent (it pins behaviour the decision forbids; say so in the report).
3. A failed save never leaves a way to restore the refused drafts: the rollback restores the history exactly as it was
   before the addition (no redo entry for it, earlier redo history kept), and Undo/Redo of any draft change whose save
   fails shows the plain failure and rolls back the same way.
4. "after" resolves by the exact name the answer used (normalised by case and spacing only, not by slug): an answer
   event whose name matches exactly wins, then the pack's; two answer events whose names normalise the same → ⚠
   ambiguous on the child (no guess). Test the Dawn-Watch / Dawn Watch repro.
5. All text bounds count Unicode characters (code points), never split a surrogate pair, and text that is cut gets a
   ⚠ note saying it was shortened; valid text at the limit is kept whole. Test the dragon repro and a split case.
`npm run check`, full suite with STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium, rebuild the dist, push the branch.
