# Lead's browser check of Story Block 2.7.0 (stage14/edit-blocks 952e71f), 29 Oct
Private SillyTavern 1.19.0 on port 8155 with its own data root (no secrets). The data is a copy of the mockup run: Ersveil 2.0.0 pack, three data modules pinned under 2.6.x, four scripted replies.
Story Director main. Desktop 1280×900 and phone 390×844.

## L1 BLOCKER — chats saved by 2.6.1 lose every pinned data module
- **Symptom:** the chat in `fixture-2.6.1-pinned-ersveil.jsonl` shows Standing, Fame and Guild membership as **Pinned** on main d5fdb46 and as **Available** on the branch, with no notice. Their values and screens are gone.
- **Introduced by:** bisected to 1450d27 ("Add guarded field edits and text labels"); still present at 952e71f.
- **Cause:** `dataModuleHash` (check.js ~538) hashes `{ definition, interpreter: 1, descriptors: D, limits: L }`.
  - The descriptors gained `edit`, text labels, and later `prompt`/`show`/`list`, so the same stored definition now hashes differently:
    - standing: 208561d9… on main, 61f8c34d… on the branch;
    - fame: 208a5fa6… → e32f4ef1…;
    - guild-membership: 6938a74e… → e51473c1….
  - `validateDomain` then rejects every old `active[module]` (hash mismatch), and installed offers look new.
- **Fix:** the interpreter-1 hash must not move.
  - Hash with frozen copies of the 2.6.1 `DM_DESCRIPTORS` and `DM_LIMITS` (a `HASH_BASIS_V1` constant, never edited), not the live ones.
  - Add a regression test with this fixture: replay, rebuild and reload all show the three modules pinned with their values; the installed offer hash equals the pinned hash; Setup shows "Pinned", not "Migration available".
  - Also test that a pack from 2.6.1 imported fresh hashes to the same value as on main (assert the three hashes above).

## L2 — Inventory pencils don't match the approved mockup (01a/01b)
- **Mockup:** one quiet pencil per row, borderless, beside the name, opening one name/count/note form (01b). On the purse: a quiet pencil right after the amount, then "+ Add item" right after the purse.
- **Built:** three bordered 32 px pencil boxes per row (name, count, note) and a bordered purse pencil far from the amount, with "+ Add item" in the middle of the header (see `Inventory-d.png`).
- **Fix:**
  - One pencil per row opens the combined form (name, count, note; Save / Cancel). Drop stays as the side action.
  - Pencils drawn borderless and quiet (the mockup's `ss-iconbutton` style), keeping the 44 px hit area on phones.

## L3 — Home pencils (mockup 02a/03b)
- Pencils are big bordered boxes (`Home-p.png`).
- With nobody present, the "people present" pencil stands alone on its own line with no label.
- **Fix:**
  - Same quiet pencil style.
  - Give "present" a visible row: "Here: —" or the names, with the pencil after it.

## Checked and fine
- Version 2.7.0; no page errors.
- Phone tap targets are all 44×44 or larger (pencils, Add item, Drop, New block, Save point). Desktop pencils 32×32.
- Count edit Torch 2 → 3 through the UI: focus moves into the input, Enter saves, and the inventory shows 3.
- Card: "1 edit of yours" in the header, "You set Torch to 3.", the hint line, one coin icon (`card-after-edit-d.png`).
- Blocks: New block → chooser (Empty block) → editor ("1 of 16 used", "0 of 600 characters", "57 of 2000 …"). Save pins `pack.chat/notes` ("Made in this chat"), and a Notes tab appears in the Game view.
- The see-through desktop Game view is the existing Glass style, the same as in the mockup (not a regression).
