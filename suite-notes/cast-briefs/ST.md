# ST — Story Studio 0.5.0: the Cast editor (USER approved mockup, 1 Nov)
Read C-COMMON.md first (the cast entry format and portraits). Hard rules: suite-notes/ui-briefs/UI-COMMON.md (no
version bump/CHANGELOG, push only your branch, never merge/PR/force/tag, a test per change run after it, `npm run
check` + full `npm test` + `git diff --check` green). Repo kohz87/Story_studio, branch `stage33/cast` from origin/main
(e289b48, 0.4.0; vendored Story Block 2.11.3). Mockup: https://claude.ai/artifact/8CxMF61T35t5jcqTxALpN4 (script
vm-results/u8/mock.mjs — texts and layout come from it). Studio is a desktop tool; keep its 44px target-size tests green.
1. Vendored Story Block: `npm run sync-sb` from Story Block `origin/stage33/cast` (agent CS is building the `cast`
   content kind there; pull it when it has the kind — until then build against the C-COMMON shape and re-sync before
   your last push). Report which SB commit you vendored.
2. A "Cast" part in the rail beside People / creatures (a person icon), with the list (portrait thumb, one line, where
   they start, chips: n secrets, drawn to n, portrait size) and the form, in the mockup's order: Who they are (name,
   also called, one line, look, voice, personality, background); Portrait (choose; auto-shrink to ≤ 64 KB WebP in the
   browser, show size; remove); Where their story starts (place picked from the pack's places, routine, goal); Drawn to
   (chips); Relationship at the start (meter preset, starting values, stages, own fields); Before met (may die, off);
   Secrets (up to 8: title, text, opens at a meter value or on a story event; reorder; the player-view preview with
   blank bars). Every limit and message from the vendored validator.
3. Export: one .zip (pack.json + portraits/<file>) written in the browser without new dependencies (stored or
   CompressionStream deflate), and "Export pack.json only". Open pack accepts the .zip too. The check lists cast and
   portrait results as in mockup S4.
4. Undo/redo, the Problems list and dark theme cover the new part like the others.
Report: head SHA, counts, shots (desktop 1440×900), deviations.
