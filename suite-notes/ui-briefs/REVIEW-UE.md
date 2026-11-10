# Review UE (1 Nov) — Story Block `stage30/char-export` 8a8b177 (base main f361c92, 2.12.0)

Claude reviewer agent. Hard rules of UI-COMMON.md apply; you make NO commits or pushes. Read UE.md, the lead's
follow-up in V2_LOG (1 Nov: no guessed stat; honest bag wording), docs/v2/RPG.md "Export / Import a character".

Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong rules results, or
leaks a hidden value. Everything else is a ranked follow-up.

Check at least:
1. `npm run check` + full `npm test` (counts); `git diff --check origin/main`.
2. The file: only soul, points, stats, skills (name, about, stat|none, uses, rank), items, money. Name, kind, who,
   XP, H/M/S, practice never written. Reading is strict (limits, bad/hostile JSON, huge file, prototype keys like
   "__proto__", wrong types) and never throws past one plain message.
3. Import fills ONLY stats/points/Soul Class/skills; ranks locked; name/kind/who untouched; Undo restores the draft.
4. Create with an import: one reply; blocks + items + money; a swipe takes ALL back; delete/rebuild/reload == live
   (replay). Partial failure (carry limit, 8 blocks, change cap) names what was not added and never leaves half a
   character. `inventory.add` kind/rarity: only for new items, old saves and replays unchanged (fingerprints/fixtures).
5. RPG off: no Export/Import anywhere. Opaque dialogs in Glass/Solid/Follow.
6. Browser on your own test ST (port 8175), desktop 1440×900 + phone 390×844: export Wessel, import into a NEW chat
   (make one), create, check Party/Inventory/purse, swipe the reply, reload. Console errors.

Report: verdict (BLOCK / OK), blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-ue/REVIEW.md.
