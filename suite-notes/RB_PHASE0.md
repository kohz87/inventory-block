# RB rebuild, phase 0: contract, state shapes, pack schema v2, CI matrix (DRAFT)

Status: draft for review (Sol on the VM, then the user). Nothing here is built yet. Sources: the user's decisions in
V2_LOG.md ("RB REBUILD" rounds 1–5, "Death" rounds 1–3, "how it is built"), and RB v2 as of c24e93d.
Every name below is a proposal; section 9 lists what is still open.

## 1. Who owns what

| Area | Owner | Notes |
|---|---|---|
| Story state, turns, records, replay, save points, inventory (stacks), the hub UI, sockets | SB | Save points stay in SB (round 2). |
| World, places, area danger tier, clock, weather, NPC agendas, arcs, goals and threads, factions (optional), non-combat checks | SD | Genre-neutral. Its own roll structure and settings. |
| Rules: classes, skills, pathways, stats, levels and XP, gear rules (slots, hands, requirements, weight), combat, crafting, trade and shops, quests, companions and summons, death rules, difficulty | RB | Requires SD. Quests move here from SD. |
| Relationships (trust, stage, traits), dossiers | NSD | A companion's sheet is RB's, its relationship NSD's. |

Seams (agreed in principle): item definitions are RB's (or a pack's), stacks are SB's; a shop is RB's, keyed by SD's place;
the clock is SD's and RB asks for it; a thread is SD's until RB upgrades it to a quest.

## 2. Dependencies and the CI matrix

