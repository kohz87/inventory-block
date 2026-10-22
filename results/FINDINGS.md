# Beta-candidate breaker pass: findings (newest first)

Format: `[severity] repo: title — test path — owner area`
Heads: SB 6ae03aa, RB 73b3cbb, SD ad7d396, NSD 37addac. Full write-ups are in REPORT.md.

_In progress: a1 (replay fuzz) and a3 (live) are still running._

## a2: economy and combat (each test re-run by the lead on a clean clone; all fail)
- [medium] rpg_battle: a long rank ladder with few Levels per rank multiplies the per-reply money budget (level 12: 230 → 770,000,000; Ersveil 6.16 billion) — results/tests/rpg_battle/a2-ladder-length-budget.test.js — RB-terms2 / SD-quests / SB-inv
- [medium] rpg_battle: a story line naming a pack item (`+ item River Drake Scale`) turns the goods budget into more coin than the money budget (574 copper sold at a capital vs a 400 budget; storyMade checks only `story/…` ids) — results/tests/rpg_battle/a2-story-named-pack-goods-capital.test.js — RB-trade / SB-inv
- [medium] rpg_battle: a boss written as the 7th foe row is silently dropped; counts over 9 are cut to 9 with no Problem — results/tests/rpg_battle/a2-seventh-row-boss-dropped.test.js — RB-balance2
- [medium] rpg_battle: spreadStunners puts every moved stunner in one extra wave past the field cap (6 Ogres against a field of 4) — results/tests/rpg_battle/a2-stunner-wave-over-field.test.js — RB-balance2
- [medium] rpg_battle: fights never use the pack's creatures; a pack-material quest gets 24-foe fights whose drops the quest never counts (stays 0/72, re-sized to 24 every time) — results/tests/rpg_battle/a2-pack-creatures-unused.test.js — RB-balance2 / quest sizing
- [medium] rpg_battle: quest sizing is per row, not per fight (six rows bring 60 foes for 30 missing, 144 for a big goal; cap 24) — results/tests/rpg_battle/a2-quest-sized-per-row.test.js — RB-balance2
- [low] rpg_battle: splitting a stack of carry items multiplies the bonus (3 Backpacks: +20 as one stack, +60 as three) — results/tests/rpg_battle/a2-carry-split-stacks.test.js — RB-items
- [low] rpg_battle: a 12-rank ladder with Levels per rank 0 loses its top rank in RB; SD bands the same ladder differently — results/tests/rpg_battle/a2-bare-ladder-drops-top-rank.test.js — RB-terms2 / SD-quests
- [low] rpg_battle: long strings of waves break the tier (level 1 vs 27 trivial rats: 9/10 won; vs 54: 5/10, seeded) — results/tests/rpg_battle/a2-many-waves-trivial.test.js — RB-balance2
- [low] rpg_battle: buying a second Backpack while over the carry limit is allowed (bonus assumed, merged stack adds none: 82/76) — results/tests/rpg_battle/a2-carry-buy-second-bag.test.js — RB-items
