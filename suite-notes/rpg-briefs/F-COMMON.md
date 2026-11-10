# Standard stat formula build (1 Nov) — rules for FA and FB

Hard rules: suite-notes/ui-briefs/UI-COMMON.md (secrets, user data, PID files, no playwright install, no rpg_battle,
exact trailer, no version bump/CHANGELOG, push only your branch, never merge/PR/force/tag, a test per change run after
it, `npm run check` + full `npm test` + `git diff --check` green, browser shots desktop 1440×900 + phone 390×844).

Repo kohz87/Story_block. Base branch **`stage31/formula-base`** (c072d16 = 2.13.0 release branch + `src/v2/lean-rpg/formula.js`
with tests). formula.js is the shared contract: use its functions and numbers; do not change their meaning (if one is
wrong, say so in your report and add a new function instead). Read docs/v2/RPG.md and SPEC_RPG.md §0 first.

Approved mockup: https://claude.ai/artifact/6DEJCMNpUZtUacvZftK2kT (script vm-results/u4/mock.mjs). Correction to the
mockup: **magic is (INT or the skill's stat + DEX/2)/2** — no "INT×2".

The agreed rules (USER, 1 Nov):
- Rolls (class = classWeight × Soul Class, 2 by default; rank 0–3; edge −3..+3 from the situation, then luck):
  physical (STR | skill stat + DEX/2)/2 · magic (INT | skill stat + DEX/2)/2 · defence (higher of AGI/VIT + lower/2)/2,
  dodge/block; against magic INT/VIT (ward) · social (CHA + INT/2)/2 (+ rank with a social skill) · checks (fitting
  stat + DEX/2)/2. A skill's stat takes the main slot; nothing is added on top. Stamina skills are physical, Mana magic,
  unless the plan says defence/social/check. Out of the resource: no skill, rank 0, type default stat.
- Foes: d20 + foeBase + foeClassWeight × class (start 3 + 3×class; tune by simulation). Health 4 + class/2 blocks.
  A hit takes 1 block, a Decisive hit 2. A foe group acts once per round; beaten before its turn = does not act.
- Turn order once per fight: d20 + class + AGI/2 (foes d20 + 2×class); ties higher AGI, then the party; order kept
  across replies for the fight; swipe rerolls, Re-read keeps; late arrivals roll on entry. Quick start: a character
  10+ ahead of a foe gets one opening action against it at the start of the fight (first round only).
- Area: one attack roll vs each target's own defence. Support (heal/buff): roll vs a difficulty, success 1 block,
  Decisive 2. Social/exploration in a fight: vs the foe's roll; outside, vs the narrator's difficulty.
- Luck: luckOf / edgeWithLuck. Rounding once per part (formula.js `pair`).
- Creation: stats 5, 10 points, 3..10; 4 points per Soul Class; stat max 20. Companions the story adds: companionStats.
- Bars: blocksFor (Health 4 + VIT/5, Stamina 3 + AGI/5, Mana 3 + INT/5). A new block from spending points arrives
  full, except while Down (stays Down). A lower stat shrinks the bar and clamps the current value; never knocks Down.
- Standard is the default for new chats; **Classic stays exactly as today** and selectable in Settings → RPG. No
  migration or locking needed (USER: nobody uses it yet), but Classic output (prompts, rolls, fingerprints, data-module
  hashes of the existing templates) must stay byte-identical. Packs may set the formula and its numbers.
- REPLAY: the formula and every number travel inside the roll payload (rules.js REPLAY RULE). Past rolls never change.
