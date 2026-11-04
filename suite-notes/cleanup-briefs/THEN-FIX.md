# THEN-FIX (USER 4 Nov: "go, A") — follow-up skill, defence skill only when asked, mana arrow
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, PID files, no playwright install, never use $S/userchat or USER chats — deleted).
If any command is denied, stop that step and report it; never re-run it in another form. Shared machine:
--test-concurrency=2, re-run timing failures alone.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Clone: fresh $S/then-fix/Story_block, branch `stage66/then-skill` from origin/main a2d57b1 (2.21.0). Push it. Do not bump
versions; CHANGELOG under "## Unreleased". The integrator (stage67/sb-222) merges your branch later.

Case (USER play, 2.21.0): player wrote "use Obscure to hide … Shadow Cut first then follow up with Iaijutsu on the
swarm". Plan: one act `skill: Shadow Cut`, no else. Mana emptied in round 1; rounds 2–3 were plain attacks. The two rat
attacks were plain defence rolls; Astra has Shadow Step ("dodge a blow…") but the player never asked to dodge.

1. **Follow-up skill `then:`** (Standard and Classic act lines; lean-rpg plan.js/precall.js/standard.js/resolve.js):
   - `act … | skill: A | then: B` → round 1 (and an opening/quick-start action) uses A; rounds 2+ use B. B must be a
     skill the character has (else dropped like `else:`). `else:` still applies to whichever skill is current when
     its resource is spent (spent B → else: skill, else plain attack, per FIGHT-FIX).
   - Planner rule (short, one line): when the player's message orders skills ("A, then B" / "follow up with B"), put
     the first in `skill:` and the next in `then:`. Report the planner-head byte delta (Standard + Classic).
   - Gate with FIX_VERSION 3 (names.js): only new rolls carrying fix: 3 read `then:`; rolls with fix 2 / none replay
     byte- and dice-identical (re-run the oldroll harness from rv-card-sb / CARD-SB: 0 diffs over 360+ seeds, Standard
     + Classic, including fix-2 rolls). Practice: each rolled use of B counts for B (practice rule 'rolls').
   - Cue: the narrator is told which skill each round's line used (it already names only the rolled skill — keep).
2. **Defence skill only when asked (USER option A):** replace the shared planner rule "A defender's fitting skill
   (dodge, parry, ward) goes on the foe line." with: name a defender's skill on a foe line only when the player's
   message asks to defend with it (e.g. "I Shadow Step past their bites"); otherwise leave skill out. Test both ways.
   Confirm old replies replay unchanged (the plan is recorded; say how you verified).
3. **Mana/Stamina arrow** (view/battle-log.js `consequences`/`attach`): a resource change names its bar
   ("→ Astra Mana Empty", "→ Astra Stamina Tired") and sits on the line whose recorded `cost` moved that bar (the
   first such line when several); health arrows unchanged; old records without `cost` keep today's placement but
   still name the bar. Strings in strings.js. No layout change.
Tests: one per item at least (then: used in round 2+; spent B → else/plain; fix-2 replay identical; defence skill
named only when asked; arrow text/placement). Full suite at the end; npm run check; git diff --check; RPG-off
prompt bytes identical. Real ST (port 8660/8661, own data copy, mock model): a 3-round fight "Shadow Cut then
Iaijutsu" shows Shadow Cut in round 1, Iaijutsu after; screenshot of the battle log at 390 px.
Report: head sha, what changed, byte deltas, tests with counts, oldroll results, screenshot path.
