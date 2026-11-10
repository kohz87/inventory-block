# GR-UI2 — screens for bound gear + standard rows (Story Block 2.18.0; USER approved mockup v7 3 Nov)

Approved: https://claude.ai/artifact/DE52d6FCt7Zijwn1R1wKqc v7 ("Round 7 — Bound signature gear", plus all earlier
rounds). Local page $S/grm7/mockup.html; shots $S/grm7/shots/g7-*; the mockup's own patch code $S/grm7/run/g7*.mjs and
build7.py show the exact classes/CSS used — reuse them. USER change at approval: HIDE the rarity word on phone widths
(the name colour already shows rarity); keep it on desktop.

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/gru2/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes named, a test per change
run after it, `npm run check` + full `npm test` + `git diff --check origin/main HEAD` green before push; timing tests
may fail under load — re-run alone once; PID files; never pgrep -f/pkill -f; never `playwright install`). If any command
is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage58/gear-bind (a698231) — commit on it directly. All of this ONLY with gear on; gear off =
2.17.0 screens byte-identical (existing fixture test).
1. Standard item row (Inventory tab, every section while gear is on): line 1 icon, name, pencil, rarity word (hidden at
   phone width), slot chip; line 2 owner chip "Equipped · <who>" or lock + "Bound · <who>" (line kept at its height
   when empty); line 3 stat bonus, condition bar + word, note muted, one line, ellipsized. Compact Drop vertically
   centred; all rows the same height; same text left edge; same card border on every row.
2. Bound rows: no Drop; the chip carries the lock glyph (ph-lock-simple, as the mockup) and the reason as title.
3. Edit on a bound piece: name, count, slot, equipped-by disabled (app's disabled style); note editable; Save sends a
   note-only inventory.edit; hint line "Bound to <who>: it stays in this slot and leaves with <who>. Only the note can
   change."
4. Slot card: lock glyph in the top-right corner of bound tiles.
5. Refusal text on the reply card: use the code's sentence "Bound to <who>: <item> stays with them." (gender-neutral;
   the mockup showed "him" — keep "them").
Tests: row structure and equal-height classes, rarity hidden at phone width (CSS rule test), bound row has no Drop, Edit
disabled fields + note-only save round trip, slot tile lock, gear-off identical. Shots 1440 + 390 of your build in a
private ST copy (copy $S/grm7 into a NEW folder $S/gru2/st, ports 8290/8390, install your checkout, PID files) — compare
with $S/grm7/shots/g7-* and report differences; stop ST after.
Report: head, what changed, tests, pinned changes, shot paths, counts. Short.
