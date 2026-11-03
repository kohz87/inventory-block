# GRM7 — mockup round 7: bound signature gear (USER 3 Nov: "put it in 2.18.0, draw the mockup")

Mockup only: no repo changes, no pushes. Rules: X-COMMON.md hard rules (secrets, user data, PID files, never
pgrep -f/pkill -f, never `playwright install`, never rm -rf copied data). If any command is denied, stop that step and
report it; never re-run it in another form.

The approved gear mockup is $S/grm/mockup.html (published v6; keep every existing section unchanged). ADD a new section
at the end, "Round 7 — Bound signature gear", built the same way (real SillyTavern shots with the app's own classes,
DOM patched only where the feature does not exist yet; shots as data URIs like the rest of the page). Use the gear
release build: copy $S/grst (it has the gear-int checkout installed and Ersveil 2.5.0 imported) into a NEW folder
$S/grm7/, ports ST 8280 / mock 8380 (change config.yaml and run paths), read $S/grst/run/gr.mjs for how to drive it.

Design (USER-approved behaviour):
- A pack NPC's signature items arrive equipped on that NPC when they join, and are BOUND: cannot be unequipped, given
  away, sold or dropped (narrator lines and Edit are refused with "Bound to Harrak"). Wear and repair still apply. They
  leave with the NPC; rejoin does not duplicate. With no party roster they are not handed out at all.
Screens to show (desktop 1440 and phone 390, light/dark as the app):
1. Inventory tab, EQUIPMENT section with Harrak's three items: the chip reads "Bound · Harrak" (a small lock glyph from
   the app's icon set before the text) in place of "Equipped · Harrak"; the rest of the row as the approved rows (rarity
   colour, slot chip, stat bonus, condition). The Drop button on a bound row is absent (or disabled with the reason as
   its title) — show the cleaner choice and say which in the notes.
2. Item Edit for the Long Watch Great Axe: Slot and "Equipped by" fields shown read-only (the app's disabled style) with
   one hint line under them: "Bound to Harrak: it stays in this slot and leaves with Harrak." Name/notes fields stay
   editable.
3. Harrak's slot card (Party → Harrak → Inventory): the three bound tiles carry the same small lock glyph in the tile
   corner; other tiles as approved.
4. The refusal as the reader sees it on the reply card when the narrator tries to move it: the existing "1 line not
   applied" summary expanded to "Bound to Harrak: Long Watch Great Axe stays with him."
Keep everything else as v6. Short notes under each shot. Measure that the chip sits where "Equipped · …" sat.
Report: file path, shot paths, choices made. Short. Stop ST and the mock (PID files; ports closed).
