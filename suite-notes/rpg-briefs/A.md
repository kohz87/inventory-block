# Agent A: automatic rolls (Sonnet)

Branch `stage16/rpg-a`. Read COMMON.md first.

Files: `src/v2/lean-rpg/{index,plan,precall,resolve,cue,read}.js` (index.js: fill `createLeanRpgPart` and keep the
existing exports), `src/v2/turn.js` (the prelude list only), `src/v2/assist/classifier.js` only if A1 needs it,
tests under `tests/v2/lean-rpg/`.

## A1. Prelude list
`turn.js` `runCues` hard-wires Assist's `PRECHECK` (~lines 374–420). Make it a list of registered prelude commands
(a part can declare `preludes: ['rpg.resolve']` or similar; choose the smallest change): each is previewed on the
state the other cues leave, its seed kept in `session.prechecks` for a Re-read, and re-run with that seed on the
generated reply. Assist behaves byte-identically (its tests must pass untouched).

## A2. The plan
Shape: `{ pace, acts: [{ who, skill?, stat, target, edge? }], foes: [{ slot, target, defend } | { slot, hold }],
checks: [{ who, skill?, stat, difficulty }] }` (`validatePlan` in index.js is the starting check; tighten it).
Held for the next generation only, in chat metadata, not in game state; cleared when used.

## A3. The pre-call (A5 in the spec; now the only planner, on by default)
Before a reply, when the feature is on and Settings → Lean RPG → "Rolls" is "automatic" (default) and the chat has
at least one Character block: one short AI call reads the reader's latest message plus a compact party/foe summary
and returns the plan as JSON (or "no rolls"). Reuse how Assist makes its generate call (`src/v2/assist/`); time out
and fall back to no rolls quietly (a Diagnostics line, never a popup). No call at all when the feature is off,
"Rolls" is "off", or there are no Character blocks. The setting itself: add `rolls: 'automatic'|'off'` to the
feature's settings (B draws it in the Lean RPG settings page; you own the value).

## A4. Reading the sheet (`read.js`)
From the head state: Character blocks by `role: 'character'` and their `who`; Skills by `role: 'skills'` and `who`
(slot `skillN` + `rankN`); Foes by `role: 'foes'` (slots `foeN`, `countN`, `classN`, `hurtN`). Field keys are in
COMMON.md. A missing block or skill refuses that act with a plain reason (the cue says it was not rolled).

## A5. `rpg.resolve`
The prelude. Validates the plan against the head state; refuses a skill when the character's mana or stamina
(whichever the skill uses: say "uses mana" if the skill name or rules can't tell, default stamina) is 0 (Empty);
rolls opposed d20s from the generation seed with `FORMULA` and `PACE` for rounds = min(pace, cap 5, decisive stop,
cue budget) per SPEC_RPG_v1 §4.5.3/§5; writes the `[Rolls]` cue (v1 text, short lines like
`Wessel → Sluice Rat A: SUCCESS (26 vs 16)`); records the full breakdown in `data.v2.result` for the battle log;
guarded and replay-safe: Re-read keeps the dice, a swipe draws new ones, delete removes them.
It changes no block values itself: the narrator's own `set-health` / `add-xp` / `practice-N` lines do that.

## A6. "Changed this reply" line
Expose for B: a summary on the reply (`{ exchanges, acts: [...] }`) that B turns into "Rolled for you: N exchanges".

## Tests
The formula and the odds table (v1 §3); seeds (Re-read keeps, swipe changes); refusals; round and stop rules; the
cue budget; the pre-call's off paths (feature off, Rolls off, no Character blocks, timeout); the replay fuzz
extended with plans; feature off ⇒ byte-identical prompts and RNG draws.
