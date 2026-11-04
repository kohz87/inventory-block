# STARTGEAR-UI — mockup: add and set up your own equipment by hand (USER asked 4 Nov)

**USER problem:** "I cannot add equipment for beginning of game, unless I use the studio?"
- Today "+ Add item" (src/v2/screens/inventory-add.js) takes only a name, count and note.
- Edit offers Slot / Equipped by only for items that are already equipment (src/v2/view/widgets/editable.js, `gear`).
- The narrator can grant equipment (`+ item … | kind: equipment | slot: … | equipped: …`, docs/v2/GEAR.md), but the player cannot set it up by hand.

**Mockup only.** Do not edit or push any repo.
- Rules: CARD-COMMON.md (secrets, user data, PID files, no playwright install, the denied-command rule).
- Real Story Block from origin/main 2ee6318 (2.20.0) in a real ST copy on ports 8340/8440, data built by copying into a new empty folder.
- RPG on and Gear in fights on, with the real Ersveil pack, Astra plus a party member (e.g. Harrak from Ersveil) and a few items.
- Method as in $S/cardui and $S/grm7: "Today" is the live screen; "Proposed" is drawn with the app's own classes (injected DOM).
- Shoot at 1440×900 and 390×844 (phone), deviceScaleFactor 2. Measure alignment in the live DOM.
- Write $S/startgear/mockup.html (self-contained, base64 images, a 2–4 word title, light/dark tokens as in grm7, under 16 MB), with a "Lead's recommendations" box at the top.

**Proposal to draw (gear on; with gear off "+ Add item" stays exactly as today):**
1. **"+ Add item"** opens the same form as Edit (the widget's groups and fields style), not the inline row.
   - Fields: Name, Count, Note, and **Kind** (equipment, consumable, goods, quest, material; the inventory's own kind words and icons).
   - When Kind is equipment, more fields appear:
     - **Slot** (the eight places);
     - **Rarity** (common by default; the rarity colours/words the rows use);
     - **Bonus**: up to 2 stats, each with a value, held to the rarity budget (common 0 … legendary 4 points, the rules in GEAR.md). Show the "N of M points" line and a refusal when over budget;
     - **Equip on**: none, the reader, or a party member.
   - Save adds it and, if chosen, equips it.
   - Phone: the form is full width, with groups stacked.
2. **Edit** on an item the reader added (a custom item, not a pack definition) shows the same Kind / Slot / Rarity / Bonus fields.
   - A pack item keeps today's Edit, with one hint line: "Kind, slot and rarity come from the pack".
   - Bound signature gear stays locked as today.
3. **Result:** the new piece in the Equipment section with its rarity, slot chip and "Equipped · Astra", and in Astra's slot card.
4. Show one refusal: a bonus over budget ("A rare piece gives at most 2 points").

Note what is drawn and what is real. List the open questions, e.g.:
- should rarity above rare need a confirm?
- can a consumable carry a use (heal)?
Report briefly: the file path, real vs drawn, measurements, and anything not shot.

## Addendum (USER 4 Nov): starting kit only
To avoid abuse, the full setup (Rarity, Bonus) is allowed only while the chat is at its first message (greeting only, no player reply yet). After that, "+ Add item" still offers Kind, Slot and Equip on, but Rarity is fixed to Common with no Bonus, and Edit shows Rarity and Bonus read-only on hand-added items. Story-given items are unchanged. Rewinding to the first message re-opens the starting kit (a restart).
