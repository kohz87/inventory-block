# CASTSKILL-UI — mockup: signature skills for a pack's cast (USER approved the idea 4 Nov)

**Idea:** a pack's cast entry may list fixed signature skills, the way it lists signature gear. Each skill has name, what it does, stat, uses (stamina/mana) and rank. When the member joins the party, those skills fill the member's skill slots exactly as written; free slots stay for the narrator. Ersveil gets 2–4 per cast member, ranked by level (Lv 8 mostly Novice … Lv 56 mostly Expert/Master).

**Mockup only.** Do not edit or push any repo.
- Rules: CARD-COMMON.md.
- Real Story Studio from origin/main ec65db3 (0.8.0), opened by file:// (the browser tests use STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome), with the real Ersveil zip (Story_block examples/packs/ersveil.zip).
- Also real Story Block 2.20.0 (origin/main 2ee6318) in a real ST copy on ports 8380/8480, data built by copying into a new empty folder: RPG on, a party where a cast member (Harrak) has joined. Use it to show where the skills appear.
- Method as in $S/cardui and $S/grm7: "Today" is the live screen; "Proposed" is drawn with the app's own classes. Shoot at 1440×900 and 390×844, measure alignment, and write $S/castskill/mockup.html (self-contained, under 16 MB, light/dark tokens) with a "Lead's recommendations" box at the top.

**Draw:**
1. **Studio → Cast → Harrak:** today's form, and the proposed **Signature skills** section placed after Signature gear (if Studio shows gear there; otherwise say where gear is edited).
   - Up to 5 rows (8 when the extra-slot change lands; note that). Each row: Name, What it does (one line, the creation limit), Stat (select), Uses (stamina/mana), Rank (Novice/Adept/Expert/Master).
   - Add and Remove per row. A hint: "Filled into their skill slots when they join; free slots stay for the story."
   - A checker message for a duplicate name or too many rows.
   - Phone: rows stacked as cards.
2. **Story Block:** Harrak's Skills card in the Party view after joining, with three example skills, e.g. "Long Watch Cleave (Expert, STR · Stamina)", "Beacon Call (Adept, CHA · Stamina)", "Hold the Line (Master, CON · Stamina)", using the Skills card as it is today. Mark that these came from the pack (the same small lock or "signature" chip the bound gear uses?). Recommend whether pack skills are locked against the narrator's changes or only seeded (I lean: seeded and practisable, not renamable by the story).
3. Note the pack-format shape you would propose (`cast[].skills: [{ name, about, stat, uses, rank }]`) and the checker rules.

**Report briefly:** the file path, real vs drawn, measurements, open questions, and anything not shot.
