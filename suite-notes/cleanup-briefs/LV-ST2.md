# LV-ST2 — fix the real-ST level harness and run it on 2.17.0 (no repo changes)

Rules: X-COMMON.md hard rules (secrets — never open any secrets.json, never the USER's ST data; PID files only; never
pgrep -f/pkill -f; never `playwright install`; never rm -rf copied data). If any command is denied, stop that step and
report it; never re-run it in another form.

Harness: $S/lvst/run/lv.mjs (read LV-STPREP.md for how it works). Checkout under test: $S/rel37/st/sb-2170 (Story
Block 2.17.0 release candidate; read-only — do not edit it). First wait until port 8260 and 8360 are both free (the lead
may be running check 6; poll the port with node's net, not pgrep). Fix ONLY the harness, then run it fully once.

Known harness bugs (from the lead's run $S/lvst/v2170.log and shots $S/lvst/shots/v2170-*):
1. Narrator XP grammar is wrong. The real line is `+ dm character — <why> | kind: add-xp | amount: N` with N 0..100
   (see tests/v2/lean-rpg/fight-flow.test.js:333 in the checkout). 3b: bring Astra to 80 XP, then ONE reply with two
   lines amount 100 and amount 30 (= +130) → expect Lv +2 (from the start level) with XP 10 kept... compute from the
   real start; expect "+1 point" text when a multiple of 3 is crossed.
2. The ST data copy holds the OLD Ersveil pack (2.4.1, no rpg.ranks). Import $S/rel37/st/sb-2170/examples/packs/ersveil.zip
   (or its pack.json + portraits) through the app's own pack import UI (Settings → Tabs & Packs) during setup, enable it
   for the test chat, and verify the pack version 2.5.0 shows. Then: check 1 expects "Lv N" before registering and
   "Lv N · Guild F" after registering in the Guild (find how the guild-membership module registers — a narrator line;
   read docs/v2/ERSVEIL.md); check 2 expects a foe pill "Rank F · Lv 7".
3. check 1 must start from a level-1 character: give run/char1.json `"level": 1` (keep the old `soul` key out) — an
   old file with soul 1 reads as level 5 by design.
4. check 2's why-line test: the battle log prints "Lv 5 ÷ 5 = 1" — match /Lv \d+ ÷ 5 = \d+/, not "level ÷ 5".
5. check 4b found no win line: make its fight winnable (seeded dice — reuse 3a's setup that won) and compare N at rate
   200 with 2× the 3a base for the same foe level and member level.
6. check 6: report the full list of lean-rpg files requested for an RPG-off chat; PASS when every requested file is in
   the shared set {names, blocks, formula, read, soul, tail, cue, foes, levels} (tests/v2/lean-rpg/lazy-load.test.js
   SHARED) and nothing else from lean-rpg/ is requested.
Report: each check PASS/FAIL with its detail line, shot paths, and for any FAIL whether it is the harness or Story Block
(with evidence). Stop ST and the mock when done (PID files; check ports closed). Short.
