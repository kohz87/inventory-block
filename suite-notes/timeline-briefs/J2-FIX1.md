# J2 fix round 1 (review 159: BLOCK 9) — Sonnet, Story Studio `stage17/ai-write` (continue on it from fbf4637)

Review: vm-results/159.md (each blocker has a repro; turn each into a test that fails before the fix). Rules:
timeline-briefs/COMMON.md. Lead decisions:
1. Draft problems belong to the field they are about. Recompute a draft's problems from its current content wherever
   possible (an unknown place is fixed when no unknown place remains; a missing "after" parent stays a problem until
   the draft follows an existing event; a dropped delay stays until a delay is set or the writer explicitly chooses
   "right after"). Editing one field never clears another field's problem. Keep stays disabled while any remains.
2. A malformed `when`/`on`/`until`/`where`/`once`/`days|hours|months` is a ⚠ problem with a plain reason, never a
   silent default ("any time", "anywhere", once). `once` must be a boolean if present.
3. The condition writer escapes every control character in quoted words (CR, LF, tab, others) or refuses them
   (`src/timeline/condition.js`), so no Studio path can write an unparseable condition; the answer reader also
   refuses control characters in names. Test both against Story Block's real parser.
4. An "after" naming a base name that both the pack and the same answer use binds to the answer's own event (the
   writer's intent in that paste) and the child shows a note saying which one it follows. Test the repro.
5. New event ids are unique across pack events AND drafts; selecting a row resolves drafts correctly; a draft can
   always be opened, kept or discarded. Test the repro (draft "New event" then "+ Add event").
6. Every conversion in the reader is guarded (no throws on hostile values; depth limit on nested values); any such
   value becomes a plain problem. Test both repros.
7. Bounds: the paste is limited (e.g. 200 KB, with a plain message), each field to its form limit before checking,
   and duplicate detection uses a Set. If saving the project fails (`writeDraft` returns false), the reader sees a
   plain message and the drafts are not added (or are rolled back) — never a silent loss on reload.
8. The whole prompt stays within 24,000 characters: trim in order places → existing events (keep a count) → lore
   names → regions, never the format/rules/idea; the fold says what was cut. Test the review's generator.
9. The JSON finder keeps scanning past arrays that contain no event-like object (e.g. "[1]") and reads the first
   array/object that holds events. Test the repro.
`npm run check`, full suite with STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium, rebuild the dist, push the branch.
