# Beta fuzz cell — findings (newest first)

Format: `[severity] repo: title — test path — owner area`

_Pass 1 in progress (heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79). No findings yet._

## Pass 1 (heads SB e0fd33b, RB 924b9a3, SD f001974, NSD 5243d79)
- [high] Story_director: fetch quests of story-minted items pay past the per-reply budget, many turn-ins per reply (300 coin at level 1 / 1380 with rank S) — results/tests/Story_director/c2-fetch-quest-story-items.test.js — SD-ranks (quests)
- [medium] Story_block: a <Changes> block split across a Continue loses the continuation's lines and leaves raw markup visible — results/tests/Story_block/c2-continue-split-block.test.js — main (SB capture/turn)
- [medium] Story_block: a reply cut off mid-reasoning applies the draft block inside the unclosed <think> — results/tests/Story_block/c2-cut-mid-reasoning.test.js — main (SB capture)
- [medium] Story_block: hiding a block writes reasoning-blanked text back into the message; a mid-line <Changes> mention hides the rest of the story — results/tests/Story_block/c2-hide-masked-body.test.js — main / SB-storage
- [medium] Story_block: Re-read while a kind's feature is off wipes that feature's changes on the reply (not restored on re-enable) — results/tests/Story_block/c3-features-reread-off.test.js — SB-features
- [medium] Story_block: preview, feature off, then commit still stores the command (commit checks only head fingerprint) — results/tests/Story_block/c3-features-commit-after-off.test.js — SB-features
- [medium] Story_block: whole-context feature with static in context.parts changes the static prompt but is marked prompt:false — results/tests/Story_block/c3-features-whole-context-static.test.js — SB-features
- [low] Story_block: "+ coin" reads other minus signs (‐ ‑ ‒ ⁻ ₋ ﹣ －) and fractions/superscripts as whole positive amounts (within budget) — results/tests/Story_block/c2-coin-amount-forms.test.js — SB-inv
- [low] Story_director: time maxJump is held per line, not per reply (150 × "! time +30d" = 4,500 days) — results/tests/Story_director/c2-time-jump-per-reply.test.js — SD-digest
- [low] Story_block: onBlocked hook still runs while its feature is off (turn.js:302 reads the raw definition) — results/tests/Story_block/c3-features-onblocked-off.test.js — SB-features
