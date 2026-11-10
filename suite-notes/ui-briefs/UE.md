# UE — Story Block: Export / Import a character (approved mockup, 1 Nov)

Read UI-COMMON.md (hard rules, trailer, no version bump/CHANGELOG, browser check, report). Repo kohz87/Story_block,
base origin/main f361c92 (2.12.0), branch `stage30/char-export`. Test ST port 8166. Mockup (approved with the USER's
change below): https://claude.ai/artifact/DjZaK87LySZjgmRKWTH21s; the script that drew it:
/home/user/inventory-block/vm-results/u3/mock.mjs (a guide only). Read docs/v2/RPG.md ("Making a character", Party).

USER, 1 Nov: "the import should be only the stats, unspent points, soul class, skills, inventory, money".

1. **Export** (RPG on): an **Export** button on each character card in the Party tab, next to Spend points/Skills.
   It opens a dialog "Export <name>":
   - Character (always): Soul Class, unspent points, the seven stats, up to five skills (name, what it does, stat,
     Stamina/Mana, rank). NOT name, You/companion, who they are, XP, Health/Mana/Stamina, practice.
   - Inventory (checkbox, on): the items that character carries (names, counts, notes, and any rarity/kind fields the
     inventory keeps), as the Inventory tab shows them for that owner.
   - Money (checkbox, on; only on the reader's own You card): the purse as its value in the money scale's base unit.
   - The "Not saved: …" line as in the mockup. Save writes `<name>.character.json` (the existing saveTextFile helper).
   - File: `{ "storySuiteCharacter": 1, "soul", "points", "stats": {str…cha}, "skills": [...], "items"?: [...],
     "money"?: <base units> }`, validated on read (limits as the RPG's own; unknown keys ignored; bad file = plain error).
2. **Import**: in **+ New character**, the Who step starts with "Start from a saved character … [Import file…]".
   After a good file: stats, unspent points, Soul Class and skills are filled (Stats/Skills steps show them; still
   editable within the normal rules, except ranks, which come from the file); name, You/companion and who they are
   are NOT touched; XP 0; the green note + **Undo import** as in the mockup. Review shows "Also adds: N things carried
   by <name> · <money> to the purse" (only what the file had and the reader left on).
3. **Create** with an import makes, in the same one reply's changes as today (one swipe takes all back): the Character
   and Skills blocks (Soul Class, points, stats, skill ranks from the file), the items carried by the new character, and
   the money added to the purse (shown in this chat's coins). The usual limits apply (carry limit, 8 blocks, changes
   per reply); anything that cannot be added is named in the window like today's "will not be added" notes, and the
   character is still made.
4. Fix: the New character window (and any RPG dialog over the Game view) is opaque: the party cards must not show
   through it.
5. Docs: docs/v2/RPG.md (Export / Import a character). Tests: file round trip, validation and refusals, import fills
   only the allowed fields, Create adds items + money in one reply and a swipe takes it back, RPG off = no buttons,
   opaque dialog CSS. Browser shots desktop + phone of each mockup step into `$S/ue/shots/`.
