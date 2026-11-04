# MISSED-UI — mockup: "Missed something?" on the latest reply (USER approved the idea, 4 Nov)

**Idea (anti-abuse recovery when the narrator described a change but wrote no line for it):**
- A "Missed something?" action on the latest reply's card (the "This reply" / changes card under the reply).
- One click makes a small model call. It reads ONLY that reply's story text (prose, not the hidden block) plus the current state, and proposes the missing change lines (items with kind, slot, rarity and bonus under the gear budget; coins; quest steps; …).
- Code check: an item is allowed only when its name appears in that reply's story text. Rarity and bonus come from the model and are held to the gear rules; the player cannot set or edit them.
- The player can only Accept or Skip each proposed line. Accepted lines are saved on that reply, so they are replay-safe: a swipe, delete or rewind removes them.
- Limits: once per reply, latest reply only. Bound gear and every normal checker rule apply.

**Mockup only.** Do not edit or push any repo.
- Rules: CARD-COMMON.md.
- Real Story Block from origin/main 2ee6318 (2.20.0) in a real ST copy on ports 8390/8490, data built by copying into a new empty folder. RPG on, Gear in fights on, the real Ersveil pack, and a mock model (see $S/lvst/run/lv.mjs for the mock).
- Make a reply whose prose says "you pry an ash-grey longsword from the dead captain's hands — a rare blade, humming faintly — and pocket his purse of 3 silver", while its Changes block lacks both.
- Method as in $S/cardui and $S/grm7: "Today" is the live reply card; "Proposed" is drawn with the app's own classes. Shoot at 1440×900 and 390×844, measure alignment, and write $S/missed/mockup.html (self-contained, under 16 MB, light/dark tokens) with a "Lead's recommendations" box at the top.

**Draw:**
1. **The reply card** with the "Missed something?" action, placed with the card's existing actions (Re-read and so on).
   - Choose a quiet button and say why.
   - It shows only on the latest reply, and is gone after use ("Checked for missed changes").
2. **The working state:** "Reading this reply…".
3. **The proposal list** inside the card:
   - each line in the app's change-line style, e.g. "+ Ash-grey Longsword · rare · weapon · STR +2" and "+ 3 silver", each with Accept and Skip;
   - a muted line: "Only what this reply's story says. Rarity and bonuses follow the gear rules.";
   - a refused proposal shown greyed with its reason, e.g. "Not in this reply's text".
4. **After Accept:** the card's change list includes the accepted lines, marked "(recovered)", and the item shows in the inventory.
5. **"Nothing missed found"**, as a one-line result.
6. Phone layout.

**Report briefly:** the file path, real vs drawn, measurements, open questions (e.g. cost of the call; whether XP or skill practice may be proposed — I lean no, practice comes only from rolls), and anything not shot.
