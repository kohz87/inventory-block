# CARD-NSD — NPC State Delta 1.9.0: card settings + 1.8.1 follow-ups (read CARD-COMMON.md first)

Repo kohz87/npc_state_delta, base origin/main 120b8a1 (1.8.0), branch `stage65/card-nsd`, clone $S/card-nsd/. Full suite:
`npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js tests/v2/break/*.test.js`
The b1r2-capture and "B8 Reset" timing tests can fail under load; re-run them alone once and report.

**Build:**
1. **Register card settings.** When `StoryBlock.sdk.registerCardSettings` exists (Story Block 2.21.0 adds it, built in parallel; code against the contract in addendum D and test with a fake sdk), register:
   - owner `npc-state-delta`, label "NSD";
   - keys `portraitPromptFormat` (label "NSD portraits", `valueText` = the format's own UI name, e.g. "Natural"; `valid` = one of the formats `normalizePortraitPromptFormat` accepts) and `scanEvery` (label "NSD scan every", valueText "5 replies", valid = its own range).
   - `read` returns the current setting. `apply` persists exactly as the "Save prompt settings" button and the scan setting do: the mockup found that setting the select alone did not persist. Re-read after a reload in a test.
   - Unregister on unload. With an older Story Block, do nothing.
2. **1.8.1 follow-ups** (from the Opus re-check rv-nsd5 of 1123f9f):
   - (a) "Clear every dossier" keeps `scanCount` at max(1, previous), so that Clear followed by a swipe or fail-closed restore on a short chat does not re-read older replies. Behavioural test: Clear, then swipe, then the next scan reads the latest reply only.
   - (b) Portrait species: match the head noun as a whole word with no hyphen split. "elf-hound" must not become "elf-hound woman", and "troll bridge" must not become "troll bridge woman"; "half-elf", "fox-beastfolk", "elf ranger" and "high elves" stay as in 1.8.0. Add tests.
   - (c) If small and safe: a manual scan, a full-cast Refresh or a narration-capture should not move the marker past replies that are still waiting (L2a). Otherwise leave it and say so.
3. **Version 1.9.0** in manifest and package, with a CHANGELOG entry. "Requires Story Block 2.21.0 for card settings" goes in the notes only; NSD still works with an older Story Block.

Check that quiet-reply scanner bytes and Lean call counts are unchanged versus 1.8.0 (stage9 fixtures untouched).
