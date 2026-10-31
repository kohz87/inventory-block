# Lean RPG build: rules for every agent (31 Oct)

Repo: https://github.com/kohz87/Story_block. Base branch: `stage16/lean-rpg` (head f50ad31: the feature switch,
`src/v2/lean-rpg/index.js` with the shared names, `src/v2/lean-rpg/templates.js` empty).

## Read first
- `/home/user/inventory-block/suite-notes/SPEC_RPG.md` — the build spec. **§0's "31 Oct revision" block wins over
  every line below it that disagrees** (automatic rolls, no Roll button or Roll form, stage bars, automatic
  level-ups through rules, one Party tab with a card per character).
- `/home/user/inventory-block/suite-notes/SPEC_RPG_v1.md` — the earlier detailed design (formula, odds, pacing and
  stop rules, cue text, battle marker, history strip, replay table). Use it for detail; the revision wins.
- `/home/user/inventory-block/suite-notes/rpg-briefs/<your letter>.md` — your piece.
- Approved mockup v3: https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R (local copy and shots:
  `/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/mock-rpg/`,
  `mock3.mjs` is the script that drew them). Battle log D: https://claude.ai/artifact/Hs3sTqDMLPPedhREoopGLb.

## Where you work
- Clone into your own folder: `git clone https://github.com/kohz87/Story_block <yours>/Story_block`, then
  `git checkout -b stage16/rpg-<letter> origin/stage16/lean-rpg`. Your folder:
  `/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/rpg-<letter>/`.
- Touch only the files your brief names. If you truly need another file, keep the change minimal and say so in
  your report. The lead merges the pieces.
- No dependencies to install. `npm run check` and `npm test` (about 2 minutes) must both pass before you push.
  Never weaken, skip or delete an existing test to get green; if an existing test pins a list you extend, update
  the pin and say so.

## Shared names (src/v2/lean-rpg/index.js — read it; only agent A edits it)
`LEAN_RPG_FEATURE`, `RESOLVE` ('rpg.resolve'), `ROLES` (character/skills/foes/rules), `STATS` (str vit agi dex int
luk cha), `STAGES` (stage words full→empty; **stored values are the stage index, 0 = empty**), `FORMULA`, `PACE`,
`validatePlan`. Templates list: `LEAN_RPG_TEMPLATES` in `src/v2/lean-rpg/templates.js` (only H edits it).

## Interfaces fixed for everyone (SPEC_RPG §3, as revised)
- Definition key `role`: one of ROLES, optional. A block with a role is read by the RPG.
- Int field `names`: `{ "1": "I", …, "9": "IX" }`; only listed values get a name; stored values stay numbers.
- Field `prompt: false`: hidden from the tail and from the grammar (the AI cannot set it); reader and rules can.
- Function `{ type: "card", when, tone: "info"|"warn"|"end", title ≤60, text ≤240, button? }` (only the death card
  uses it now).
- Function `{ type: "reply-end", when, effects }`: settled once at the end of each reply (death latch).
- Character block fields (H writes them; A and B read them by these keys): `who` (text), `health` (int 0–5),
  `mana` (0–4), `stamina` (0–4), `str` `vit` `agi` `dex` `int` `luk` `cha` (1–20), `points` (int), `soul`
  (1–9, names I–IX), `xp` (0–100), `down` (bool, prompt:false), `alive` (bool).
- Skills block: `who`, then five slots `skill1..skill5` (text), `rank1..rank5` (int 0–3, names Novice, Adept,
  Expert, Master), `practice1..practice5` (0–100).
- Foes block: four slots `foe1..foe4` (text name), `count1..4` (int), `class1..4` (1–9), `hurt1..4` (int 0–5,
  health stage of the group).

## Hard rules
- Never read SillyTavern's `secrets.json`, API keys, or the user's chats, characters, personas or settings.
- No model or vendor names in code, comments, commits or docs.
- Commit with this exact trailer, nothing else added:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu
  ```
- Push your branch with `git push -u origin stage16/rpg-<letter>`. Never force-push, never merge, never open a PR,
  never push to another branch, never tag.
- Off means fully off: with the feature off, prompts, saves and RNG draws stay byte-identical to 2.7.2. Existing
  data-module hashes must not change (interpreter-1 basis is frozen in `src/v2/data-modules/hash-basis-v1.js`):
  new keys may only change the hash of a definition that uses them.
- Match the surrounding code's style, naming and comment density. Plain words in reader-facing strings.

## Report (your final message)
Branch and head commit; what you built against each item; tests added; anything you changed outside your files;
open questions or deviations from the spec. Keep it short.
