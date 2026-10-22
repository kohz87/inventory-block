# Beta fuzz cell — findings (newest first)

Format: `[severity] repo: title — test path — owner area`

_Pass 1 in progress (heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79). No findings yet._

## Pass 1 (heads SB e0fd33b, RB 924b9a3, SD f001974, NSD 5243d79)
- [medium] Story_block: Re-read while a kind's feature is off wipes that feature's changes on the reply (not restored on re-enable) — results/tests/Story_block/c3-features-reread-off.test.js — SB-features
- [medium] Story_block: preview, feature off, then commit still stores the command (commit checks only head fingerprint) — results/tests/Story_block/c3-features-commit-after-off.test.js — SB-features
- [medium] Story_block: whole-context feature with static in context.parts changes the static prompt but is marked prompt:false — results/tests/Story_block/c3-features-whole-context-static.test.js — SB-features
- [low] Story_block: onBlocked hook still runs while its feature is off (turn.js:302 reads the raw definition) — results/tests/Story_block/c3-features-onblocked-off.test.js — SB-features
