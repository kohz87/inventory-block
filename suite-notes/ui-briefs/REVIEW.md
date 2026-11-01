# UI cleanup review (1 Nov) — Claude reviewer agents

Read UI-COMMON.md (hard rules apply; you make NO commits and NO pushes). Read the briefs UA1, UA2, UC, UB, UD and the
lead's follow-ups in suite-notes/V2_LOG.md (entries of 1 Nov) — the follow-ups win over the briefs (e.g. SB holds no SD
words/ids; card headings/summaries come from each card screen; HUD switch shown only when a 'hud' screen exists).

Under review:
- Story Block `stage29/ui-merge` (= origin/main 121e49a + ui-a1 3c4bddf + ui-a2 b1770db + ui-c a6d07b6)
- Story Director `stage29/ui-b` f9a1969 (base 4b188c3)
- NPC State Delta `stage29/ui-d` 3d93827 (base 13daee6)

Blocker bar (only these block a release): an ordinary-use path that loses or corrupts saved data, crashes or wedges,
gives wrong rules results, or leaks a hidden value (e.g. a secret/hidden thread shown to the reader). Everything else is
a follow-up; list it, ranked.

Check at least:
1. `npm run check` + full `npm test` on each branch (report counts; SD earlier 994 → now 992: confirm no test was lost).
2. Off/on and presets: picking Lean/Standard/Full and back never deletes or changes stored state; rebuild == live ==
   reload; default-on prompts byte-identical to base (SD fixtures, SB fingerprints).
3. Hidden values: with threads on or off, secrets/beats/agendas never reach a reader-facing surface they did not before
   (header, This reply card, World, More sheet).
4. Ownership: SB contains no SD/NSD ids, words or rules added by this work.
5. Browser, all three together on your own test ST (port in your brief), desktop 1440×900 + phone 390×844: header +
   pencils (edit place/weather/people and see it stick after reload), five tabs + More, Tabs & Packs In the bar/Under
   More, This reply card (closed/open, switches), Features presets (pick each, Custom), NSD folds, phone dossier, RPG on
   (hero bars, Party/Fight). Console errors.
6. Compatibility: new SB with OLD SD/NSD and old SB with new SD/NSD — nothing crashes; note warnings.

Report: verdict per repo (BLOCK / OK), blockers with exact repro, follow-ups ranked, test counts. Write it to
/home/user/inventory-block/vm-results/<your file>.md is NOT allowed (no commits) — put it in your final message and
save a copy at $S/<your folder>/REVIEW.md.
