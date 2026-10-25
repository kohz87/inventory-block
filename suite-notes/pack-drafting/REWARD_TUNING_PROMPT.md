# Ersveil pack: tune quest rewards to their rank (Gemini prompt)

## Setup
1. Pull Story_block branch `pack/ersveil-rules` (`git fetch origin pack/ersveil-rules && git checkout pack/ersveil-rules`).
2. The only file to edit is `examples/packs/ersveil-bluewatch/pack.json`. Don't touch anything else.
3. Paste the prompt below to the agent. When it's done, check from the Story_block folder:
   - `node ../kit/check-pack.mjs examples/packs/ersveil-bluewatch/pack.json` must print OK;
   - `node --test tests/v2/packs/ersveil*.test.js` must pass.
4. Commit ("Ersveil pack: quest rewards follow their rank") and push the branch. Tell the lead; it merges after CI.

## Prompt

```
Edit only examples/packs/ersveil-bluewatch/pack.json. Change only the "reward" of quests in content.quests; change
nothing else (no slugs, names, objectives, requirements, other kinds, formatting style).

The pack's content.ranks give each rank a level range ("levels": [min, max]) and a coin range ("reward": [min, max]).
For each quest:
1. Its level is the "min" of its {"kind":"level"} requirement, or 1 if it has none.
2. Its rank is the FIRST rank in content.ranks (in file order: F, E, D, C, B, A, S) whose level range contains that level.
3. reward.coin must lie inside that rank's coin range. If it already does, leave it. If it's outside, set it to the
   nearest end of the range, then round to a whole number ending in 0 (stay inside the range).
4. reward.xp: if you changed coin, scale xp by the same factor (new coin / old coin), round to a whole number ending in 0,
   and keep it at least 10. If you didn't change coin, leave xp.
5. reward.items: leave as they are, unless the total value of the items (each item's "value" in content.items × qty)
   is more than the new coin — then remove the most valuable item rows until it isn't, and list what you removed.
6. Quests with a "chain" keep their order: a later quest in a chain never pays less coin than the one before it (if the
   rule above would make it, raise it to the previous quest's coin, still inside its own rank's range).

Output the edited file in place, then a short table: quest slug | level | rank | old coin → new coin | old xp → new xp,
only for quests you changed, plus any item rows removed. Keep the JSON valid (2-space indent, final newline).
```
