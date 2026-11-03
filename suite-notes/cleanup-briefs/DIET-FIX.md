# DIET-FIX — fix the Opus review findings on Story Block 2.19.0 (stage62/diet-release)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/dietfix/, push only your branch, never merge to
main/PR/force/tag, never weaken/skip/delete a test — pinned changes named, a test per fix run after it, `npm run check` +
full `npm test` + `git diff --check origin/main HEAD` green before push; timing tests may fail under load — re-run alone
once; PID files; never pgrep -f/pkill -f). If any command is denied, stop that step and report it; never re-run it in
another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Branch: Story_block origin/stage62/diet-release (82faaa3) — commit on it directly. Review probes/notes: the Opus
report is summarised here.
1 (HIGH) gate.js: the planner gate misses common risk wording. Add: lunge, thrust, fire, loose, aim, draw (a weapon),
  flee, run, escape, chase, break, force, search, track, listen, spot, heal, resist, endure, try, attempt, and irregular
  forms (hid, leapt, fled, ran, broke, drew, …). Also plan when the LAST narrator reply reads as combat (combat words or
  a new hostile/foe named) even if no Foes line was set. Skill match: a party skill matches by any word of its name of
  ≥4 letters as well as the full name. Tests: each phrase from the review ("I draw my sword and lunge at him", "I fire
  at the guard", "I aim at the bandit and loose an arrow", "I flee into the alley", "I try to break down the door", "I
  force the lock", "I search the room for traps", "I track the wolf", "I heal Mira") → planned; a quiet "I sit by the
  fire and listen to the rain"?? — careful: decide whether "fire"/"listen" in calm sentences should plan (it is better
  to plan too often than to drop a roll; a planner "none" is cheap) and test the choice; replay stability unchanged.
2 (MED-HIGH) quiet.js: keep the XP/practice guidance on quiet replies — the one "XP guide" line (Standard and Classic,
  incl. "code gives XP for a won fight; write none for it" and Classic's practice range) stays in every reply's prompt
  while the RPG is on (move it to the Character block's grammar or keep a one-line remnant). Test both formulas.
3 (MED) inventory.js PROVENANCE / promptNote: strip ONLY "found|picked up" + (at|in|near|under|behind|inside|beside) +
  place; keep everything else (owners, debts, clues: "taken from Mira, must return it", "owes Hesk 10 silver", "won in
  a duel with Kael", "found on the body of Captain Rell", "taken by the Watch as evidence", "got in a trade for the
  map" must all stay). Test each.
4 (LOW) standard.test.js:206 — tighten the ratio to the measured value (+ a small margin) and name it; restore the final
  newline in off-2.9.4.json / off-2.11.0.json; rename gate.js's `fightIsOpen` to `fightLive` (or similar) so the two
  differ; registry headsOf: refuse heads that do not name the kind itself (validation error) + test; grammar.js
  "same words as X": only reference a line that is actually in this prompt, else repeat the words (+ test if small).
5 CHANGELOG 2.19.0: add that the look is asked once per chat (existing chats with an unset look are not asked again),
  and the planner wording change.
Report: head, each item fixed, pinned changes, counts. Short.
