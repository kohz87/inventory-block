# Breaker a2 — break pass 2 — economy and combat edges

Heads: Story_block 6ae03aa, rpg_battle 73b3cbb, Story_director ad7d396, npc_state_delta 37addac
(clones in /home/user/cell/a2/, branch v2; RB's vendored testkit is already synced to SB 6ae03aa).
Tests: /home/user/cell/a2/out/tests/<repo>/a2-*.test.js — drop into `<repo>/tests/v2/break/`; each was
copied into my clone's tests/v2/break/ and run with `node --test` and FAILS on these heads.
Probes: /home/user/cell/a2/out/scripts/.

Previous a2 findings re-checked first: a2-boss-held-back, a2-prices-ignore-money-scale,
a2-ranked-boss-below-strong (RB) and a2-reread-after-vouched-click (SB) all PASS now (fixed).

## Summary
Totals: critical 0 · high 0 · medium 6 · low 4 (10 findings, 13 failing test cases in 10 files, all in rpg_battle;
several have Story Director / Story Block parts named in the write-up).

- [medium] rpg_battle: a long rank ladder with few Levels per rank multiplies the per-reply money budget (level 12: 230 → 770 000 000) — tests/rpg_battle/a2-ladder-length-budget.test.js — RB-terms2 / SD-quests / SB-inv
- [medium] rpg_battle: story lines that name a pack item launder the goods budget past the money budget (574 vs 400 at a capital) — tests/rpg_battle/a2-story-named-pack-goods-capital.test.js — RB-trade / SB-inv
- [medium] rpg_battle: a boss written as the 7th row is silently dropped; counts over 9 cut to 9 — tests/rpg_battle/a2-seventh-row-boss-dropped.test.js — RB-balance2
- [medium] rpg_battle: moved stunners land in one extra wave past the field cap (6 Ogres vs field 4) — tests/rpg_battle/a2-stunner-wave-over-field.test.js — RB-balance2
- [medium] rpg_battle: fights never use packs' creatures; a pack-material quest's sized fight drops an uncounted item (0/72, re-sized to 24 forever) — tests/rpg_battle/a2-pack-creatures-unused.test.js — RB-balance2 / quest sizing
- [medium] rpg_battle: quest sizing is per row (60 foes for 30 missing, 144 for a big goal; cap 24) — tests/rpg_battle/a2-quest-sized-per-row.test.js — RB-balance2
- [low] rpg_battle: splitting a stack of carry items multiplies the bonus (+20 → +60) — tests/rpg_battle/a2-carry-split-stacks.test.js — RB-items
- [low] rpg_battle: a bare 12-rank ladder loses its top rank in RB; SD bands it differently — tests/rpg_battle/a2-bare-ladder-drops-top-rank.test.js — RB-terms2 / SD-quests
- [low] rpg_battle: 54 written trivial foes in waves are a coin flip (27: 9/10, 54: 5/10) — tests/rpg_battle/a2-many-waves-trivial.test.js — RB-balance2
- [low] rpg_battle: buying a second bag while over the carry limit is allowed (82/76) — tests/rpg_battle/a2-carry-buy-second-bag.test.js — RB-items

(The test files are also copied into my clone's rpg_battle/tests/v2/break/ to run them; nothing was committed or pushed.)

## Findings

### B-a2-1 [severity: medium] A long rank ladder with few Levels per rank multiplies the per-reply money budget millions of times
- repo: rpg_battle (src/terms.js:423 rankReward; :448 settle) with Story_director src/v2/quests/ranks.js:26
  rewardByPlace / :136 readerLadder and Story_block src/v2/domains/inventory.js:1211 storyCoinBudget
- repro: all four modules, no pack. RPG Battle Terms: Rank ladder = 12 lines "Circle 1" … "Circle 12",
  Levels per rank = 1. Character Wessel (fighter) granted 1100 XP → level 12. Reply `+ coin 999999999`.
- expected: renaming/re-banding the ladder (a Terms setting) keeps the money rules of a level-12
  character about where they are (default ladder: rank E, budget 230 a reply).
- actual: the rank reward is "by place" (×4.5 a rank, from 10–50 at the first), so rank 12 pays
  170 000 000–770 000 000; Story Block's budget is the top of the party's rank → 770 000 000 a reply and the
  `+ coin 999999999` line pays 770 000 000 (default ladder: 230). With the Ersveil pack (scale 8) the same
  ladder gives 6 160 000 000 a reply. Quest reward caps follow the same numbers. Side notes from the probe:
  12 ranks with Levels per rank 0 give RB 11 ranks and SD 12 (two with levels null); Levels per rank 999
  gives RB 1 rank, SD 12 (ranks 2-12 squeezed onto levels 988-999). The other way round, a one-rank ladder
  ("Only") holds every reply to 50 at any level (level 61: 50 vs 420 000 on the default ladder).
- invariant: 3 (code's money caps; a terms/cosmetic setting moves them by ~3 000 000×)
- suggested fix: price a rank by the levels it covers, not its place: e.g. reward range = the default
  ladder's range at the rank's first/last level (or 1000 × its top level × scale, the no-quest fallback),
  so a ladder with more, narrower ranks pays the same at a given level. Hold readerLadder and settle to the
  same function in RB and SD, and cap the per-reply budget at the by-level fallback × some factor.
- owner area: RB-terms2 (rank ladder) / SD-quests (ranks) / SB-inv (story budget)
- test: tests/rpg_battle/a2-ladder-length-budget.test.js

### B-a2-2 [severity: medium] Story lines that name a pack item launder the goods budget into more coin than the reply's money budget
- repo: rpg_battle, src/v2/trade/core.js:353 (storyMade: by def id `story/…` only) and :361-370 (sellEach)
- repro: all four modules + Ersveil (budget 400 copper a reply, goods 800 by worth). Reply
  `+ item River Drake Scale | qty: 2` and `+ item Small Monster Core | qty: 4` (pack materials, worth 600 + 200:
  inside the goods budget, so all are given as `pack.ersveil-bluewatch/…` defs). Next reply
  `~ place Highcrown | kind: capital`; trade.sell each stack to `crafter`.
- expected: RB #106: "the story's own goods sell for at most worth × the sell rate, so a capital never pays
  more than a reply's money budget" (≤ 400).
- actual: 430 + 144 = 574 copper. The defs are the pack's, so the capital's sell 1.1 and the crafter's
  material taste 1.3 apply (a town already pays 520). A lorebook `market: capital; desert, frontier; sell 4`
  for the place would multiply it again (×4 own sell, ×1.3 env cap) to ~2.7× the goods' worth.
- invariant: 3 (story text turned into coin past the per-reply budget)
- suggested fix: decide "story's own" by where the stack came from, not the def id: Story Block already knows
  a stack was given by a story line (the reply's goods tally); mark such stacks (e.g. `stack.story: true`,
  kept through merge/split/transfer like `key`) and have sellEach apply the story cap to them, or hold the
  whole sale of a stack to min(fetched, worth × sellRate) whenever it has no `trade.paid` and did not come from
  a fight's loot or a shop.
- owner area: RB-trade (pricing) / SB-inv (story goods provenance)
- test: tests/rpg_battle/a2-story-named-pack-goods-capital.test.js

### B-a2-3 [severity: low] Splitting a stack of things that carry multiplies the carry bonus (one stack of 3 Backpacks: +20; three stacks: +60)
- repo: rpg_battle, src/v2/items/carry.js:86-101 (carryBonuses: "a stack adds its bonus once, whatever its count")
- repro: Ersveil (Backpack: `carry: 20`). Reply `+ item Backpack | qty: 3` → one shared-bag stack, party
  capacity 76. inventory.split { qty: 1 } twice → three stacks of 1 → capacity 116. Transferring them to
  the PC merges them back into one stack → that member +20 only.
- expected: the same three Backpacks give the same capacity whatever the stack shape (either once, as the
  comment says, or once per piece).
- actual: per stack: 20 / 40 / 60 as the reader splits; a free click raises capacity, merging lowers it.
- invariant: 1-adjacent rule consistency / RB carry rule (F106): a number set by a click's layout, not the rule.
- suggested fix: count by def per owner, not per stack: for each (owner, def) add carry once (or
  carry × total qty if pieces are meant to add up), so split/merge never change it.
- owner area: RB-items (carry, F106)
- test: tests/rpg_battle/a2-carry-split-stacks.test.js

### B-a2-4 [severity: medium] A boss written as the 7th foe row is silently dropped (and counts over 9 are cut to 9): not every written foe is fought
- repo: rpg_battle, src/v2/combat/encounter.js:102 (`bossFight = rows.slice(0, MAX_FOES)…`), :105 (`rows.slice(0, MAX_FOES)`), :109 (`Math.min(MAX_COUNT, …)`); MAX_FOES 6, MAX_COUNT 9 (:31-32)
- repro: market() (Wessel, fighter, Bluewatch). Reply `! encounter Rat, Wolf, Bat, Spider, Goblin, Slime, Rat King (boss) | tier: weak`; combat.start.
  Also `! encounter 12 Cellar Rat | tier: trivial`.
- expected: setup.planWaves' rule "every foe the story wrote is fought … bosses take their places first"
  (the B-final-7 fix): the Rat King is fought (first), and the fight is held to strong; 12 rats are fought
  in waves — or the line is refused / a Problem says what was cut.
- actual: offer has 6 rows, no Rat King, tier stays weak (bossFight only looks at the first 6 rows); receipt
  "Wessel against Rat, Wolf, Bat, Spider, Goblin, Slime (2 more in later waves)". 12 Cellar Rat → 9 fought,
  receipt "Cellar Rat ×9". Nothing tells the reader or the next reply's tail that foes were left out.
- invariant: RB combat rule (every written foe fought, bosses first); story/fight mismatch (4: silent drop, no Problem)
- suggested fix: read all rows; pick bosses first when trimming to MAX_FOES (and compute bossFight over all
  rows); for counts over MAX_COUNT either keep the count (waves already bound the field) or add a Problem /
  offer note "12 written, 9 fought". Same for a quest-sized fight's kept count.
- owner area: RB-balance2 (encounter reading, waves)
- test: tests/rpg_battle/a2-seventh-row-boss-dropped.test.js (2 cases)

### B-a2-5 [severity: medium] Stunners moved out of a wave all land in one extra wave past the field cap (6 Ogres at once against one member, field 4)
- repo: rpg_battle, src/v2/combat/setup.js:403-416 (spreadStunners: every excess stunner → `wave: last + 1`)
- repro: market(); reply `! encounter 4 Ogre; then: 4 Ogre; then: 4 Ogre | tier: trivial`; combat.start.
- expected: no engagement has more foes than the field (fieldPerMember 4 × 1 member) nor more stunners than
  MAX_STUNNERS.trivial (2 a member) — the point of both caps.
- actual: waves of 2, 2, 2, then 6 Ogres (all with Stomp/Crushing Blow stuns). With `9 Ogre` alone: 2, 2, 1, 4
  (4 stunners in the last wave). The stunner rule makes the last wave the most dangerous one.
- invariant: RB combat rules (on-field cap, stunner cap)
- suggested fix: run spreadStunners before planWaves' chunking (or re-chunk after it): treat each moved stunner
  as a new row for the wave planner so extra waves are filled up to min(field cap, stunner cap) and more
  waves are added as needed.
- owner area: RB-balance2
- test: tests/rpg_battle/a2-stunner-wave-over-field.test.js

### B-a2-6 [severity: medium] Fights never use a pack's creatures; a pack-material item quest's quest-sized fight drops an item the quest does not count (0/72 after 24 kills, re-sized to 24 every time)
- repo: rpg_battle, src/v2/combat/index.js:447 (combat.start: `chatBestiary = bestiaryList(ctx.read('bestiary'))`)
  and :673 (captureEncounter: same); nothing in src/ reads `packs.content({ kind: 'creatures' })`;
  quest sizing in src/v2/combat/quest.js:62-71 (questItemOf's made-up branch) + setup.js:485 (reliableLoot)
- repro: all four modules + Ersveil (whose `creatures` include River Drake: level 12, loot River Drake Scale
  60 %, Small Monster Core 20 %).
  (a) `! encounter River Drake | tier: even`; combat.start → setup.enemies[0].loot = Drake Scale, Drake Tooth,
  Scale Guard, Healing Draught (the drake template's), not the pack's.
  (b) `+ quest Drake Scales — … | goal: bring 72 River Drake Scale | reward: 10 copper | giver: Fenna`, then
  `! encounter River Drake | tier: trivial` → offer sized to 24 River Drakes with questItem "River Drake
  Scale"; won → 34 "Drake Scale" (story/drake-scale) granted; quest.progress 0/72. The next encounter is sized
  to 24 again (and again), each a sure drop of a sellable story item.
- expected: PACKS.md: creatures are records "for RPG Battle's bestiary" — a pack's creature is fought with its
  level, moves and loot; a quest-sized fight's sure drop is the item the quest counts (quest.js header).
- actual: pack creatures are ignored (bestiary domain starts `{ creatures: {} }`); reliableLoot matches the
  quest noun loosely (`nounNames(row.name, item)`: "Drake Scale" ⊂ "River Drake Scale") and makes that row
  sure, so the drop is never the quest's item; quest progress never moves and quest sizing keeps bringing 24.
- invariant: RB combat/quest rules (quest-sized fights: the quest item drops; ≤ what's missing); pack content honoured
- suggested fix: seed lookups with the enabled packs' creatures (combinedBestiary(chat, packCreatures, DEFAULT)
  in both captureEncounter and start); in reliableLoot prefer an exact (noun ⊆ row) match and otherwise add the
  quest's own item row (not a looser row), so the sure drop is always the counted thing.
- owner area: RB-balance2 (bestiary/packs) / RB-quest sizing (wave C)
- test: tests/rpg_battle/a2-pack-creatures-unused.test.js (2 cases)

### B-a2-7 [severity: medium] Quest sizing is per row: six rows the quest's noun names bring 60 foes for 30 missing, 144 for a big goal (cap 24)
- repo: rpg_battle, src/v2/combat/quest.js:80-104 (questSized: `want`/`most` computed for each row, never summed)
- repro: all four modules, no pack. `+ quest Rat Cull — … | goal: kill 30 Rat | reward: 40 gold | giver: Fenna`;
  next reply `! encounter Cellar Rat, Sewer Rat, Giant Rat, Plague Rat, Bog Rat, Dire Rat | tier: trivial`.
  Same with `goal: kill 1000 Rat`.
- expected: quest.js header and wave C: a quest-sized fight brings ≥ ⅓ of the goal, at most what is still
  missing, at most QUEST_MAX_FOES (24) — for the fight.
- actual: each of the 6 rows ("… Rat" is named by the noun "Rat") is sized alone: 10 each → 60 foes (30 missing);
  with 1000 missing, 24 each → 144 foes in 18 rows (waves of 4). Writing the same name six times
  (`! encounter Cellar Rat, Cellar Rat, …` for "kill 30 Cellar Rat") also gives 60. A level-1 fighter loses the "trivial" fight
  (auto) — the tier no longer means its danger; XP/loot per reply scale ×6.
- invariant: RB quest-sizing rule (≤ missing, ≤ 24); the tier's promise
- suggested fix: size per target, not per row: keep a running `left`/`budget` per quest (start at
  min(QUEST_MAX_FOES, ceil(left/per))) and subtract each sized row's count, sizing later rows only from what
  remains (unwritten-count rows only; written counts kept as now but counted against it too).
- owner area: RB-balance2 (quest-sized fights, wave C)
- test: tests/rpg_battle/a2-quest-sized-per-row.test.js (2 cases)

### B-a2-8 [severity: low] A bare 12-rank ladder (Levels per rank 0) loses its top rank in RPG Battle, and Story Director bands it differently
- repo: rpg_battle, src/terms.js:470-478 (rankLadder: `band: ceil(cap / ranks)`) and :458 (settle: `if (levels[0] > cap …) break`);
  Story_director src/v2/quests/ranks.js:136-147 (readerLadder: uses RB's banding only when lengths match, else
  ladderFrom → DEFAULT_LEVELS by place, null past 7)
- repro: RPG Battle Terms: Rank ladder "Circle 1" … "Circle 12", Levels per rank 0; all four modules, no pack.
  Read party.ranks and quest.ranks.
- expected: "spread to the level cap": all 12 ranks on one ladder that every module reads alike (SB packs/ranks.js
  header: "so Story Director's quest ranks, RPG Battle's party and foe ranks and Story Block's own coin budget
  all follow it").
- actual: RB: 11 ranks of 9 levels (1-9 … 91-99); "Circle 12" is gone (a foe's `rank: 12` / the party can
  never reach it). SD: 12 ranks banded 1-5, 6-12, 13-20, 21-30, 31-40, 41-50, 51-60, then 5 ranks with no
  levels. A level-70 character is RB "Circle 8" but SD's quest rank (and so Story Block's coin budget) "Circle 7";
  levels 1-60 disagree too (RB 4 = 28-36, SD 4 = 21-30).
- invariant: one ladder across modules (F105); quest pay/budget rank ≠ the party rank shown
- suggested fix: band a bare ladder with floor(cap/n) levels a rank and give the remainder to the last (or
  distribute it), never dropping a written rank; have SD use RB's `party.ranks` whenever RB answers (match by ids
  of the ranks it has), or move the banding to SB's readerRanks so both read the same levels.
- owner area: RB-terms2 / SD-quests (ranks)
- test: tests/rpg_battle/a2-bare-ladder-drops-top-rank.test.js

### B-a2-9 [severity: low] Long strings of waves break the tier: 54 written trivial foes are a coin flip for a level-1 fighter (27: 9/10 won; 54: 5/10)
- repo: rpg_battle, src/v2/combat/setup.js:287 (MAX_EFFECTIVE 24), :285 (GROUP_MIN_SCALE), :393-399 (effectiveHeadcount) with :378 planWaves
- repro: market() (Wessel, fighter, level 1); reply `! encounter 9 Cellar Rat, 9 Cellar Rat, 9 Cellar Rat, 9 Cellar Rat,
  9 Cellar Rat, 9 Cellar Rat | tier: trivial`; combat.start; auto to the end. Seeded ×10 (seeded(seed × 101)).
- expected: Fights setting help: "The tier still means the same danger: it counts the whole encounter" — a
  trivial fight is won about always, however many waves the story writes (6 rows × 9 is the most it may).
- actual: 3 rows (27 rats, 7 waves): won 9/10; 6 rows (54 rats, 14 waves): 5/10. `| tier: weak` with 54 is
  also ~6/12 in my unseeded probe: past the headcount cap / scale floor the tier word stops mattering. Quest
  sizing (B-a2-7) produces such fights on its own (144 rats: lost).
- invariant: RB combat rule (a tier means one danger for any headcount and waves)
- suggested fix: when the effective headcount passes MAX_EFFECTIVE or a foe hits GROUP_MIN_SCALE, refuse /
  trim the encounter to what the tier can hold (with a Problem naming what was cut), or let the party recover
  between waves in proportion; and cap quest sizing below that point.
- owner area: RB-balance2
- test: tests/rpg_battle/a2-many-waves-trivial.test.js

### B-a2-10 [severity: low] Buying a second bag while over the carry limit is allowed (its bonus is assumed, but the merged stack adds none)
- repo: rpg_battle, src/v2/items/carry.js:154-162 (canCarry `brings`) vs :86-101 (carryBonuses: once per stack)
- repro: Ersveil, Bluewatch. Reply `+ coin 400`, `+ item Backpack`; then `+ item Coarse Bread | qty: 10` until the
  party is over its limit (80 / 76, encumbered). trade.buy a Backpack from Watch Stores.
- expected: "Your own buys and takes are still refused" past the limit (a Torch: REFUSED "80 of 76 carried").
- actual: the Backpack is bought: canCarry adds its +20 to the capacity for the check, but it merges into the bag's
  Backpack stack, which still adds 20 once → 82 / 76 after the buy.
- invariant: RB carry rule (F39/F106)
- suggested fix: compute `brings` from the capacity the inventory would have after the add (carryBonuses on the
  inventory with the thing merged in), not from the def alone; fixing B-a2-3 by counting per (owner, def) gives this.
- owner area: RB-items (carry)
- test: tests/rpg_battle/a2-carry-buy-second-bag.test.js

## What held up (what I ran, with counts)

- Prior a2 findings: a2-boss-held-back (2 cases), a2-prices-ignore-money-scale, a2-ranked-boss-below-strong (RB)
  and a2-reread-after-vouched-click (SB) all pass on these heads — fixed; I did not refile them.
- Coins (MODULES §F108) with Ersveil's coins (copper/bronze 1, silver 10, gold 100) and scale 8 (p8-coins): `+ coin 3 gold`
  = 300, `3 silver` = 30, `+ item Gold | qty: 2` = 200, `2 gold coins`, `1 bronze` = 1, `? loot 2 gold` held as loot coin,
  `+ coin 1,000 copper` held to the 400 budget (shown "4 gold"). 8 money paths, all converted before the budget and held.
- Markets (p13-market-fuzz): 20 000 random pack type/tag/place records and lorebook entries through marketAt/goodsFactor:
  no throw, buy/sell finite and > 0, every category's environment factor inside ±30 % (ENV_CAP) incl. `all` × category,
  `__proto__`/`toString` types and tags inert. The only odd values were stock arrays the pack validator already refuses.
  Lorebook `market:` lines: out-of-range factors dropped, `__proto__` refused.
- Buy-low/sell-high: bought things stay capped by trade.paid (least paid) at any place; a pack shop's explicit prices
  kept; crafting (inputWorth uses the least any buyer pays) and commissions (cap = fee + least sale) mint nothing from
  story materials (code reading + p2). Story `story/…` goods at a capital are held to worth × sell rate (RB #106).
- Quests straight to Active (p9, p9b, p14, p17): a duplicate `+ quest` in one reply makes one thread; one kill counts for
  one quest; a re-opened finished quest is CLAIMED; two item quests for the same 3 Rat Tails pay once (tails handed
  over); goal 0 is story-vouched (not paid on its own); finish → swipe → finish again → swipe back: wallet/tails/quest
  restored exactly each time and a cold rebuild matches.
- Quest-sized fights (p5): a made-up Marsh Wyvern item quest sized 4 then 3 (≤ missing), sure drops counted 15/12;
  Rat Tail quest 4/12 after a sized fight; boss rows and written counts never sized. Flee mid-wave (p6, 6 seeds):
  kills of a fled/lost fight count for no kill quest; XP for the kills only.
- Field cap and waves (p4): 9-per-row counts, 6 rows × 9 (54) all fought in waves of 4; bosses placed first within a
  written wave; 6 + 3 bosses fought, all marked boss. Trivial/weak auto fights of 4-27 foes: 12/12 and 10/10 won (p7).
- AoE per target (p18): 40 seeded fights × 5 presets: 26 partial-hit area lines, 3 miss-everyone; misses take no damage
  (code: strike returns before damage).
- Story XP awards: per-reply claims (1 big, 2 minor) by reply sid; numbers written are ignored (code reading).
- Ladder shapes (p1, p15): 1 rank, duplicate names (A/a merged), 9 ranks × 10 levels (RB = SD), 5 bare ranks (RB = SD);
  only the cases filed above disagree. Character import prices a known def by the chat's value (code reading).
- Invariant 1 (p11): after story goods + quest, a stack split, a quest-sized fight, sales at a capital and a 3-wave
  ogre fight, a cold rebuild equals live in every domain (6 checkpoints).

Scripts (all in /home/user/cell/a2/out/scripts/): p1-ladder-budget, p2-pack-goods-launder, p3-carry, p4-field,
p5-quest-sized (+p5b-bestiary), p6-flee-waves (+p6b), p7-tier-waves, p8-coins, p9-quest-dup, p9b-goal0,
p10-quest-rows, p10b-long, p11-rebuild, p12-ranked-headcount, p13-market-fuzz, p14-two-item-quests,
p15-ladder-agree, p16-carry-buy (+p16b), p17-quest-swipe, p18-aoe. They import from the clones in
/home/user/cell/a2/ (rpg_battle/tests/v2/break/helpers/suite.js, econ.js).

Not filed (notes for owners): a lorebook `market:` line may give a place `sell 4` (and `buy 0.25`); with a buyer's
taste 1.3 and the env cap that pays 3.4× a pack item's worth for unpaid pack things (start gear, pack loot) — the
reader's/author's own content, but the 0.25-4 range is wide. `market: town;;buy 0.25;sell 4` reads only the buy (one
`;` part for prices). Debuffs (CHA skills) roll DEX vs AGI, not their stat. A 12-rank ladder (bare) disagreement at
level 61+ is in B-a2-8. The story's `~ place X | kind: capital` sets the place's sell factor (+10 %) anywhere.
