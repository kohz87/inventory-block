# PRACTICE-FIX — fight gate, practice rule, practice line, ambush check (adds to Story Block 2.21.0)

Read CARD-COMMON.md first; its rules apply. Work on branch `stage65/card-offer` (head c8490ae) in your clone $S/card-sb, adding commits on top. Version stays 2.21.0; add CHANGELOG lines.

The source is the Opus investigation ($S/xpbug/, report in V2_LOG 4 Nov). The USER-approved rule (4 Nov):
- skill practice comes only from a skill's ROLLED use, in a fight or a check;
- the planner plans a check when a skill's use has an uncertain outcome;
- a pre-fight setup success gives an edge in the fight that follows;
- use with nothing at stake gives no practice (no farming).

1. **Gate (wrong results, a 2.19.0 regression).** In `src/v2/lean-rpg/gate.js`, `riskyMessage` also returns true when `readsAsCombat(message)` is true. Add cut, slice, cleave, hack, slaughter and butcher to `BASE`.
   - Tests: "I bait the ditch with pork and cut the gnashers down with my cane-sword" opens the gate; "I hang my sword by the fire" stays a cheap pass, or at worst a cheap "none" (say which).
2. **Practice only from rolls,** when the RPG is on and Rolls is automatic:
   - (a) `grammarFor` (data-modules/part.js) offers only `learn-N` for the `skills` role. Drop "Practice a skill 5 to 20 per use" from the kept XP-guide line (templates.js:30), and the "adds practice" wording from the Skills block text in that mode.
   - (b) A story `practice-N` line (part.js:855) is refused, with a Problems line: "Practice comes from rolled skill uses."
   - With Rolls off: exactly today's behaviour and prompt bytes.
   - Tests: the prompt with Rolls automatic has no `practice-N`; with Rolls off it does; the practice-by-code case flips to refused.
   - Report the byte change for quiet RPG-on replies.
3. **Practice line on the reply card.** `lean-rpg/view/changes-lines.js` gets `practiceLines` beside `fightLines`. It reads the `rpg.practice` receipt (`data.v2.result.practice.skills`) and writes "Astra's Shadow Cut +6 practice (rolled)" as a new strings.js entry, in the same style as the fight XP line.
   - Test it, and shoot the USER-chat reply card in real ST.
4. **Ambush check.**
   - plan.js: a check line may carry `ambush` (validate and parse).
   - Planner head (precall.js): "A skill used to set up a fight (hide, sneak) is a check with that skill and `ambush`. No ambush edge without it." Remove the free "edge +2" for an ambush that has no check.
   - resolve.js: a successful ambush check gives the party's round-1 acts +2 and the quick start (Standard). A failed one gives nothing (or the foes notice: no edge).
   - The battle log shows one line before Round 1 in the existing log style: "Ambush: Astra's Obscure check — Success (17 vs 12): the party strikes first, +2 this round", or "— Failed: no surprise".
   - The check's skill earns practice through the existing path.
   - Tests: parse; resolve with fixed dice for success and for failure; practice includes the check skill; a plan with no check gives no ambush edge.
5. **Planner head wording:** "A skill brings its stat: write none." becomes "A skill brings its own stat; leave the stat out." Keep the planner head bytes as small as possible, and report the change.

**Real-ST check** (ports 8330/8430, as before) with the USER's chat copy at $S/xpbug/st-data/default-user/chats/Ersveil/ (USER-provided test data: never commit it, quote nothing from it):
- shoot the gnasher reply card showing the new practice line;
- play one new turn "I try to hide with Obscure before the patrol notices me, then strike" and shoot the battle log with the ambush line.
Shoot at 1440 and 390 into $S/card-sb-run/shots/.

Then run the full suite, `npm run check` and `git diff --check origin/main HEAD`, push, and report the head, tests, pinned changes and byte changes.
