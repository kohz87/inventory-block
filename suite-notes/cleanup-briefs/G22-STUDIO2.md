# G22-STUDIO2 — Studio: screen tab grouping + Reset notice (read GEN22-COMMON.md first)
- Story_studio, base origin/main ec65db3 (0.8.0), branch `stage66/studio-tabs`. Browser tests use STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome. Do not bump versions (CHANGELOG "Unreleased").
1. **Screen builder:** the new optional `tab` and `tabTitle` on a pack screen (the GEN22 tab-merge contract).
   - Two small fields on the screen's settings: "Show in tab" (its own, or the id of another screen's tab, picked from the pack's tabs) and "Tab title" (when it starts a shared tab).
   - Studio's checker matches Story Block's rules (unknown tab ids, the title only on the first screen of a tab).
   - Export and import keep them.
   - Reuse existing Studio field styles; no new layout. If anything new is needed visually, stop and report rather than invent it.
2. **Reset notice:** when the browser refuses the IndexedDB delete during Reset card from pack, show the same notice as the other card-draft failures ("Only the card draft could not be cleared…"), instead of nothing. Test it with an injected failure.
- Tests, and shots of item 1 at 1440 and 390.
- Coordinate with G22-STUDIO (cast skills, branch `stage66/cast-skills`) only through separate files; do not touch the Cast form.
