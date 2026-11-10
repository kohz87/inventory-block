# EP — Ersveil pack 2.4.0: the twelve cast (USER-approved, 1 Nov)
Hard rules: suite-notes/ui-briefs/UI-COMMON.md (no secrets/user data, PID files, no playwright install, exact trailer,
push only your branch, never merge/PR/force/tag, a test per change run after it, check + full test + diff --check).
Repo kohz87/Story_block, branch `stage34/ersveil-cast` from origin/main (d6c63c6, 2.15.0). No Story Block version bump.

Source: suite-notes/ersveil-cast/v2/01-temiwa.md … 12-barney.md (each file = base sheet + later "USER" additions that
OVERRIDE earlier lines) and portraits/ (the USER's images). Read every file fully.
1. Build `content.cast` (12 entries) in examples/packs/ersveil/pack.json, REPLACING the sample Fenna and Sera. Shape and
   limits: src/v2/packs/cast.js + limits.js CAST_LIMITS (plain one-line text; no < > { }; no | in names/places/goals/
   routines/phrases). Fields: id (slug of the name), name, aliases, about (one line), look (fold in the portrait
   details), voice, personality (fold in tells, flaw/moral edge, archetype), history (the "known" background only —
   NEVER secret material), portrait "<id>.webp", start {place EXACT as in the sheet, goal, routine}, drawnTo (≤6 short
   phrases), meters, stages, fields (≤6: "Soul Class", plus the sheet's own e.g. "Calling"), secrets (light → deep, in
   the sheet's order, each {title, text ≤300, meter+at | when ≤120 | both}), canDieUnmet false.
   - Secret texts over 300 chars: tighten wording, keep every fact.
   - Stages: the sheet's stage names; needs = rising Trust (20/45/70/90 as fits); romance stages also need Affection
     and Desire (Temiwa "Mine": Affection 75, Desire 50 as agreed); milestone = the sheet's stage line/romance mark.
   - Meters: romanceable → preset "companion" (trust, affection, desire, tension; sensible starting values from the
     role: rivals low trust + some tension; Temiwa tension 10); Barney (NOT romanceable) → preset "mentor" (no desire).
   - Fixes agreed: Hush was freed ~70 years ago (not "a century ago"); Torka is 20.
   - Facts that must not appear in look/voice/personality/history/about/goal/routine (they are secrets): anything in
     a secret's text.
2. Portraits: examples/packs/ersveil/portraits/<id>.webp from the USER's originals with PIL (python3 -I, no new deps):
   long side ≤ 600 px, WebP, quality searched down until ≤ 62 KB; keep framing. The ersveil-pack test pins the folder
   contents — update it for the portraits folder.
3. Pack version 2.3.0 → 2.4.0; requires stays ^2.15. Update the pins in tests/v2/packs/ersveil-pack.test.js and
   data-modules pins if any, ERSVEIL.md (a short cast section: the twelve names and one line each, no secrets), and
   CHANGELOG? NO — pack data only.
4. Prove it: the pack validates (validator + the pack test); a .zip built with the pack + portraits passes readPackZip;
   all 12 start places resolve; total pack.json ≤ 512 KB; a script prints per-entry lengths vs limits.
   Then a real-ST smoke (own port, e.g. 8190, own data copy, PID files) with SB main + SD main + NSD main: import the
   zip, meet two people (one by place, one by drawnTo) with a scripted mock model, see portrait + Secrets section with
   no locked words. Shots desktop + phone.
5. Copy the final cast.json to suite-notes/ersveil-cast/v2/cast.json (do NOT commit in the notes repo — the lead does).
Report: head SHA, counts, per-entry length table, any wording you had to cut, shots folder.
