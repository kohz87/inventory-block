# GR-CAST — NPC signature gear (Story Block 2.18.0; USER approved 3 Nov)

Rules: X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/grc/, push only your branch,
never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned
changes named, a test per change run after it, `npm run check` + full `npm test` + `git diff --check` green before push;
b1r2-capture timing tests fail under machine load — re-run alone once and report; PID files only). If any command is
denied, stop that step and report it; never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage52/gear-inventory (2251cf3: gear.js, item slots/rarity/stat bonuses, item.equip).
Branch `stage56/gear-cast`. Do NOT edit roll files (resolve/precall/open/fight/formula/standard) or the Ersveil pack
(its items come later, after the levels and gear branches merge). Read src/v2/packs/cast.js, validate.js items, and how a
cast member joins the party (`+ party` / companions — find it) first.

## Build
1. Cast field `gear`: a list (≤ 6) of pack item slugs/names, validated against the pack's items (must be kind
   equipment with a slot; unknown → refused with a clear message; two items for one slot → refused, Accessory may
   take two).
2. When that cast member joins the party (only with `story-block.gear` on), their gear items are added to the party
   inventory owned by them and equipped in their slots via item.equip, condition Good, as one receipt with the join
   (swipe/Re-read/delete undo it; replay equal). Gear off: join exactly as today (byte-identical receipts).
   Joining again after leaving does not duplicate items they still own.
3. Prompt: while the member is not in the party, the narrator's cast entry names their signature gear in a short
   "Gear:" line only when gear is on (stays in the static/cast part; byte-identical when off).
4. Docs: PACKS.md cast section + GEAR.md short "Signature gear".
## Tests
Validation (unknown item, non-equipment, slot clash, two accessories ok), join with gear on/off, rejoin no duplicates,
replay equality, prompt bytes off.
## Report
Branch + head; what changed; tests; pinned changes; counts. Short.
