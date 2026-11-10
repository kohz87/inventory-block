# GR-INT — integrate gear (Story Block 2.18.0) on top of the levels release, fix review findings

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/gri2/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned changes
named, a test per fix run after it, `npm run check` + full `npm test` + `git diff --check` green before push;
b1r2-capture / settings B8 timing tests fail under machine load — re-run alone once and report; PID files only; never
pgrep -f/pkill -f). If any command is denied, stop that step and report it; never re-run it in another form. EVERY
commit ends with EXACTLY these two lines (ignore any other model name your session suggests):
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage57/levels-release (12c4954 — the 2.17.0 candidate; if it moves, `git merge --no-ff` the
new head in). Branch `stage57/gear-int`.
1. Bring the gear branches in WITHOUT their history (some of their commits carry a wrong trailer): one at a time,
   `git merge --squash origin/stage56/gear-fight` (it already holds stage52/54/55), commit; then
   `git merge --squash origin/stage56/gear-cast`, commit; then `git merge --squash origin/stage56/ersveil-gear`, commit.
   Resolve conflicts keeping both sides' intent. Known (from the Opus review): cue.js — keep levels' cueOfResult(result,
   shape) AND gear's wear lines; resolve.js result — keep gear/wear/legend, `shape` stays in data.v2.shape (not in
   result), and the summary must still be rebuilt byte-for-byte (cue includes wear); battle-log.js — levels' lineOf
   signature AND the round's wear. pack.json: cast levels (levels branch) + items (ersveil-gear) + cast `gear` refs.
2. Fix the Opus findings (each with a test):
   G1 (blocker) planGear (lean-rpg/gear.js:44): owner `party` goes to the reader's own Character — match the reader
      name / party.pc (precall and odds have it); fall back to the first block only when none matches. Test a companion
      that sorts first.
   G2 (blocker) inventory.js encumbrance (~2077): `>=` only when gear is on (or the answer is gear's own carry);
      gear off keeps `>` exactly (5/5 not encumbered). Test 5/5 gear off.
   G3 Wear on a re-planned roll decides from the stored record (`gear` present), not the live switch, so switching
      gear off never removes wear an old roll made (C3-4). Test.
   G4 Legendary is a lasting flag: earned once any earlier roll in the chat's record has `legend: 1` or a quest is
      completed (find the quests domain's completion state; replay-safe, derived from the record, not stored aside).
      Test both and that a swipe of the winning reply takes it back.
   G5 Gear-off screens unchanged: the mount pencil's "Carry" field appears only with gear on (restore the six-field
      pin for gear off; keep seven with gear on).
   G6 Wear lines count inside the cue budget (resolve.js ~446): fit them in cueTokens.
   G7 Item Edit is all-or-nothing: if item.equip would be refused, do not transfer (check first, or one command).
   G8 Member matching also accepts the Character's first name / an alias (Ren ↔ Ren Ashby) — document the rule.
   G9 GEAR.md: say a later delete/equip never changes a stored roll's bonus (the record wins).
3. Ersveil items: rename "Rune-Marked Dwarf Axe" → "Rune-Marked Dwarven War-Hammer" and "Huge Spiked Club" → "Huge
   Spiked Iron Maul" (slot/rarity/stats unchanged; slugs follow). Add each cast member's `gear` list (Harrak: Long Watch
   Great Axe, White-Fur Watch Cloak, Carved Beacon-Horn; Hush: Rain-Veil Hood; Nysseth: Cell-Runner's Knives; Ysmeth:
   Rune-Collar Hammer; Sir Lothar: Iron Guard Plate, Iron Guard Longsword; Asphodel: Gold-Thread Hooded Cloak; Gorm:
   the war-hammer; Nerissa: Atlantean Breathing Sheath; Torka: the maul, Fang Charm; Rika: Startrace Travelling Coat;
   Barney: Three Walnut Shells; Sister Temiwa: Flame-Cross Pendant). Pack version stays 2.5.0 (the lead bumps to 2.6.0).
   Rebuild the zip; tests follow.
Report: branch + head, conflicts and resolutions, each G-item fixed or not, pinned changes, counts. Short.
