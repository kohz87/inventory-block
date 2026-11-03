# GR-P2B — gear in fights (Story Block 2.18.0 part 2b; USER 3 Nov "proceed with gear fight work, run parallel")

Read LV-CONTRACT.md (all addenda) and GR-INV.md first; the approved gear design is the mockup
https://claude.ai/artifact/DE52d6FCt7Zijwn1R1wKqc (battle-log shots $S/grm/shots/after-battle-{d,p}.png).
Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/gp2b/, push only
your branch, never merge to main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never
weaken/skip/delete a test — pinned changes named, a test per change run after it, `npm run check` + full `npm test` +
`git diff --check` green before push, PID files only, never `pkill -f`/`pgrep -f`, never `playwright install`). If any
command is denied, stop that step and report it; never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: the lead gives you the head of origin/stage53/levels-int (levels merged, review fixes still landing). Branch
`stage56/gear-fight` from it, then `git merge --no-ff origin/stage52/gear-inventory` (gear.js, statBonus, carry,
condition, item.equip, gear.wear) and `origin/stage54/gear-grammar`, keeping both sides' intent. Later, the lead merges
the finished levels-int into your branch — keep commits small and do not rework levels code beyond what gear needs.

## Build — ALL only when the `story-block.gear` feature is on; off = rolls, receipts, witnesses, prompts byte-identical
1. **Stat bonuses in rolls**: the party side reads `inventory.statBonus` for the acting member (equipped, not broken);
   effective stat = stat + bonus, capped at 30. Record the bonus in the roll (payload/result) behind a version mark
   (e.g. `gear: 1`) so old rolls replay exactly and a later equip change does not alter a stored roll. Both formulas
   (Classic and Standard), turn order (AGI) and the Settings odds where they read stats.
2. **Wear on decisive hits**: a decisive hit TAKEN wears the target member's Body armour one step (else Off-hand);
   a decisive MISS wears the actor's own Weapon one step. Steps Good → Worn → Torn → Broken via `gear.wear`. Broken
   gear gives no bonus. Wear is part of the roll's receipt (replays with it; swipe/Re-read/delete undo it).
3. **`wear: ruin` → Broken in one step** (today one ruin = 100→60). scuff/tear stay one step each.
4. **Encumbrance in rolls**: at ≥ 100 % carry the member's AGI and DEX −2 in rolls (recorded like the bonus).
5. **Battle log**: the roll line names the gear ("Astra uses Iaijutsu (Cane Sword +2 DEX) …"), and a wear line after
   the roll ("Boiled Leather Jerkin is worn (Torn)") — as the mockup.
6. **story.legendaryEarned**: true after a quest completion or a won fight against a foe group 10+ levels above the
   party's highest; the narrator's legendary item lines are held to epic until then (seam exists on stage52).
7. Prompt: condition words for equipped gear already go in; check the fight prompt names them once.

## Tests
Each item above; gear off byte-identical (rolls, witnesses, receipts, static prompt); replay equality (live == rebuild
== reload == swipe == Re-read == middle delete) for a fight with a bonus, a wear step and a break; a pre-gear roll
replays unchanged; cap 30; encumbered −2.

## Report
Branch + head; what changed; tests; pinned changes; counts; anything that will conflict with the levels fixes. Short.
