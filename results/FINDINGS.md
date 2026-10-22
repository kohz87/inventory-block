# Beta-candidate breaker pass: findings (newest first)

Format: `[severity] repo: title — test path — owner area`
Heads: SB 6ae03aa, RB 73b3cbb, SD ad7d396, NSD 37addac. Full write-ups are in REPORT.md.

_In progress: a3 (live) is still running._

## a1: capture, display kinds, replay (each test re-run by the lead on a clean clone; all fail on assertions)
- [medium] Story_block: a line of dialogue like "+ coin 5, she said, …" is taken from the story as a change line; the coin is paid and the line disappears — results/tests/Story_block/a1-stray-dialogue-coin.test.js — SB-capture (#123)
- [medium] Story_block: change lines inside code fences, indented code, `>` quotes, `<details>`, `<style>` and multi-line comments are taken and cut out — results/tests/Story_block/a1-stray-code-quote.test.js — SB-capture (#123)
- [medium] Story_block: the hidden comment rewrites "--" as "- -", so Re-read of an unedited reply changes names, notes and chatter — results/tests/Story_block/a1-reread-double-dash.test.js — SB-capture (hideBlock)
- [medium] Story_director: maxJump resets on every Continue (one reply moved the clock 90 days); a Continue also bumps turn.n and resets paid/added/vouched — results/tests/Story_director/a1-time-jump-continue.test.js — SD-tracker (time)
- [medium] rpg_battle: after the time is edited out of a reply and the reply is Re-read, the story-time heal stays (HP full, party.rested 8 h past the clock) — results/tests/rpg_battle/a1-recover-kept-after-reread.test.js — RB-party (recovery) / SB-turn
- [medium] npc_state_delta: the meter change-cap window is keyed by message index; after a middle delete a reply moves trust +25 against a cap of 15 — results/tests/npc_state_delta/a1-meter-window-after-delete.test.js — NSD-meters
- [low] Story_block: Re-read of a stopped reply takes the cut last story line that live capture refused — results/tests/Story_block/a1-stray-stopped-reread.test.js — SB-capture / SB-turn
- [low] Story_block: Re-read after a Continue takes story lines the live Continue refused as too far up (2,164 of 200,000 pairs) — results/tests/Story_block/a1-stray-continue-reread.test.js — SB-capture / SB-turn
- [low] Story_block: a story line containing `<Changes>`/`</Changes>` reads differently live and on Re-read — results/tests/Story_block/a1-stray-tag-in-line.test.js — SB-capture (#123)
- [low] Story_block: near-miss lines ("– coin 5", "− coin 5", "＋ coin 5", "+ coins 5") are neither taken nor reported STRAY — results/tests/Story_block/a1-stray-dash-nearmiss.test.js — SB-capture (#123)
- [low] Story_block: display caps (4 choices, 3 chatter) are counted again on each Continue, and lines past the cap drop without a LIMITED Problem — results/tests/Story_block/a1-display-cap-continue.test.js — SB-extras (§F115)
- [low] Story_block: choices reported FEATURE_OFF while Choices was off are shown once it is turned on — results/tests/Story_block/a1-display-off-then-shown.test.js — SB-extras (§F115)
- [low] Story_block: with Coins set, "+ item Silver Coins", "? loot 2 gold pieces" etc. become items while "+ coin 3 silver coins" is money — results/tests/Story_block/a1-coin-item-forms.test.js — SB-inv (§F108)
- [low] Story_block: when the Coins list lacks the currency's name (default "gold"), "+ coin 2 gold" silently pays 2 copper — results/tests/Story_block/a1-coin-currency-name.test.js — SB-inv (§F108)
- [low] Story_block: a block cut mid-line by the length limit applies the half line ("+ item Ro"; "+ coin 5" for 500) — results/tests/Story_block/a1-open-block-cut-line.test.js — SB-capture (Continue split block)
- [low] Story_director: quest rewards in coins are read too low ("1 gold 5 silver" → 100 copper; "3 gp", "2 platinum" → copper) — results/tests/Story_director/a1-reward-coin-forms.test.js — SD-quests (rewards in coins)

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
