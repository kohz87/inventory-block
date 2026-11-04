# BLOCKEDIT-UI — mockup (USER APPROVED 4 Nov with lead answers, https://claude.ai/artifact/6niZ3NLbACPKCbqc2yJoi4): custom blocks in the new layouts, from the block editor (USER 4 Nov)

Context: BLOCKS-UI (USER-approved, https://claude.ai/artifact/EefsnTBrbvSeW5wL3QALFJ; the files are in $S/blocksui) gives quest cards, numbers with bars and a field card. A player's own blocks get "numbers with bars" and "card of fields" from their shape. Quest cards need field roles. This mockup draws the block editor side.

**Mockup only.** Do not edit or push any repo.
- Rules: CARD-COMMON.md.
- Real Story Block from origin/main 2ee6318 in a real ST copy on ports 8370/8470; reuse $S/blocksui/st-data by copying it into a NEW empty folder, $S/blockedit/st-data.
- Code: src/v2/screens/blocks-editor.js, data-modules/block-builder.js, block-templates.js.
- Method as before: "Today" is the live editor; "Proposed" is drawn with the app's own classes. Shoot at 1440×900 and 390×844, measure alignment, and write $S/blockedit/mockup.html (self-contained, under 16 MB, light/dark tokens) with a "Lead's recommendations" box at the top.

**Draw, in Settings → Blocks → New block / Edit:**
1. **Starters** at the top of New block: "Quest log", "Reputation by place" and "Membership card", plus today's empty start.
   - Picking one fills the fields and the layout.
   - Show what "Quest log" fills: title, description, step, status (active/done/failed), giver, reward.
2. **"Layout"**: List of cards / Numbers with bars / Card of fields.
   - Preselected from the fields' shape, with a line saying why ("Your block holds a list of entries").
   - A choice that does not fit the shape is disabled, with its reason.
3. **Card roles**, for List of cards: three selects, "Title", "Status" and "Step", each pointing at one of the block's fields.
   - Status can map its values to colours: active, done, failed (and a custom value gets the neutral chip).
4. **"Show in tab"**: its own tab (default), or an existing tab (e.g. Reputation from Ersveil, Goals).
5. **A live preview** under the form, using the BLOCKS-UI card or bars layout (reuse the BLOCKS-UI drawn markup).
6. **Phone layout.**

Note what the stored block needs (e.g. `layout`, `roles {title, status, step}`, `tab`), and whether templates keep them. Find and list today's real editor fields.

**Report briefly:** the file path, real vs drawn, measurements, open questions, and anything not shot.