- SB alone works. SB + SD, SB + NSD, SB + SD + NSD work. RB needs SB + SD; RB without SD refuses to start and says why.
- A module reads another only through queries (`runQuery` inside a guard; an unanswered query throws) and commands. No imports across repos.
- CI matrix (every module's CI, each PR): the module alone with SB, plus every combination it is allowed in:
  `SB`, `SB+SD`, `SB+NSD`, `SB+SD+NSD`, `SB+SD+RB`, `SB+SD+RB+NSD`. Each combination boots, registers, runs one scripted
  turn (fake ST from the testkit), and checks that no query is left unanswered that the combination should answer.
- The matrix lives in SB (`scripts/matrix.mjs`) and is vendored with the testkit (`sync-testkit.mjs`), pinned to an SB SHA.

## 3. The interface between modules

### RB asks SD (queries; RB fails closed if one is missing)
| Query | Returns | Used for |
|---|---|---|
| `director.time` | `{ day, minute, label }` | quest expiry, training time, condition ticks |
| `world.place` | `{ id, name, kind, tier }` | shops, foe pools, rarity |
| `world.areaTier` | `0..N` for a place id | power budget clamp, rarity cap |
| `threads.list` | SD's goals and threads, `{ id, title, giver, state }` | upgrading a thread to a quest |
| `checks.roll` (optional) | SD's non-combat roll | RB adds stat modifiers via `rules.modifier` |

### RB offers (queries)
`rules.sheet(actorId)`, `rules.modifier({ actor, stat })`, `rules.party`, `rules.quests`, `rules.progress(actorId)`
(promotion and pathway checklist), plus the kept ones: `combat.*`, `items.*`, `trade.*`, `bestiary.creatures`,
`return.*`. SD's checks and NSD's social checks read `rules.modifier`; they never read RB's domains.

### RB offers (commands, each a recorded op with a receipt)
Kept: `combat.*`, `item.*`, `trade.*`, `craft.*`, `party.recover`. New: `class.choose`, `path.choose`, `skill.train`,
`stats.spend`, `quest.accept|abandon|turnIn`, `companion.recruit|dismiss|control`, `summon.end`, `death.resolve`.
Choices (class, path) are deterministic commands; the narrator only gets a tail line and can never make or change one.

### SB offers RB
`inventory.*` (stacks), `purse.*` (see open question 1), `savepoint.list|make|restore`, the `cards` socket, `active` tabs.

## 4. RB state shapes (domains)

```
party:      { pc, members: [actorId] (PC + up to 2 active), reserve: [actorId], control: { [actorId]: 'ai'|'manual' } }
actors:     { [id]: { name, kind: 'pc'|'companion'|'summon', level, xp, stats: { STR, VIT, AGI, DEX, INT, LUK, CHA }, unspent,
                      hp, mp, sp, conditions: [...], gear: { [slot]: stackId }, classPath: [classId] (tier 0..3),
                      skills: { [skillId]: { uses, form: skillOrBranchId, steps: 0..2 } }, active: [skillId] (≤ 3),
                      summonOf?, expires? } }
progress:   { [actorId]: { nextPromotion: 10|20|30|null, nextStep: 40..90|null, waiting: bool } }
quests:     { [id]: { from: threadId|null, kind: 'main'|'bounty'|'repeatable'|'timed'|'chain', giver, goal, reward,
                      requires, due: { day, minute }|null, state: 'offered'|'active'|'done'|'failed'|'expired' } }
training:   { [actorId]: { skill, trainer, cost, until } | null }
death:      { pending: null | { actor, cause: 'battle'|'narrative', check, outcome } , memory: 'deja-vu'|'none'|'full' }
combat, trade, craft: as today (c24e93d), re-pointed at the new sheets.
```
Stats as today: RB's `STATS` (src/rules.js) is 7: STR, VIT, AGI, DEX, INT, LUK, CHA (see open question 4). Every shape carries `rulesVersion: 2`.

## 5. Rules constants (from the user's decisions)

- Level cap 99. Soul Class choices at levels 0, 10, 20, 30 (basic, primary, intermediate, advanced). Each class gives 3
  skills; skills are inherited along the path; 3 active at a time.
- Promotion needs the level AND all 3 of the current class's skills at 5/5. Every skill caps at 5/5.
- From 40, every 10 levels (40–90): one pathway step for one skill, 3 choices = 1 generated power-up + 2 written branches;
  each skill takes 2 steps; a step also needs the current form at 5/5. XP keeps flowing while waiting.
- Skill uses come from combat, from validated narrative lines, and from training (time skip with a trainer, costs money
  and SD time), capped per reply and per story day.
- Stat points are the player's to spend. No respec, ever. Gear has stat requirements, not class locks; 2H and dual wield.
- Weight encumbrance. Rarity random up to epic by area tier; legendary only from packs; unique named items allowed.
- Death: in battle HP 0 = downed; a party wipe = PC death; a downed companion recovers after the fight with an injury.
  In narrative a lethal event goes to a code check: dead or gravely injured unless an intervention. PC death = back to the
  latest save point (manual, or automatic at danger points), state restored, chat kept with a faded-timeline marker,
  the narrator writes the waking scene; memory: déjà vu (default), none (setting), full (pack option).
  Companion death is permanent (code decides).
- Difficulty setting (if cheap). The RB prompt part varies with the situation under an adjustable cap.

## 6. Pack schema v2 (rules pack)

```
{ kind: 'rules', schema: 2, id, name, version,
  stats?: { labels },                       // the stats' display names only
  classes: [{ id, name, tier: 0..3, parent: classId|null, skills: [skillId ×3], blurb }],
  skills:  [{ id, name, kind: 'attack'|'spell'|'support'|'passive', stat, cost: { mp|sp }, effect, max: 5, icon? }],
  branches:[{ id, skill: skillId, step: 1|2, name, effect, blurb }],          // written; the power-up is generated
  items:   [{ id, name, kind, slot: <one of the 8>, hands: 1|2, requires: { stat: n }, weight, rarity, value, effect }],
  foes:    [{ id, name, tier, stats, skills, loot }],
  trainers?, shops?, questTemplates?, memory?: 'full' }
```
- The 8 slots: main hand, off hand, head, body, legs, feet, accessory 1, accessory 2 (the standard deferred from beta).
- Validation in code: unique ids, every reference resolves, every class has exactly 3 skills, tiers chain by `parent`,
  each skill has 2 steps of branches (2 written per step), the power budget per tier holds (formula in phase B; the
  validator and Studio share it), text fields capped, no HTML.
- The standard pack doubles as Studio's baseline and as the test fixture.

## 7. Migration

Fresh start (user decision): a rules v1 save is read as before by the v1 rules and offered "start a new character";
nothing is converted. A v2 save without `rulesVersion: 2` is refused with a notice, never guessed.

## 8. Phase 0 deliverables

1. This document, reviewed and frozen (CONTRACT.md in SB once agreed).
2. Contract tests in SB's testkit: the queries and commands above, with fake answers, so each track tests against them.
3. The pack schema v2 validator (SB `packs/validate.js` kind `rules` v2) and the standard pack's skeleton (ids only).
4. The CI matrix script and one workflow per repo.
5. Fixture states for track C (RB UI): a fresh PC, a mid-path party, a promotion waiting, a fight on, a death pending.

## 9. Open questions (for the user)

1. The purse: the earlier after-beta item moved money SB → RB; round 2 of the rebuild keeps inventory and purse in SB.
   Proposal: the purse stays in SB (it is a stack-like store), and RB owns prices, sinks and rewards through `purse.*`.
2. Save points: SB keeps them; does RB need an automatic save before every danger point (fight start, lethal check), or
   only when SD flags the area as dangerous?
3. Summons: do they count against the PC + 2 limit? Proposal: no, they are temporary units outside the party.
4. Stats: the decisions say "the same 6 stats", but RB has 7 (STR, VIT, AGI, DEX, INT, LUK, CHA). Keep all 7, or drop one
   (CHA, if social checks move to NSD's dossier)? And may a rules pack rename them (labels only)?
5. Quests that come from SD threads: does SD's thread close when RB's quest is done, or stay as SD's record?
