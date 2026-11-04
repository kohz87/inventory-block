# FIGHT-FIX — foe slots, skill fallback, cue wording (adds to Story Block 2.21.0)

Read CARD-COMMON.md first. Work on branch `stage65/card-offer` in $S/card-sb, with separate commits on top of your current round. Version stays 2.21.0; add CHANGELOG lines.

The source is the investigation of the USER's rats reply: repro $S/xpbug/tools/rats.mjs and run-rats.log. The USER's chat copies in $S/xpbug are test data: never commit them, quote nothing.

1. **A: Down groups block foe slots** (wrong results; the USER is 2 fights from a stall).
   - `openFoes` (open.js:114-120) treats a Down group (filled, hurt 0) as free: replace a Down group with the same name first, else use the first empty or Down slot.
   - `fightHook` (fight.js:110-112) also counts as arrived the slots listed in this reply's `rpg.resolve` `result.opened` (read from `info.receipts`, as `practiceHook` does), so a group of the same name reusing its slot pays XP.
   - Never pay a stale Down group again.
   - `fightIsOpen` (quiet.js:23) must not count Down-only slots as an open fight, so quiet replies after a won fight drop the combat text again. Check the bytes.
   - Tests: rats twice (the second group rolls and pays XP); five fights in a row (the fifth rolls); the winning reply still leaves its groups Down; Re-read, swipe and reload agree.
2. **The no-skill fallback rolls wrong.** standard.js:154/157 and `usable()` at 247-249:
   - when a skill act falls back for a spent resource, the plain roll is `type: physical` if the planned magic type came from the skill's mana, and `area: false`;
   - the log and the cue drop "(area)" for it.
   - Tests: Mana 2 with an area Shadow Cut over 5 rounds gives physical, single-target rounds from round 3 with the AGI pair.
3. **Fallback skill `else:`.**
   - An act may name `else: <skill>` (plan.js parse and validate).
   - Planner head rule, kept short: "A skill that spends Mana or Stamina may run out: add `else:` with the skill to use then."
   - When the first skill's resource is spent, resolve switches to the `else` skill if its own resource is not empty, with that skill's type and stat. Practice goes only to the skill actually rolled.
   - With no `else`, or with both resources spent, the act is a plain physical single-target attack (fix 2).
   - Tests: `else: Iaijutsu` gives rounds 3+ named Iaijutsu, spending Stamina, with practice n=3; replay equality.
   - Report the planner head byte change.
4. **Cue wording** (cue.js):
   - a fallback line says "(no skill: Shadow Cut's Mana is spent; a plain weapon attack — name no skill)", or names the `else` skill;
   - the head gains "Name only the skill a line names.";
   - the verdict word comes first, as in the log: "DECISIVE SUCCESS", "FAIL, DECISIVE";
   - one line for newly opened foes: "New foes: rats ×12 (Lv 2)", so the prose uses the rolled count.
   - Tests: cue text units.
5. **FAQ:** add "With Mana empty, name a Stamina skill or rest; a planned skill falls back to its named backup skill, else a plain attack." Keep it short.

**Real-ST check** (8330/8430) on a copy of $S/xpbug/st-data (USER data: never commit, quote nothing): rerun the rats turn and a second rats fight. Shoot the battle log at 1440 and 390.

Then run the full suite, `npm run check` and `git diff --check origin/main HEAD`, push, and report the head, tests, pinned changes and byte changes.

## Addendum (USER 4 Nov): stale foes shown
When a new fight opens, clear the Down groups left from earlier replies in the same step, so the Foes block, the battle log Status and the prompts show only this fight's foes. A group that went Down in this reply stays until the next fight opens, so its XP is still paid. Tests: gnashers then rats shows only rats; Re-read and swipe of the gnasher reply still show its own fight.
