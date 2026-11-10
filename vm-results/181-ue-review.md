# Review UE (1 Nov) — Story Block stage30/char-export 8a8b177 (base main f361c92, 2.12.0)

Verdict: OK (no blockers).

Counts: npm run check = syntax ok (exit 0). npm test = 4251 tests, 4235 pass, 0 fail, 15 skip, 1 todo (Node 22). git diff --check origin/main = clean.

Blockers: none found.

Checked and passed
- File: only soul, points, stats, skills (name, about, stat|none, uses, rank), items (name, qty, note, kind, rarity), money. Wessel and Mara exports checked: no name, kind, who, XP, H/M/S, practice. Ren (no skills, nothing carried) exports a clean empty-skills file. Money only on the You card.
- Reading (64-case probe in node + 13 files through the real Import button): empty, whitespace, binary, 70 KB, 5 MB, array, null, "__proto__" at top level and in stats, 60k-deep nesting, wrong types, qty 0/1.5/"2"/1000, 61 items, 6 skills, money -1/1e9+1/"5"/null, version 2: each one plain sentence, no throw, wizard untouched. BOM / UTF-16 files read. Unknown keys dropped. Skill stat missing/null = none; bad stat refuses the file.
- Import fills only stats/points/Soul Class/skills; rank select disabled; name/kind/who untouched; Undo import restores.
- Create with import (desktop 1440x900 and phone 390x844, new chat via /newchat): one reply; Character + Skills + Combat/Foes blocks, 4 items to the party bag, +5 silver (40 -> 90 coins) shown in Party, Inventory, purse. Swipe: items, money and blocks all gone (coin 40, no cards). Reload after create == live; reload after swipe == start. Deleting the creating reply with /cut returns to start; deleting a later reply leaves the character. Greeting-only chat (first thing in a new chat) works, and the first-Send hold dialog's Create path has the Import row. Rapid triple click on Create does not double-add.
- Partial failure: Anvil x999 (does not stack, max 50) refused and named ("Wessel is in the party. Not added: Anvil x999 (...)"), Torch x999 and the 1e9 money still added, character made. 8-block chat: Create is held up front ("no room for two more blocks"), nothing half made. A skill "about" with an on...= attribute: whole Create refused with a plain message, nothing created, nothing left. (Carry-limit refusal itself is only covered by the builder's mocked test; no module in the test ST answers items.carry.)
- inventory.add kind/rarity: new items get the file's kind and rarity (equipment/epic, equipment/rare, goods/legendary); Torch already in the chat as goods/common stays goods/common when a later file brings Torch equipment/epic (counts merge). Item names "__proto__", "constructor", HTML, 400-char notes: no wedge, same after reload, textContent only.
- RPG off (Settings -> Features -> RPG switch): no Party tab, no Export button, no Import row, no wizard/export widget anywhere (chat, Home, Inventory, Quests, World, Map), no new strings in the DOM. Switched back on after.
- Opaque dialogs: Glass (opaque floor under the tint), Solid and Follow SillyTavern all compute an opaque background, no blur, for both the New character window and Export, at 1440x900 and 390x844; shots confirm the party cards do not show through.
- Console: only the two pre-existing 404 / 502 (no API connected, NPC State Delta scan); no page errors from this feature.

Follow-ups, ranked (none block)
1. Skills step after an import still offers the skill templates; clicking one silently replaces the imported skills and drops their ranks (Iron Breath Expert -> Novice). Same replace-on-template behaviour as before, but it undoes "ranks come from the file" with no warning. Either hide the template cards while ranked skills are present or say it replaces them. (Undo import + re-import recovers.)
2. Importing as a companion still adds the file's money to the party purse ("5 silver to the purse" is told on the Review). Honest, but a file made from a You card funds the party when a companion is made from it; consider offering money only for a You.
3. Equipment/other non-stacking things from a file with qty N become N separate stacks (Torch x3 equipment -> 3 rows); Review says "N things" counting file rows. Fine, but surprising.
4. Import note wording: "5 silver to this chat" vs Review "to the purse"; large money shows unseparated ("10000000 gold") while the file error uses 1,000,000,000 with commas.
5. A character with 60 unspent points (allowed by the file limit) makes the Party card header wrap the name ("Wesse / l") because of the long points pill; cosmetic.
6. A file with a BOM read as raw bytes (not via File.text) is refused as unreadable; the browser path strips it, so only matters for non-browser callers.
7. A file's kind "valuables" (plural typo) is dropped silently (kind is "valuable"); documented as unknown kind left out, so only a note.

Scripts and shots: scratchpad rv-ue folder (shots/, scen.mjs, new3.mjs, styles.mjs, off.mjs, bad.mjs, probe-parse.mjs, files/). Test ST (port 8175) stopped, PID 27763 only. No commits, no pushes.
