# Review X (2 Nov) — the clean-up release (SB 2.16.0, SD 2.9.0, NSD 1.7.0, Studio 0.6.0, Ersveil 2.4.1)
Claude reviewer agent. Hard rules of suite-notes/ui-briefs/UI-COMMON.md; NO commits or pushes; never touch rpg_battle.
If any command is denied, stop that step and report it; never re-run it in another form. Use fresh folders under
$S/rv-x/ (S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad); never delete.
Heads (all on their origin/main bases):
- Story Block `stage36/release` 73f98cd (base 79df89f) = cleanup-sb 3acf146 (portrait shrink on import, 150 KB / 1200 px,
  zip caps, card kept in view, CAST_BUILT_IN_PRESETS, Ersveil portraits re-encoded) + hero-edit bc87e44 (one Edit button
  and editor replacing every hero pencil).
- Story Director `stage36/release` fc378fe (base 1ae570c) = cleanup-sd f5da90c (key-people removal line on the right
  reply, cast/follow.js removed) + clock-set ca3f109 (`director.clock`, `director.time.parts`, status `when`).
- NPC State Delta `stage36/cleanup-nsd` 0dee1e8 (base f642101): first-write 404s, cast portraits as content-addressed
  user files (path-only record; old dataUrl chats untouched; export inlines; import writes).
- Story Studio `stage36/pack-formula` 5c3fbd5 (base 3036ab8): Stat formula card; portrait.js reads PORTRAIT_LIMITS.
  (Its vendored SB is still the old one; the lead re-vendors at release — review the code, and run its tests as is.)
Read: cleanup-briefs/X-COMMON, XA, XB, XC, Y-CONTRACT, YA, YB, YS; V2_LOG 1–2 Nov entries from "Clean-up release
started"; mockup https://claude.ai/artifact/V9U7kfpstDwvTjjsS9tWgd (texts: vm-results/u10/NOTES.md).
Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results against the
agreed design, or leaks a hidden value (unmet cast, locked secret text). Everything else is a follow-up.
Check at least:
1. All four: check, full test suite, diff --check vs base; NSD compat + smoke by hand. Byte-identity of prompts vs main
   (no edits made, no cast pack) for SB/SD/NSD.
2. SB portraits: PNG/JPEG/WebP ≤10 MB shrink to WebP ≤150 KB ≤1200 px in a real browser; ≤150 KB kept byte-for-byte;
   refusals (undecodable, too big, >64 MP header, bad type, zip-slip, zip bomb ratio, entry cap); old packs with 64 KB
   portraits still import; Ersveil zip imports; re-import replaces; removal with the pack.
3. SB card scroll: newest card in view after a reply (desktop + phone); a scrolled-up reader is never moved; older
   messages' cards never scroll; no scrollIntoView / bare focus.
4. Hero Edit: no pencils left; Edit opens one editor (Story/Character groups per settings); only changed fields sent;
   clock first and a refusal stops the rest with the sentence shown; no SD / old SD / no calendar → no date fields;
   Escape/Cancel; long names; focus return; phone pill 24 px drawn with 44 px tap, no overlap.
5. SD clock: validation sentences (month length, leap years, custom calendar), rewind, swipe / Re-read / middle delete /
   rebuild == live == reload; deadlines, cast routines, key-people and the chronicle digest across a rewind; tile
   "Clock set to …" on the right reply; Status card Time row format; prompt bytes unchanged.
6. SD key-people removal line on the reply after the removal (archive and death in NSD), swipe/delete exact; follow.js
   gone and the card still in view with the SB branch.
7. NSD portraits: a new cast meeting writes one file, the sidecar holds no image; swipe/re-meet no duplicate; reload;
   pack removal keeps portraits; checkpoint restore; export/import round-trip; missing file → placeholder, no error;
   old chat with dataUrl portraits unchanged byte-for-byte on load+save; no image data or path in prompts or scanner;
   first-write 404s gone.
8. Studio: formula card writes `content.rpg.formula` (object form), Reader's choice clears, Undo/Redo/Check/export;
   portrait.js limits wiring.
9. Browser on your own test ST (free port 8197+; own data copy; PID files), desktop + phone, scripted mock model, all
   three extensions at the heads above: import the Ersveil zip, meet two cast, edit the clock back and forward plus
   weather via Edit, swipe and Re-read, archive a pinned key person in NSD, remove the pack; console errors.
Report: verdict BLOCK/OK, blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-x/REVIEW.md.
