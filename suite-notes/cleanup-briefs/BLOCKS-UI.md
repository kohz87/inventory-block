# BLOCKS-UI — mockup (USER APPROVED 4 Nov with lead additions, https://claude.ai/artifact/EefsnTBrbvSeW5wL3QALFJ): better layouts for custom blocks and pack data-module tabs (USER 4 Nov)

**USER (screenshots, phone width):**
- "the custom block quest layout is horrible": a custom block, "Goals and quest history". Each quest is title, description, a big empty gap, its step, another gap, and "active" as bare text.
- "same goes for fame, which doesn't have a header": the Ersveil data module `fame` (Fame by region). 16 region rows, each "Name — ✎" with an empty bar under it and no values.
- "and guild (is it even necessary for them to exist as a visible block?)": `guild-membership`, shown as chips "Letter F", "Standing probation", then "Yearly dues (copper) 50" and "Years as a member 0".
- "and standing": `standing` (Standing with the powers), the same plain list.

**Mockup only.** Do not edit or push any repo.
- Rules: CARD-COMMON.md.
- Real Story Block from origin/main 2ee6318 in a real ST copy on ports 8370/8470, data built by copying into a new empty folder. Use the real Ersveil pack with RPG on, its 4 data modules enabled in the chat, and a little real data (a couple of fame and standing values set, guild registered).
- Also build a custom quest block like the USER's: use the Blocks screen / a block template the way a player would, with 2 quests carrying description, step and status.
- Find the code that draws these: the generic data-module/block layout (src/v2/data-modules/editable-layout.js, block-builder.js, block-templates.js, the screens) and the pack's own layout hints.
- Method as in $S/cardui and $S/grm7: "Today" is the live screen; "Proposed" is drawn with the app's own classes. Shoot at 1440×900 and 390×844, measure alignment, and write $S/blocksui/mockup.html (self-contained, under 16 MB, light/dark tokens) with a "Lead's recommendations" box at the top.

**Proposal to draw:**
1. **The generic layout** (helps every pack and custom block):
   - **A list of records** (quests) becomes compact cards:
     - line 1: title plus a status chip (active / done / failed, coloured);
     - line 2: the description, muted, clamped to 2 lines with tap-to-expand;
     - line 3: the current step with a step icon;
     - no empty gaps.
     - Active first; done and failed under a collapsed "Finished (n)".
   - **A map of numbers** (fame or standing by name) gets the module's name as a header.
     - Rows show name, value and a bar filled to the value, with the value word if the module defines one.
     - Only entries with a value or ever changed are shown. The rest go under a collapsed "Not known yet (n)", so 16 empty rows become a short list.
     - The pencil sits at the row's end, aligned.
   - **A record of fields** (guild) is a small card with a header and a 2-column label/value grid, not loose chips.
2. **Ersveil:**
   - Merge Standing, Fame and Guild into ONE "Reputation" tab with three sections: the Guild card at the top (Letter, standing, dues, years), Standing with the powers, then Fame by region. Fewer tabs, and each section has a header.
   - Find out whether the pack format can group several data modules into one tab today. If not, propose the smallest pack-format addition (e.g. `tab: "reputation"` on each module) and draw it.
   - Also show the alternative the USER hinted at: Guild hidden as a tab, its Letter shown only in the character's header pill ("Lv 1 · Guild F", which exists today) with tap-for-details.
   - Recommend one.
   - Court favour (`succession`), if enabled: the same treatment.
3. Today versus proposed for each, at desktop and phone.

**Report briefly:**
- the file path, and real vs drawn;
- whether grouping into one tab needs a pack-format change;
- where the code for each layout lives;
- measurements, and anything not shot.
