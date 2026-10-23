# RB rebuild, phase 0: revised contract

Status: revision for the user; not frozen or implemented. Sources: [V2_LOG.md](V2_LOG.md),
lines 747–782 and 795–802. Later USER entries win. `P01`–`P15` are proposals, not decisions.
They supply concrete defaults for implementation and appear again in §12. The confirmed
three-skill swap and 24 written + 12 generated pathway graph are decisions, not proposals.

The [API appendix](RB_PHASE0_APIS.md) lists retained names, payloads, projections and file:line.
Code paths start at `/tmp/p0v2`; SB, RB, SD and NSD mean the four repositories. Citations refer
to §2's pinned heads. “New” means work to build, not an API available at those heads.

## 1. Ownership

| Authoritative area | Owner | Boundary |
|---|---|---|
| Reply records, operations, receipts, claims, replay, snapshots, save points, faded intervals, hub and sockets | SB | SB coordinates restoration; other owners participate. |
| Stacks, quantities, ownership, equipped-slot records, base-unit wallet balances | SB | RB supplies item rules, effects, legality, prices, rewards and sinks. Actor gear is a derived view of SB stacks. |
| Current scene place, presence and displayed weather | SB | Keep `scene.place/present/weather` (SB `src/v2/domains/scene.js:202`). SD owns world/weather policy and calls these commands. |
| World, atlas, area danger, clock, weather policy, agendas, arcs, goals, threads, journal, optional factions/reputation, non-combat rolls | SD | Genre-neutral. No RPG rewards, class requirements or quest settlement. |
| Classes, three current skills, pathways, stats, XP, pools, conditions, gear legality, combat, bestiary, crafting, markets, currency policy, quests, party, temporary units, death checks | RB | Requires SB and SD. Shops use SD place IDs; training uses SD time. |
| Dossiers, relationships, trust, stages, traits, presets, native history/checkpoints | NSD | Stable NPC ID links companion to dossier. RB cannot draft NSD storage. |

SB refuses duplicate names and limits drafts to their owner (SB `src/v2/registry.js:411`,
`src/v2/commands.js:227`). Domains are keyed by name and initialization never resets an existing
domain (`registry.js:558`). Cross-owner reads are not isolated: `ctx.read` and SDK views expose
state (`commands.js:223`, `sdk.js:217`). Query-only cross-owner reads are this contract's rule,
not an existing access-control guarantee.

Complete mechanics ownership register. UI, prompts and hooks follow their mechanics owner.
A capture kind has one registered owner, even when its feature is off.

| Domain(s) after rebuild | Owner | Commands / capture kinds | Disposition |
|---|---|---|---|
| `inventory`, `scene` | SB | `inventory.*`, `wallet.*`, `scene.*`; item/coin/loot/place/present/weather and display-only choice/chatter | Keep storage; add policy delegation and definition-ID transport. |
| `savepoints` | SB | New `savepoint.make/restore`, host day-boundary step | New replay-owned snapshots; branch bookmarks remain separate. |
| `director`, `atlas`, `chronicle`, `arc`, `checks` | SD | `director.*`, `atlas.*`, `chronicle.*`, new `threads.link/close`, `checks.roll`; time/agenda/event/hook/clock/beat/secret/route/landmark/world/faction/check | Move checks from RB; keep generic threads; remove RPG quest capture and payout. |
| `rules`, `party`, `progress`, `training`, `quests`, `death` | RB | Creation/party/progression/quest/death commands in §3; retained party capture, wound/join/skill/rest/leave/xp, new skill-use/lethal/intervention, transferred quest | New rules state; no implicit reset of old `party`. |
| `creation`, `effects`, `gear`, `combat`, `bestiary`, `trade`, `craft` | RB | Retained creation/effect/item/combat/trade/craft APIs; effect/use/encounter/recipe/craft/market/repair/refine | Keep creation flow, timed effects, wear/refinement and engines. Replace sheet adapters. `gear` stores wear/refinement, not equipped slots. |
| `npc` meters and NSD native store | NSD | npc.adjust/set/refresh/milestone/tick; npc/milestone capture; new checkpoint participant | Full native restoration participation, not only SB meter rollback. |

Existing RB registration: `src/v2/party/index.js:38`, `creation/index.js:54`,
`checks/index.js:116`, `items/index.js:53`, `combat/index.js:941`, `trade/index.js:107`,
`craft/domain.js:1`; market/repair/refine capture: `trade/index.js:365`. SD quest commands/payout: `src/v2/quests/index.js:1041`;
tracker settlement: `tracker/quest-lines.js:335`. All are assigned above; no second check,
quest, equipment or wallet authority remains enabled.

The capture list is exhaustive for mechanics in scope: RB retains wound/join/rest/leave/xp,
turns skill into a class-constrained offer, and relinquishes check to SD (RB
`src/v2/party/capture.js:224`). SB display-only choice/chatter remain presentation, never class
or path authority (SB `src/v2/extras.js:86`). NSD alone owns npc/milestone
(`src/npc-meters.js:1321`). SB pack/event/assist services add no story domains: packs queries,
events.fire/status and assist.precheck/status stay SB-owned (`src/v2/packs/index.js:94`,
`events/index.js:45`, `assist/index.js:97`). Lifecycle module.init/capture dispatch stays SB.
The appendix enumerates all retained command/query names; §3 enumerates new ones.

## 2. Dependencies and CI matrix

Reference pins, not claims that the rebuild exists:

| Repository | Branch | Exact reference commit | Package version (`package.json:3`) |
|---|---|---|---|
| SB | v2 | `47b280668474b9ef056a58453b304435f0624660` | `2.0.0-beta.1` |
| RB | v2 | `c24e93d7283a2dcc66e9963f140a1baa786916e3` | `2.0.0-beta.1` |
| SD | v2 | `8072d60fb23bd7f3de4f5dc0379b3f0135e35c07` | `2.0.0-beta.1` |
| NSD | v2 | `b906544cea3f1f3a678a1d21528968b3c0321606` | `1.2.20` |

The lead's release manifest replaces these pins with exact tested implementation commits,
schema hash and fixture hash. A floating branch is not a pin. Baseline CI does not validate new APIs.

| Combination | Expected | Repositories testing this integration row |
|---|---|---|
| SB | Works | SB |
| SB + SD | Works | SB, SD |
| SB + NSD | Works | SB, NSD |
| SB + SD + NSD | Works | SB, SD, NSD |
| SB + SD + RB | Works | SB, SD, RB |
| SB + SD + RB + NSD | Works | All four |
| SB + RB; SB + RB + NSD | RB blocked; other modules work | SB, RB; NSD for second row |

Each row boots real module definitions in `createHost` (SB `testkit/host.js:40`), registers once,
runs a scripted reply, executes an action and replays it. Positive subsets: SB six, SD four,
NSD three, RB two. Add missing-query, malformed-answer, feature-off, unset-clock, disabled-SD,
late-registration, duplicate-name, swipe, re-read and delete cases. Do not test only query stubs.

Put the shared runner/loaders under new SB `testkit/matrix/`; `scripts/matrix.mjs` in each repo
is a wrapper. Reuse `scripts/sync-testkit.mjs`: it copies `testkit`, runtime roots and imports,
not arbitrary scripts, and writes the SB commit to `VERSION` (SB `scripts/sync-testkit.mjs:17`,
`:63`, `:80`). Current vendor pins are older: RB `tests/vendor/story-block/VERSION:2` is
`8d97d3f…`; SD/NSD are `10c6c93…`. Refresh to the tested implementation pin. Also remove or
synchronize RB's separate `tests/v2/qa/vendor` copy before claiming complete coverage.

RB gates through `sdk.query`, `view.query` or `ctx.query`; never import SB's internal query
runner. Only `requires.storyBlock` is enforced today; other dependency keys are ignored with
warnings (SB `src/v2/registry.js:301`, `:405`). Do not claim `requires.storyDirector` works.

New `director.contract` returns `{api:2, enabled:boolean, clock:boolean, tiers:boolean,
threads:boolean, journal:boolean, checks:boolean}`. New `savepoint.contract` returns
`{api:2, snapshots:boolean, retainedChatRestore:boolean, participantsReady:boolean}`.
RB probes at activation, before generation and before each mutation. Missing/undefined/null,
wrong shape/API, disabled SD or missing required capability blocks RB with
`DEPENDENCY_UNAVAILABLE`. Registered but unset `director.time` is different: creation and
viewing work; timed mutations return `CLOCK_UNSET`. Unknown `atlas.here` is not missing SD.
All director.contract capability booleans must be true for active RB; journal means recap
data, not its presentation switch. All savepoint.contract booleans must be true.
Late registration retries on the next readiness/view/action cycle; no second registration or
state reset. Optional NSD/social and journal presentation may be off. When NSD is active,
its restore participant must be ready. Journal recap data remains available with its UI off.

## 3. Interface: existing and new

The [appendix](RB_PHASE0_APIS.md) replaces the old “kept `*`” shorthand. Every old draft name
is resolved here. Draft-only aliases are documentation mappings, not additional registrations.

| Draft name | Today | Rebuild name/contract |
|---|---|---|
| `director.time` | SD `tracker/domain.js:266` | Keep `{minutes:integer|null,text:string}`; derive day/minute locally. |
| `world.place` | Absent | Existing `atlas.place({id?,name?})` / `atlas.here()` (SD `atlas/queries.js:90`, `:98`); draft alias only. |
| `world.areaTier` | Absent | New SD query/data, typed below. |
| `threads.list` | Absent | Existing `director.threads({kind?,status?,offer?})` / `director.thread` (SD `tracker/domain.js:294`, `:298`); draft alias only. |
| `journal.day` | Absent | New SD adapter over `chronicle.day` (`chronicle/queries.js:265`), visible facts and saved scene. |
| `threads.close` | Absent | New SD command; close/journal linked thread without rewards. |
| `checks.roll` | Absent in SD | New command, not query; move non-combat check subsystem from RB. |
| `rules.sheet/modifier/party/quests/progress` | All absent | New RB projections below; retain `party.*` and `checks.modifiers` adapters. |
| `class.choose`, `path.choose`, `skill.train`, `summon.end`, `death.resolve` | Absent | New commands below. Class/path selection is player-only. |
| `stats.spend` | Absent | Keep `party.spend` (RB `party/commands.js:919`); draft alias only. |
| `quest.accept/turnIn` | Absent | Keep `quest.take/finish` and `quest.abandon`; transfer SD→RB (SD `quests/index.js:1044`). Draft accept/turnIn aliases only. |
| `companion.recruit/dismiss/control` | Absent | Keep `party.addCompanion/removeCompanion/edit` (RB `party/commands.js:916`); draft aliases only. |
| `party.recover` | RB `party/recovery.js:175` | Keep system/hook action, never a standalone UI button. |
| `purse.*` | Absent | Keep SB `inventory.wallet/currency/economy` and `wallet.pay/receive` (`inventory.js:1118`, `:1768`). |
| `purse.currency` | Absent | New RB-supplied query consumed by SB; no second wallet. |
| `savepoint.list/make/restore` | Absent as public bus APIs | New SB snapshot interface. Existing host `list/save/returnTo` opens branches (`rewind.js:178`). |
| `return.point/status/cue` | RB `return/index.js:115` | Keep names, replace v2 fight-start return semantics with §8. |
| `cards`, tab `active()` | Existing sockets | Keep registration; SB `registry.js:43`, details in appendix. |

Proposal (needs the user): **P01 — pack and definition transport.** Add registered
`content.rules` (§7); pin one resolved ruleset per character timeline. Link extra item rules
by SB `def.id` into RB's immutable definition table, not copied stack metadata. Replacing an
installed pack at the same version cannot change a running timeline.

New projection types (unknown actor/quest → null; empty collection → `[]`):

```ts
type Clock = {minutes:Minute|null; text:string}; // existing wire shape; never replaced
// world.areaTier({place:Id})
type AreaPolicy = {tier:Int<0,9>; allowedFoes:Ref[]; allowedTags:string[]; lore:Text240[]};
type AreaTier = {place:Id; tier:Int<0,9>|null;
  source:'place'|'region'|'world'|'unknown'; sourceId:Id|null;
  allowedFoes:Ref[]; allowedTags:string[]; lore:Text240[]};
// New SD atlas.danger:{world:AreaPolicy|null,regions:Record<Id,AreaPolicy>,places:Record<Id,AreaPolicy>}.
// Initial world:null/maps:{}; region keys are SD-assigned stable IDs, not display labels.
// First matching complete policy wins; unknown has null sourceId/tier and empty lists.
// At most 1000 foes, 32 tags (1..40 chars), 16 lore lines per policy.
// Consumed view of existing director.threads records, with an additive questLink.
// Preserve their other existing fields; this is not a replacement wire shape.
type ThreadProjection = {id:Id; key:Text120; kind:string; summary:Text600;
  fields:Record<string,string>; status:'active'|'resolved'; offer:boolean;
  taken:{rev:Count}|null; ended:{rev:Count; reason:string; outcome:string}|null;
  questLink:{quest:Id; instance:Int<1,1000000>}|null};
// journal.day({day:Day,snapshot?:Id}); at most 12 visible lines
type JournalDay = {day:Day; title:Text80; lines:Text240[];
  source:'digest'|'facts'|'snapshot'; missing:boolean};
// rules.modifier({actor:Id,stat:Stat}); no die, no relationship bonus
type RulesModifier = {actor:Id; stat:Stat; amount:Int<-30,30>;
  parts:{source:'stat'|'gear'|'condition'|'encumbrance'; ref:Id; amount:Int<-30,30>}[]};
type SkillView = {skill:Ref; form:Ref; name:Text80; mastery:Int<0,5>;
  uses:Int<0,35>; nextAt:Int<1,35>|null; steps:Int<0,2>};
type SheetView = {id:Id; name:Text80; kind:Actor['kind']; npcId:Id|null;
  level:Int<1,99>; xp:Count; xpToNext:Count|null; stats:Stats; unspent:Int<-1000000,1000000>;
  hp:PoolView; mp:PoolView; sp:PoolView; life:Actor['life']; conditions:Condition[];
  class:Ref; tier:0|1|2|3; skills:[SkillView,SkillView,SkillView];
  gear:Record<Slot,Id|null>; control:'player'|'auto'};
type PartyView = {pc:Id|null; active:SheetView[]; reserve:SheetView[];
  temporary:SheetView[]; activeLimit:3};
type ProgressView = {actor:Id; level:Int<1,99>; class:Ref; tier:0|1|2|3;
  checklist:{skill:Ref; form:Ref; mastery:Int<0,5>; needed:5}[];
  promotions:{milestone:10|20|30; eligible:boolean; choices:Ref[]; why:Text240[]}[];
  pathways:{milestone:40|50|60|70|80|90; eligible:boolean;
    skills:{skill:Ref; fromForm:Ref; step:1|2; options:[Ref,Ref,Ref]}[]; why:Text240[]}[]};
type QuestView = Quest & {ready:boolean; blocked:Text240[]; remainingMinutes:Count|null};
// rules.sheet({actor?:Id}) -> SheetView|null; default PC.
// rules.party({}) -> PartyView; rules.quests({state?:Quest['state']}) -> QuestView[].
// rules.progress({actor?:Id}) -> ProgressView|null.
```

New `threads.link` records accepted thread + quest link atomically with `quest.take`.
`threads.close` retains the link, sets resolved/ended and appends one outcome journal record.
Repeated identical closure succeeds without changes; conflicting outcome returns `CONFLICT`.

`journal.day` works independently of digest/journal UI switches. Filter hidden facts, then use
visible digest, visible facts, then saved visible scene. Missing day returns `missing:true`,
title `Day <day>`, saved-scene line or `[]`; no hidden-event recap. Current digest queries can
return null when disabled (SD `chronicle/queries.js:13`), so this adapter is new work.

Proposal (needs the user): **P09 — independent checks.** Move RB's `checks` domain, check
capture, `checks.prepare/log/view/toldBack/rolls/last/modifiers` to SD, preserving names. Add
command `checks.roll`. SD combines its policy, one optional `rules.modifier` and one optional
`npc.socialModifier({name,skill})`. The latter exists and returns
`{mod,name,skill,reasons:[{text,value}]}` or null (NSD `src/storysuite-v2.js:524`). SD alone
rolls. RB's modifier excludes relationships. Do not also gather the old outside-modifier path.
Absent RB/off NSD means no corresponding modifier, not failure of an independent SD check.

New/extended payloads. Optional fields have the stated default. Refuse unknown fields. Retain
shipped payload variants through adapters; see appendix. In particular, `party.spend` still
accepts its existing points map, and `party.edit` retains its existing non-progression fields.

```ts
type Commands = {
  'class.choose':{actor:Id; milestone:10|20|30; class:Ref; expectedClass:Ref|null; rulesHash:Hash};
  'path.choose':{actor:Id; milestone:40|50|60|70|80|90; skill:Ref; fromForm:Ref; option:Ref; rulesHash:Hash};
  'skill.train':{actor:Id; skill:Ref; form:Ref; trainer:Ref; session:Id};
  'party.spend':{actor:Id; stat:Stat; amount:Int<1,99>}; // new convenience variant
  'quest.take':{id:Id; thread:Id|null}; // thread omitted by old callers means RB offer
  'quest.abandon':{id:Id};
  'quest.finish':{id:Id; by?:'player'|'story'}; // default player; story only trusted capture
  'threads.link':{thread:Id; quest:Id; instance:Int<1,1000000>};
  'threads.close':{thread:Id; quest:Id; instance:Int<1,1000000>;
    outcome:'done'|'failed'|'expired'|'abandoned'; reason:Text240; settlement:Id};
  'party.addCompanion':{name:Text80; npc?:Id; class:Ref; offer:Id}; // v2 creation extension
  'party.removeCompanion':{actor:Id};
  'party.edit':{actor:Id; control:'player'|'auto'};
  'party.setActive':{actors:Id[]}; // new, 1..3 durable actors, includes PC, no active fight
  'party.summon':{owner:Id; class:Ref; fight:Id; expiresAt:Minute|null; expiresRound:Int<1,60>|null}; // new trusted rule only
  'summon.end':{actor:Id; reason:'expired'|'dismissed'|'downed'|'fight-ended'};
  'death.resolve':{event:Id}; // never caller-selected outcome or snapshot
  'checks.roll':{actor:Id; stat:Stat; skill:Text80|null; targetNpc:Id|null; dc:Int<5,40>; evidence:Id};
  'item.equip':{stack:Id; to?:Id; actor?:Id; targetSlot?:Slot}; // slot is the only new field
  'savepoint.make':{name?:Text80}; // default "Save point", player only
  'savepoint.restore':{snapshot:Id; deathEvent:Id; prepared:Id}; // authenticated host/RB only
};
```

`creation.finish` gains required player-selected `class:Ref`. It atomically creates the actor
and records the milestone-0 Choice with its three base skills. A standalone class.choose cannot
create an actor or choose the basic class on someone's behalf. Preserve existing creation fields.

`savepoint.list({}) -> Snapshot[]` returns eligible points in target order. `items.slots({actor?})`
adds `{slots:[{id:Slot,label:Text80,blockedBy:Id|null}]}` in the fixed eight-slot order, retaining
compatibility counts `{accessory:2,worn:4}`. `items.canWear` accepts new `targetSlot?:Slot` and
keeps `{ok,why?}`. Neither query writes equipment.

Training completion, use credit, expiry and daily saves are trusted hook steps, not UI buttons.
New capture payloads, with host-supplied Source: skill-use `{actor:Id,skill:Ref,form:Ref}`;
lethal `{actor:Id,cause:"narrative"|"execution",evidence:Id[]}`; intervention
`{event:Id,evidence:Id}`. Capture may propose evidence, never a death outcome, class/path choice
or numeric mastery. `atlas.edit` gains `danger?:AreaPolicy|null`; SD owns world/region policy
settings and stable place→region IDs. These are new fields, not present in today's atlas query.
`party.addCompanion` accepts the existing payload, but resolves its v2 class from the accepted
recruitment offer when omitted; old free-form skill grants cannot bypass the three-skill rule.
The lead removes SD quest registrations before RB registers their retained names.

Proposal (needs the user): **P14 — currency and money policy.** `purse.currency()` returns
`Currency|null`. SB validates and gives an enabled RB override precedence, then falls back to
its existing settings/pack/default resolver. Invalid RB data blocks RB money mutations while
SB fallback display remains usable. RB settings override pack currency in its resolved policy.
Keep one integer base-unit balance; never convert it when display changes. SB formats coins.
The RB query reads its frozen policy, never inventory.currency, avoiding resolver recursion.
New RB `rules.moneyPolicy({level}) -> {storyCreditCap:Count,storyDebitCap:Count}` supplies
RPG caps to SB's capture/tally code. Proposed caps both default to
`max(1,round(1000*level*inventory.economy().scale))`, preserving the current level fallback
(SB `inventory.js:1193`, `:1227`, `:1251`). Missing RB keeps SB-alone behavior. Explicit pack prices,
fees and rewards are already base units; do not scale twice.

Current SB pack projection/grant omit hands/requires/weight (`packs/content.js:12`,
`domains/inventory.js:450`). New RB `rules.item({def:Id}) -> ItemRule|null` resolves them by
pinned definition ID. A narrative-generated item gets a frozen `story/<slug>` definition and matching
RB rule in the same transaction. Existing crafted IDs stay craft/<slug> or craft/<order-suffix>
(RB craft/make.js:209, trade/index.js:164); register their rules atomically too.
Split/merge/buy/craft/return retain that ID. Unknown RPG gear
is unusable until validated; never infer requirements from its display name. No permissive
extra fields need to be smuggled into SB item records.

Receipt/error wire shapes retain the bus envelope (SB `src/v2/commands.js:467`, `:473`). The
`v2` data extension and §6 guards are new. Critical metadata must survive display-data trimming
(`store.js:13`). Defaults in `ResultData`: null references, credited 0, effects `[]`.

```ts
type ErrorCode = 'INVALID'|'REFUSED'|'NOT_FOUND'|'NOT_ENOUGH'|'CLAIMED'|'STALE'|
  'FEATURE_OFF'|'FAILED'|'UNKNOWN_COMMAND'|'DEPENDENCY_UNAVAILABLE'|'CLOCK_UNSET'|
  'RULES_MISMATCH'|'CONFLICT'|'SNAPSHOT_UNAVAILABLE'|'RESTORE_PENDING'|'REPLAY_PREREQUISITE';
type Failure = {ok:false; code:ErrorCode; message:string};
type ResultData = {actor:Id|null; quest:Id|null; milestone:Count|null; previous:Ref|null;
  selected:Ref|null; credited:Count; snapshot:Id|null; cue:Id|null; effects:Effect[]};
type Receipt = {id:Id; type:string; module:string; cause:'ui'|'story'|'system';
  seed:Int<0,4294967295>; summary:string; narrate:boolean; rev:Count;
  data:{v2?:{schema:2; key:string; epoch:Id; source:Source; rulesHash:Hash|null;
    guard:Guard; result:ResultData}}; replan?:{payload:object}};
type Success = {ok:true; receipt:Receipt};
```

Existing receipt data may coexist with `v2`; new mechanics require it. Retry returns the original
result without reapplying operations. Failure applies no partial payout, spend or claim.

## 4. State shapes

Closed JSON shapes. `Int<L,H>` is a safe integer in the inclusive range; `Count` is
`Int<0,9007199254740991>`. Detect arithmetic overflow. Defaults apply at creation/import,
not as guesses for old saves. Required fields without a stated default must be supplied.
All domain initializers return objects, including `{override:null}` currency policy
(SB `src/v2/registry.js:158`). Maps start empty and optional notes start `''` unless stated.

```ts
type Id = string; // 1..160 chars, /^[A-Za-z0-9][A-Za-z0-9._:/#-]*$/
type Ref = string; // 1..160 chars; pack.<pack-id>/<slug>, story/<slug>, craft/<slug>; §7
// Runtime IDs follow SB src/v2/check.js:9 DEF_ID. Authored pack refs use the narrower §7 schema.
type Hash = string; // 64 lowercase hex characters, SHA-256
type Text80 = string; type Text120 = string; type Text240 = string; type Text600 = string;
// Text aliases: plain Unicode text, 0..suffix code points, no controls or markup.
// Names/titles must be nonempty. IDs use their own syntax, not a text alias.
type Minute = Int<-9007199254740991,9007199254740991>; // absolute SD minutes, may be negative
type Day = Int<-6254999482460,6254999482459>; // floor(minutes / 1440), not day-of-month
type Stat = 'STR'|'VIT'|'AGI'|'DEX'|'INT'|'LUK'|'CHA';
type Stats = Record<Stat,Int<1,99>>;
type Slot = 'weapon'|'offhand'|'head'|'body'|'legs'|'feet'|'accessory-1'|'accessory-2';
type Rarity = 'common'|'uncommon'|'rare'|'epic'|'legendary';
type Currency = {name:string; plural:string; short:string;
  coins:{name:string; plural:string; value:Int<1,1000000>}[]; display:'mixed'|'base'};
// name/plural 1..24, short 1..6; 0..8 coins, unique case-folded names;
// a nonempty coin table includes value 1. Values are worth in base units, not ratios.
type RulesIdentity = {packId:string; packVersion:string; packHash:Hash;
  schema:2; engine:'rb-rules-2'; constantsHash:Hash};
type Source = {sid:Id; swipe:Int<0,1000000>; evidence:Id; ordinal:Int<0,1000000>};
type Pool = {max:Count; lost:Int<-9007199254740991,9007199254740991>};
type PoolView = {cur:Count; max:Count}; // clamp(max-lost,0,max)
type UseCredit = {actor:Id; skill:Ref; form:Ref; source:Source;
  kind:'combat'|'narrative'|'training'; minute:Minute; day:Day; amount:1; session:Id|null};
type SkillState = {skill:Ref; form:Ref; steps:Int<0,2>}; // credits live only in training.credits
type LevelStep = {level:Int<2,99>; cost:Count; points:Int<1,20>; hp:Count; mp:Count; sp:Count};
type ConditionKind = 'poison'|'burn'|'bleed'|'stun'|'slow'|'weaken'|'shield'|'regen'|'guard'|'injury'|'stat-shift';
type Condition = {id:Id; kind:ConditionKind; source:Id; actor:Id; potency:Int<1,1000>;
  data:{kind:'stat'; stat:Stat; amount:Int<-10,10>}|{kind:'shield'; remaining:Count}|
    {kind:'status'; applier:Id|null; attackAtApply:Count};
  timing:{unit:'round'; fight:Id; remaining:Int<0,60>}|
    {unit:'minute'; from:Minute; until:Minute}|{unit:'reply'; from:Id; remaining:Int<0,60>}};
type Choice = {id:Id; source:Source; rulesHash:Hash; actor:Id;
  milestone:0|10|20|30|40|50|60|70|80|90; kind:'class'|'path';
  before:Ref|null; selected:Ref; skill:Ref|null; guard:Guard};
type Actor = {id:Id; name:Text80; kind:'pc'|'companion'|'summon'|'pet'; npcId:Id|null;
  control:'player'|'auto'; life:'alive'|'downed'|'gravely-injured'|'dead';
  level:Int<1,99>; earned:Int<-9007199254740991,9007199254740991>;
  levelSteps:Record<string,LevelStep>; points:Int<-1000000,1000000>; stats:Stats;
  hp:Pool; mp:Pool; sp:Pool; conditions:Record<Id,Condition>; class:Ref;
  classPath:[Ref]|[Ref,Ref]|[Ref,Ref,Ref]|[Ref,Ref,Ref,Ref];
  skills:[SkillState,SkillState,SkillState];
  temporary:null|{owner:Id; fight:Id; expiresAt:Minute|null; expiresRound:Int<1,60>|null}};
type PartyDomain = {rulesVersion:2; pc:Id|null; order:Id[]; reserve:Id[]; temporary:Id[];
  actors:Record<Id,Actor>; rested:Minute|null};
// initial pc/rested:null; arrays:[]; actors:{}
type ProgressDomain = {rulesVersion:2; choices:Record<Id,Choice>};
type TrainingSession = {id:Id; actor:Id; skill:Ref; form:Ref; trainer:Ref; source:Source;
  start:Minute; end:Minute; cost:Count; state:'running'|'completed'|'interrupted';
  awarded:Id[]; event:null|{id:Id; template:Ref; issued:boolean}};
type TrainingRequest = {id:Id; actor:Id; skill:Ref; form:Ref; trainer:Ref; source:Source;
  status:'requested'|'started'|'rejected'; reason:Text240|null};
type TrainingDomain = {rulesVersion:2; requests:Record<Id,TrainingRequest>;
  credits:Record<Id,UseCredit>; sessions:Record<Id,TrainingSession>;
  replyUse:Record<Id,Record<Id,Count>>; dayUse:Record<string,Record<Id,Count>>};
// use tallies are derived caches of surviving UseCredits, never another authority.
type RulesDomain = {rulesVersion:2; identity:RulesIdentity|null; resolved:ResolvedRules|null;
  generated:Record<Ref,FormDef>; itemRules:Record<Ref,ItemRule>;
  contentClaims:Record<Id,{def:Ref; kind:'item'|'foe'; area:AreaTier; source:Source;
    origin:'pack'|'generated'; lore:'validated'|'held'; approvedBy:'code'|'player'|null; uniqueClaim:string|null}>;
  currency:{override:Currency|null}; constants:Constants};
// initial identity/resolved:null; generated/itemRules/contentClaims:{}; currency:{override:null}; constants:§5
```

Every created actor has exactly the current class's three skills. Only an uncreated party lacks
skills. `classPath` keeps class IDs, not old skills. Mastery and displayed uses are derived from
current-form credits, not separately writable. All sources write training.credits, including
older classes/forms,
so swapping skills cannot reset actor/day caps. Path forms retain their base skill ID. Sheet
gear is derived from SB equipment records. Temporary actors cannot use permanent progression.

Register party counters for `actors/*/id` first, then each pool's `lost` and `max`, `level`,
`earned`, `points`, `stats/*`, and `rested`. Pools start lost=0; damage/heal are deltas; full
recovery is an absolute set lost=0. Keep earned XP + level-step records and fit them after a
deleted award, including point debt, following RB `src/v2/party/pools.js:6`. Current HP/XP are
projections, not replacement scalars. Key credits/choices by ID, not array positions. Per-reply
caches are scratch, rebuilt from surviving evidence. Do not trim evidence still referenced by
a choice, snapshot or return. Raw counters may be signed after rebasing; effective views clamp.

```ts
type Requirement = {kind:'level'; min:Int<1,99>}|{kind:'stat'; stat:Stat; min:Int<1,99>}|
  {kind:'quest'; template:Ref}|{kind:'item'; def:Ref; qty:Int<1,999>}|
  {kind:'place'; place:Id}|{kind:'thread'; thread:Id};
type Objective = {id:Id; kind:'kill'; foe:Ref; count:Int<1,999>}|
  {id:Id; kind:'collect'; def:Ref; count:Int<1,999>; consume:boolean}|
  {id:Id; kind:'visit'; place:Id}|{id:Id; kind:'story'; text:Text240};
type Reward = {coin:Count; xp:Count; items:{def:Ref; qty:Int<1,999>}[]};
type Quest = {id:Id; template:Ref; instance:Int<1,1000000>; from:Id|null; title:Text80;
  category:'main'|'side'|'bounty'; giver:Id|null; turnInPlace:Id|null;
  requirements:Requirement[]; objectives:Objective[];
  evidence:Record<Id,{objective:Id; source:Source; amount:Int<0,999>}>; reward:Reward;
  acceptedAt:Minute|null; acceptedCursor:Cursor|null; deadline:Minute|null;
  repeat:null|{cooldownMinutes:Int<0,525600>; nextOfferAt:Minute|null};
  chain:null|{previous:Ref|null; next:Ref|null};
  state:'offered'|'active'|'done'|'failed'|'expired'|'abandoned';
  settlement:null|{id:Id; source:Source; outcome:'done'|'failed'|'expired'|'abandoned';
    coinPaid:Count; xpPaid:Count; itemsPaid:{def:Ref; qty:Int<1,999>}[]; claim:string}};
type QuestsDomain = {rulesVersion:2; entries:Record<Id,Quest>};
type Guard = {epoch:Id; rulesHash:Hash|null; inputHash:Hash|null; actor:Id|null; minLevel:Int<0,99>;
  previousClass:Ref|null; fromForm:Ref|null; unusedMilestone:Count|null;
  mastery:{skill:Ref; form:Ref; minimum:Int<0,5>}[];
  evidence:Id[]; claims:string[]; snapshot:Id|null; clock:{min:Minute; max:Minute}|null};
// Empty guard: current epoch, minLevel:0, lists:[], other fields:null.
type DeathEvent = {id:Id; source:Source; actor:Id; npcId:Id|null;
  cause:'wipe'|'narrative'|'execution'; lethalEvidence:Id[]; intervention:Id|null;
  check:null|{die:Int<1,20>; stat:Stat; modifier:Int<-30,30>; dc:Int<5,40>; total:Int<-29,50>};
  outcome:'pending'|'saved'|'gravely-injured'|'dead'; snapshot:Id|null;
  resolvedClaim:string|null; cue:Id|null};
type DeathDomain = {rulesVersion:2; events:Record<Id,DeathEvent>; pending:Id[];
  memory:'deja-vu'|'none'|'full'; lastReturn:ReturnRecord|null};
// initial events:{},pending:[],memory:'deja-vu',lastReturn:null
type Cursor = {sid:Id; swipe:Int<0,1000000>; span:Count; op:Count; rev:Count};
type Participant = {module:string; checkpoint:Id; hash:Hash; schema:Count};
type Snapshot = {id:Id; kind:'initial'|'manual'|'day-start'; name:Text80; epoch:Id;
  target:Cursor; eligibleFrom:Cursor; minute:Minute|null; day:Day|null;
  scene:{place:Id|null; text:Text240}; journal:JournalDay|null;
  payloadHash:Hash; participants:Participant[]; lineage:Hash; available:boolean};
type ReturnRecord = {id:Id; deathEvents:Id[]; snapshot:Id; target:Cursor; restoreAt:Cursor;
  oldEpoch:Id; newEpoch:Id; faded:{after:Cursor; through:Cursor};
  memory:'deja-vu'|'none'|'full'; cue:Id;
  status:'prepared'|'committed'|'participants-pending'|'complete'};
type SavepointsDomain = {schema:2; epoch:Id; points:Record<Id,Snapshot>;
  dayStarts:Record<string,Id>; previousDay:Id|null; returns:Record<Id,ReturnRecord>};
// initial new epoch, empty maps, previousDay:null; immutable payloads in SB snapshot store.
type Inputs = {clock:Clock; here:{id:Id; name:Text80}|null; area:AreaTier;
  inventory:{defs:Record<Ref,{id:Ref; kind:string}>;
    stacks:Record<Id,{id:Id; def:Ref; owner:Id; qty:Count; equipped:Slot|null}>;
    wallets:Record<Id,{coin?:Count}>};
  fight:{id:Id|null; status:'none'|'active'|'won'|'lost'|'fled'; round:Int<0,60>;
    durable:Id[]; temporary:Id[]; pools:Record<Id,PoolView>};
  threads:ThreadProjection[]; journal:JournalDay|null; participants:Participant[]};
```

`Inputs` is a read-only seam projection, not copied authority. SB supplies inventory/wallet;
SD supplies clock/place/tier; RB's fight adapter supplies battle facts from `combat.session`,
not narration. Never replace unset story time with real time. Existing creation, combat,
trade/craft, timed-effect and wear stores keep their pinned validators (appendix); adapters
must expose these exact inputs/views. Rules below use no unlisted implicit state. Cross-domain
validation checks actor/NPC references, disjoint rosters, milestone uniqueness, evidence lineage,
forms/class membership and pool bounds. Condition kind stat-shift requires stat data; shield
requires shield data; all other kinds require status data. Injury uses potency1 and the frozen
penalty. A dead actor has HP0; downed is HP0 without terminal death. All new RB domains start
with rulesVersion:2 and the stated empty maps/nulls; savepoints uses its separate schema:2. Definitions/constants follow §7/§5.

## 5. Rules

User decisions are collected in §11. Unsettled numerical defaults below are proposals.
The freeze records approved constants and their hash; track B cannot invent later formulas.

Proposal (needs the user): **P02 — progression numbers.** Basic class is chosen at creation's
level-0 milestone; play starts at level 1. Keep base stats 5, 10 player-spent creation points,
4 points per level, base-stat cap 99 and 100 XP per level. Current-form cumulative use thresholds
`[1,5,12,22,35]` give mastery 1–5. Each new class skill and pathway form starts at 0/5. At 5/5,
additional uses give no credit. This explicitly replaces old incremental mastery semantics
(RB `src/rules.js:55`); do not accidentally interpret that array as this cumulative schedule.

```ts
type Constants = {
  levelCap:99; startLevel:1; startStat:5; startPoints:10; pointsPerLevel:4; statCap:99;
  xpPerLevel:100; masteryAt:[1,5,12,22,35];
  usePerSkillReply:2; usePerSkillDay:10; usePerActorReply:6; usePerActorDay:30;
  trainMinutes:60; trainCredits:2; trainEventPercent:10;
  promotionMilestones:[10,20,30]; pathMilestones:[40,50,60,70,80,90];
  classBudget:[12,24,36,48]; pathBudgetIncrement:12;
  deathDc:15; injuryMinutes:1440; injuryCheckPenalty:-2; temporaryLimit:6;
  promptChars:Int<500,8000>; difficulty:'normal'; clockMinutesPerDay:1440;
}; // defaults are literals above; promptChars:2000
```

Retained pools/combat use RB `src/rules.js:316–387` and pinned `src/combat.js` (appendix).
With effective stats `s` and gear bonuses `g`, apply each gear stat once:

| Quantity | Frozen formula |
|---|---|
| Max HP | `max(1,round(30+8*s.VIT+4*level+g.HP))` |
| Max MP | `max(0,round(10+4*s.INT+2*level+g.MP))` |
| Max SP | `max(0,round(10+2*s.VIT+s.STR+.5*s.AGI+2*level+g.SP))` |
| Physical/magic attack | `round(2*s.STR+g.ATK)` / `round(2*s.INT+g.MATK)` |
| Physical/magic defence | `round(s.VIT+g.DEF)` / `round((s.INT+s.VIT)/2+g.MDEF)` |
| Stat check modifier | `clamp(floor((s[stat]-5)/2),-3,10)` |
| Hit % | `clamp(75+3*(attackDEX-targetAGI),5,95)`; preserve existing relative-hit adapter (`combat.js:85`) |
| Crit % / factor | `clamp(3+.5*s.DEX+s.LUK+g.crit,0,50)` / `1.5` |
| Mitigation | `raw==0 ? 0 : max(1,raw*raw/(raw+max(0,defence)))` |
| Variance / defend | Seeded `.9..1.1`; damage `×.5`; MP recovery `5%`, SP `15%` of max |
| Effective level | `min(99,1+floor(max(0,earned)/100))`, fitted with surviving level steps |

Retain target order, attack resolution/rounding, flee/parley, condition ticks, companion AI,
loot and encounter clamps through the pinned pure functions. No combat math rewrite is
implied. All dice/results are recorded; replay never rerolls. Level and XP advance while
promotion/path choices wait. At level 99 show remaining earned XP without granting level 100.

Proposal (needs the user): **P03 — use and training caps.** All three sources share caps:
per skill 2/reply and 10/story day, per actor 6/reply and 30/story day. Credit at most one use
per actual paid skill action/evidence ID, including a miss; none for invalid actions or mentions.
Day is `floor(minutes/1440)`; minute-of-day uses positive modulo. Reply is SID + selected swipe. Count per-skill caps across all that skill's forms,
so a pathway reset cannot bypass them. Project caps from surviving credits. New days use new buckets; do not clear old evidence.
Returning to an earlier day does not make a second bucket in the same epoch. An unset clock
refuses skill credit rather than inventing a day.

`skill.train` stores a TrainingRequest (no payment/time/credit on that UI receipt). The next
trusted beforeGenerate step starts it; only one training start per carrier and one running
session per actor. Trusted story/system execution checks trainer/place/form,
funds and clock, then calls `wallet.pay` and `director.advance` atomically. One session takes
60 minutes, costs the trainer's explicit fee, and offers up to two capped credits at completion.
No banked over-cap credit. A seeded 10% pick from a nonempty trainer event list can interrupt;
an empty list means no event. Record the pick, including none. Interrupted sessions give no
completion uses and no automatic refund. A session is running until a trusted completion step
settles it; its completion day supplies caps, including midnight. Re-read replans from surviving
SD time. Reject/roll back start if director.advance did not actually advance 60 minutes;
its per-cause claim must not cause a second fee without time. Current `director.advance` allows 1..1440 minutes and refuses UI calls
(SD `src/v2/time/advance.js:4`, `:55`); the requested session is not an immediate UI time jump.

Proposal (needs the user): **P04 — choice ordering and class content.** Offer only the oldest
unconsumed milestone. At 10/20/30 require level, all three current forms at 5/5 and a direct
child of the next tier. Swap three skills atomically; retain class IDs as history. High level
never skips a tier. For 40–90 require advanced class, earlier milestones consumed and selected
current form at 5/5. Choose any advanced skill with fewer than two steps. Each pick consumes
one milestone and resets that form to 0/5. Six picks therefore evolve all three skills twice.
Packs have 1..40 classes, up to six roots and 1..6 children per non-leaf; leaves must be tier 3.
There is no forced 40-class minimum. Optional one-to-one `replaces` links point to the parent's
skills for display/narration only. No inheritance. The Party card shows the three mastery checks,
level requirement, waiting milestone and reasons blocked. Class/path/stat picks remain player
choices, including on companion sheets; AI/manual changes battle control, not path authority.
Stat spends are positive, player-issued and irreversible; there is no respec command.

Proposal (needs the user): **P05 — area and generation.** SD danger tiers are 0..9. Resolve
place → region → world; unknown place/tier yields null and blocks new generated foes/items,
not an already running fight. SD owns tier fields/UI. Proposed foe level ceiling:
`min(99,10*(tier+1))`, also subject to the retained encounter clamp. Rarity ceiling: 0–1 common,
2–3 uncommon, 4–6 rare, 7–9 epic. Generated legendary is refused; pack-authored legendary is
allowed. Code validates area foe/tag allowlists, IDs and budgets. Generation receives visible
lore constraints; uncertain lore compatibility is held for review, not claimed as a static
proof. Named unique items get a unique definition/acquisition claim, no budget exemption.

Proposal (needs the user): **P06 — typed effects and power budget.** Use §7's closed effect
union. `targets(one/self/ally)=1`, `targets(all/allies)=3`. Damage/heal/shield score:
`ceil(power/10)`; condition score: `ceil(chance/25)*rounds`; stat effect score:
`2*abs(amount)*rounds`. Sum `score*targets`. Costs do not refund budget. Tier budgets:
12/24/36/48; each pathway step adds 12. Numeric power uses hundredths: 100 = ×1.0. Mastery
multiplies damage/heal/shield power by `1+.1*mastery`. Skill scaling is its declared stat;
replace the engine's stat input through the adapter, not a narrative number. `damage` feeds
retained mitigation/hit/crit/variance for its physical/magic type. `heal` restores
`round(2*effectiveStat*power/100*masteryFactor)` HP. `shield` adds that many shield points.
Clamp healing to max HP; shields absorb damage before HP and expire after one actor turn
if not consumed. Stat effects store stat-shift data. Conditions record attackAtApply as
round(2*effectiveStat*masteryFactor), potency100, and the applier ID, then roll recorded chance and
use retained condition behavior for the stated rounds. Stat effects add signed effective stats
for their rounds, without changing base points or qualifying gear; overlapping identical
source effects refresh, distinct sources add with effective stats floored at 1.

Physical forms require MP0 and use SP; other forms require SP0 and use MP; cooldown is in
actor turns. Costs are paid once before effects. Pack effects cannot award XP/money, change
classes, invoke commands or change pool maxima.
Written branches change target/type/element/condition/stat or add/remove an effect; a renamed
numeric copy is not a written branch. The straight power-up is deterministic: add 20 to the
first damage/heal/shield effect's power; if none, add 1 to the first stat effect's absolute
amount; otherwise add 1 round to the first condition. Preserve other fields/cost/scaling.
If that exact transform exceeds a bound or budget, the parent is invalid; no alternate fallback.
Validate closure of all reachable generated descendants on import. No content call occurs on
choice/replay. Runtime condition expiry is at `now >= until` or remaining rounds/replies 0.
Expired effects contribute nothing before the next action/check; story ticks follow SD minutes,
battle ticks follow the retained fight engine. Minute/reply conditions in this first format
are expiry-only injury/stat-shift records; no new out-of-combat damage tick rate is invented.
Legacy timed effects retain their own pinned timing policy. A clock change never uses real time.

Proposal (needs the user): **P07 — slots and weight.** Machine IDs: weapon/offhand/head/body/
legs/feet/accessory-1/accessory-2. “Main hand” labels weapon. 2H occupies weapon and blocks
offhand; SB stores one record, not two stacks. New `targetSlot` selects an allowed slot. Omitted
slot picks the first legal empty allowed slot, otherwise first allowed slot with an explicit
swap receipt. Equipping 2H clears offhand atomically; offhand beside 2H is refused. One-handed
weapons may allow both hands. Dual wield counts both validated pieces' bonuses with retained
combat math; no extra free action. Requirements use base stats, so gear cannot qualify itself.
No class locks. SB's inventory.equip/equipOn/capture routes must delegate to these same RB
checks before writing; a direct storage command cannot bypass legality. Without RB, no new
equipment UI is shown (log 731).

Weight = rule weight × quantity, worn included. Member capacity:
`floor((20+4*baseSTR)*carrySize/100)` + validated carry bonuses, as today
(RB `src/v2/items/carry.js:7`). Only active durable members contribute party capacity; not
reserves/temporary units. Removing capacity never deletes items; mark encumbered. New items
that cannot fit stay with source; transfers check receiver. Apply existing encumbrance penalty
through `rules.modifier` once. Narrative slot/weight/requirement claims do not override rules.

Proposal (needs the user): **P08 — quest transitions.** Category/deadline/repeat/chain are
independent fields. `quest.take` is player-only and requires a visible SD thread or RB offer,
requirements met, no active instance and cooldown elapsed. For a new SD offer, the same
transaction records explicit player acceptance in threads.link before upgrading it; an already
accepted thread can be upgraded directly. Background narration cannot auto-accept a thread. Link one thread to one instance; repeat instances
have distinct IDs. `now >= deadline` expires before progress/turn-in at that boundary. Unset
clock blocks timed acceptance/settlement. All objectives are required. Kills use post-acceptance
combat event IDs; collect uses SB stacks; visit uses SD place evidence; story goals require
validated lines. Turn-in rechecks giver/place/requirements. Consume required items and pay typed
reward once in one transaction. If reward items cannot fit, leave ready with no partial reward.
Story coin already credited for that reward reduces the remaining payout; preserve owed-credit
queries until extraction is complete. No second payout/XP hook. Abandon/fail/expire give no
success reward. Close/journal the SD thread with the outcome in the same settlement. Cooldown
starts at terminal minute; next chain quest is offered only after done, never auto-accepted.
Even zero-cooldown repeats require a new offer and acceptance, preventing a button reward loop.

Crafting remains open to anyone with recipe/material/station, scaled by declared stats. Keep
current crafting and commission maths. Narrative sinks use validated debit lines and SB wallet
commands. Each level-up, promotion and pathway step emits one narration receipt. Companion AI
runs in code. These are retained user decisions, not proposed optional features.

Proposal (needs the user): **P10 — death check numbers.** Validated intervention saves the
actor. Otherwise record `d20 + rules.modifier(actor,VIT)` against DC15: success = gravely
injured, failure = dead. Narration cannot select outcome. Battle execution of an already downed
companion needs an explicit validated lethal event and the same check; HP0 alone is never death.
After a surviving fight, a downed companion returns to 1HP with injury: 1440 SD minutes,
−2 STR/AGI checks. Gravely injured also starts at 1HP with that injury. Settle simultaneous
events as one batch in actor-ID order; a PC death makes one return for the batch. Unknown target
or intervention evidence holds the event rather than silently killing an NPC.

Proposal (needs the user): **P11 — temporary units.** Separate roster, at most six summons/pets,
with owner, fight, optional minute expiry and optional round expiry. Fight ending always
dismisses them; downing also dismisses. They do not occupy PC + 2, add carry capacity or prevent
wipe. Wipe means all active durable members including PC are downed/dead; reserves do not
rescue it. New party.setActive is player-only outside combat, includes PC and at most two
companions; excess recruits enter reserve. New party.summon is trusted-only and materializes
the class's three skills without permanent XP or milestone claims. A downed PC can remain while
an active companion acts. Companion death is permanent
on the timeline; only the decided PC return restores earlier saved life state.

Proposal (needs the user): **P15 — first-release settings.** Ship normal difficulty first;
easy/hard needs separate approval without changing kept combat math. Situation-dependent RB
prompt cap: 500..8000 characters, default 2000. Essential rule/return facts, then active fight/
quest/progression, then flavor; truncate whole optional lines only. Default memory déjà vu,
no-memory setting, full memory only when pack-enabled. Snapshot effective settings as rule inputs.

## 6. Replay recording

SB replays operations, not handlers; UI actions belong to the reply they follow
(SB `src/v2/store.js:3`). A deterministic command does not automatically recheck prerequisites
after a deletion. Re-read replaces story ops and replans marked system receipts
(SB `turn.js:684`, `commands.js:363`). Swipes use their own records.

Proposal (needs the user): **P12 — prerequisite-aware replay.** Add retained Guard metadata
to each transaction span. Before applying a span, SB calls a pure owner `hooks.replayGuard`
against the prefix state. This host use is new work, not an existing hook guarantee. It never
runs the handler, generates content or rolls. Check rules hash/epoch, inputHash, actor/class/form,
fitted level/mastery, unused milestone, evidence/claims and snapshot ancestry. inputHash covers
the relevant prefix inputs and referenced evidence payloads, not IDs alone;
a changed intervention or edited evidence cannot pass with a reused ID. If false, skip the entire
transaction including money/claims and show `REPLAY_PREREQUISITE`; independent spans can still
apply. Keep invalid UI choices stored but inactive until player chooses on a valid head. Never
select another class, branch, reward or save. Keep touched-domain validators mandatory
(`store.js:254`); they do not replace prefix guards.

Keys are epoch-scoped: `rb:<epoch>:<operation>:<stable key>`. Source evidence is a stable
line/action ID within SID/swipe, not display text alone. Persist UI action ID before dispatch so
retries reuse it. The host supplies Source/authority, never a caller's self-asserted payload.
Public UI cannot send internal/system commands (SB `registry.js:26`).

| Operation | Issuer | Record and idempotency key | Swipe / re-read / delete |
|---|---|---|---|
| `class.choose` | Player UI only, no module caller | Actor, milestone, previous/selected class, rules identity, three new 0/5 skills, guard, cue. `class:<actor>:<milestone>` | Own swipe's choice; re-read retains only with valid guard; lost prerequisite deactivates whole choice. |
| `path.choose` | Player UI only | Milestone, skill, from/selected form, full frozen generated result/hash, reset, guard/cue. `path:<actor>:<milestone>` | Never regenerate; lost step-1 parent invalidates step 2. |
| Stat spend / recruit / control | Player; validated offer for recruit | Allocation/offer/control, previous state, guard. Persisted action ID | Retry no-op; lost actor/offer/point prerequisite invalidates dependent span. |
| Combat use / XP / pools | RB combat handler | Fight/action ordinal, skill/form, cost, use credit, pool deltas, earned XP/level steps, dice. `fight:<fight>:<action>:<actor>:<skill>`; one end-settlement key | Apply saved deltas once; fit XP/pools; dependent spans guard against lost actor/class/form. |
| Narrative use / sink / lethal evidence | Trusted story capture | SID/swipe/evidence/minute/day, validated form/debit, actual capped credit, guard. `<kind>:<sid>:<swipe>:<evidence>` | Re-read replaces capture set; swipe/delete removes its own credits/debits/evidence; refit caps. |
| Training start | Player request, trusted story/system execution | Session, trainer/place/form, cost, start/end, advance result, event seed/pick. `training:<session>` | Wallet/time atomic; no second charge; deleted start invalidates completion/events. |
| Training completion / condition / summon expiry | RB afterCapture system | Session/form, evaluated clock/day, actual credit IDs, event/removal result. `<kind>:<entity>:<boundary SID>` | `replan:true`; recompute from surviving clock; no double event/use; removed boundary removes/replans expiry. |
| Quest progress / finish / expiry | Validated capture, player finish, RB settlement | Objective proof, consumption, reward, credited story coin, SD closure, claim. `quest:<instance>:settled` | Expiry replans; payout/closure/claim skip together when prerequisites vanish; no stale expired state. |
| Manual save | Player through SB | Exact cursor, immutable payload/participant hashes, scene/journal, eligibility. `save:<action ID>` | Carrier-bound; invalid ancestry removes eligibility; cached payload/branch file is not authority. |
| Day-start / previous-day save | SB clock-boundary system | Day, exact start cursor, trigger SID, payload hash, previous-day target, journal link. `day:<epoch>:<day>:<trigger SID>` | `replan:true`; replace/remove selection on re-read/swipe/delete. Cached bytes do not preserve eligibility. |
| `death.resolve` / restore | RB check, SB coordinator | Batch/evidence/intervention/die/outcome, exact snapshot, prepared participants, absolute restore, epoch/fade/cue. `death:<event>`, `return:<batch>` | Exact saved result if guard holds; removed fatal evidence deactivates return/cue. No fresh target selection on replay. |
| `return.cue` | SB-authorized RB completion | Return ID, saved scene, memory, cue. `wake:<return ID>` | One cue; told/untold follows selected swipe; no duplicate wake on re-read. |

Clock-sensitive system receipts use `replan:true`. SB also needs a new reconciliation pass
that replans their dependent suffix when a middle deletion changes the clock; ordinary replay
does not do this today. Use the exact surviving reply prefix and replace system spans atomically.
It cannot choose new UI answers. Preserve guards/idempotency/prerequisite references beyond
receipt display trimming. For death re-read, identical inputHash reuses the recorded die/result/target. Changed input
replans resolution with the original die for that event, current modifiers/intervention, and
a new result guard; it does not roll again. The old restore span/cue becomes inactive before
settling a replacement. Snapshot lineage hashes include prefix operations and evidence payloads,
not merely carrier IDs, so a re-read cannot validate a stale snapshot by keeping its SID.
Snapshot restoration sets absolute values; never rebase it as damage,
XP, wallet or clock deltas.

## 7. Pack schema v2

### Envelope and registered kinds

Keep SB's envelope. Only top-level `id/version/name/author/description/requires/currency/economy/
calendar/weather/content/start/layouts/screens/theme` are accepted (SB `packs/limits.js:33`,
`validate.js:69`). No top-level kind/schema/classes/branches/foes object. Pack `requires` accepts
only storyBlock/capabilities (`validate.js:158`), not new module keys.

Today's registered kinds: items/creatures/shops/recipes/events/quests/races/talents/skills/
presets/places/routes/terms/ranks/crafts/meterPresets/markets (`limits.js:27`). Unknown kinds
are refused (`validate.js:90`). Item/skill fields are closed (`validate.js:226`, `:718`).
Creature/quest open records (`:95`, `:102`, `:220`) must not be abused as a hidden manifest channel.

Under **P01**, lead adds `rules` to CONTENT_KINDS/OPTIONAL_KINDS, checker, lookup/count/
classification support and capability `rb-rules-v2`. It is **not registered today**. Old SB must
reject it with UNKNOWN_KIND, and known missing capability also yields MISSING_CAPABILITY.
This is an explicit host prerequisite, while keeping the existing envelope and other kinds.

```json
{
  "id":"standard-rules", "version":"2.0.0", "name":"Standard rules",
  "requires":{"storyBlock":"^2","capabilities":["story-director","rpg-battle","rb-rules-v2"]},
  "content":{
    "rules":[{"slug":"rules","name":"Standard rules","schema":2,"statLabels":{},
      "memory":"deja-vu","classes":[],"skills":[],"branches":[],"itemRules":[],"trainers":[]}],
    "items":[],"creatures":[],"quests":[],"shops":[],"recipes":[]
  }
}
```

This is an envelope skeleton, not a playable valid fixture: empty classes/skills must fail.
Exactly one rules manifest per rules pack. Existing `content.skills` remains its strict old
template format; v2 skills live inside content.rules[0].skills. Foes use content.creatures;
quest templates use content.quests. Items/shops/recipes keep their existing kinds and IDs.

### Typed definitions

Closed records; all numeric bounds and list limits are validation rules. Optional notes default
`''`, statLabels `{}`, memory déjà vu, replaces null, unique false, recipe known true. Other
fields are required. Arrays capped below or by SB's 1000-entry bound, whichever is smaller.

```ts
type Target = 'one'|'all'|'self'|'ally'|'allies';
type Element = 'none'|'fire'|'ice'|'lightning'|'poison'|'holy';
type Effect = {op:'damage'|'heal'|'shield'; target:Target; power:Int<1,1000>; element:Element}|
  {op:'condition'; target:Target; kind:Exclude<ConditionKind,'injury'|'stat-shift'|'shield'>; chance:Int<1,100>; rounds:Int<1,6>}|
  {op:'stat'; target:Target; stat:Stat; amount:Int<-10,10>; rounds:Int<1,6>}; // amount != 0
// Damage: one/all. Heal/shield: self/ally/allies. Stat amount>0: self/ally/allies, <0: one/all.
// Harmful conditions poison/burn/bleed/stun/slow/weaken: one/all; regen/guard: self/ally/allies. Shield uses the numeric shield effect only.
type FormPayload = {type:'physical'|'magic'|'heal'|'buff'|'debuff'; stat:Stat;
  cost:{mp:Int<0,999>; sp:Int<0,999>; cooldown:Int<0,10>}; effects:Effect[]}; // 1..4 effects
type FormDef = FormPayload & {id:Ref; skill:Ref; name:Text80; note:Text240;
  step:0|1|2; fromForm:Ref|null; origin:'base'|'written'|'generated'};
type SkillDef = {id:Ref; name:Text80; note?:Text240; replaces?:Ref|null; base:FormPayload};
type ClassDef = {id:Ref; name:Text80; tier:0|1|2|3; parent:Ref|null;
  skills:[Ref,Ref,Ref]; note?:Text240};
type Transform = {op:'set-target'; at:Int<0,3>; value:Target}|
  {op:'set-element'; at:Int<0,3>; value:Element}|{op:'set-power'; at:Int<0,3>; value:Int<1,1000>}|
  {op:'replace-effect'; at:Int<0,3>; value:Effect}|{op:'add-effect'; value:Effect}|
  {op:'remove-effect'; at:Int<0,3>}|{op:'set-cost'; value:FormPayload['cost']}|
  {op:'set-stat'; value:Stat};
type BranchDef = {id:Ref; skill:Ref; fromForm:Ref; step:1|2; choice:'a'|'b';
  name:Text80; note?:Text240; transforms:Transform[]}; // 1..8 ordered transforms
type ItemRule = {def:Ref; allowedSlots:Slot[]; hands:0|1|2; requires:Partial<Stats>;
  weight:Int<0,10000>; unique?:boolean};
// non-equipment slots:[],hands:0; equipment 1..2 allowed slots;
// hand items hands:1/2, other gear hands:0; 2H slots exactly ['weapon']; no class locks.
type Trainer = {id:Ref; name:Text80; place:Id; skills:Ref[]; fee:Int<1,1000000>;
  minutes:60; eventTemplates:Ref[]}; // 1..30 skills; 0..8 event refs
type FoeDef = {slug:string; name:Text80; tier:Int<0,9>; level:Int<1,99>; stats:Stats;
  skills:Ref[]; loot:{def:Ref; chance:Int<0,100>; qty:Int<1,99>}[]; loreTags:string[]};
// 1..3 skills; 0..8 loot; 0..8 tags (1..40 chars each).
type QuestTemplate = {slug:string; name:Text80; category:'main'|'side'|'bounty';
  giver:Id|null; turnInPlace:Id|null; requirements:Requirement[]; objectives:Objective[];
  reward:Reward; durationMinutes:Int<1,525600>|null;
  repeat:null|{cooldownMinutes:Int<0,525600>}; chain:null|{previous:Ref|null; next:Ref|null}};
// requirements 0..16; objectives 1..8; reward items 0..8.
type ShopDef = {slug:string; name:Text80; place:Id; kind:string;
  stock:{item:Ref; qty:Int<1,999>; price:Count}[]}; // 1..100 rows; kind slug 1..40
type RecipeDef = {slug:string; name:Text80; craft:string; makes:Ref; qty:Int<1,99>;
  materials:{item:Ref; qty:Int<1,99>}[]; fee:Count; minutes:Int<0,1440>; dc:Int<5,40>;
  stat:string; station?:string; known?:boolean; teaches?:Text120};
// 1..8 materials; stat is 1..3 distinct Stat keys joined by '+'; station/craft use slugs.
// Omit station/teaches in raw input when absent; a present teaches must be nonempty (SB validator).
type RulesManifest = {slug:'rules'; name:Text80; schema:2;
  statLabels?:Partial<Record<Stat,Text80>>; memory?:'deja-vu'|'none'|'full';
  classes:ClassDef[]; skills:SkillDef[]; branches:BranchDef[]; itemRules:ItemRule[]; trainers:Trainer[]};
type ResolvedRules = {manifest:RulesManifest; forms:Record<Ref,FormDef>; items:Record<Ref,ItemRule>;
  foes:Record<Ref,FoeDef>; quests:Record<Ref,QuestTemplate>; shops:Record<Ref,ShopDef>;
  recipes:Record<Ref,RecipeDef>; constants:Constants};
```

Every content.items ID needs one matching rule. Missing requirement keys mean no requirement;
weight is mandatory. Existing envelope currency normalizes to §4 Currency, coins default `[]`,
plural through SB's formatter, display mixed. Existing item stats/effects still pass SB validation;
the new rule transports hands/weight/requirements, not duplicated item stats. Generated content
uses the same types/budgets and frozen story/craft runtime namespaces. Raw pack refs cannot name runtime story/craft IDs; runtime validation binds them against the
frozen rule table using SB DEF_ID syntax. Internal graph refs must resolve within
one rules pack; no cross-pack rules mixing in this format. Place/NPC refs are explicitly external
SD/NSD IDs, resolved at activation; unresolved required refs block eligibility. Lore truth and
current equipment eligibility remain runtime checks.

### Branch graph, normalization and validator contract

Decided graph (log 800): each advanced skill base has three step-1 children g/a/b. **Each chosen
form** has its own g/a/b step-2 children. Per skill: 2+6 = 8 written and 1+3 = 4 generated;
per advanced class: **24 written + 12 generated**. Only one path is taken; no third step.
Earlier tiers have no pathway nodes.

Base form ID: `pack.<id>/skill-x-base`; step 1 appends `-g/-a/-b`; step 2 appends another
`-g/-a/-b` to that selected parent. Written BranchDef.id must equal that expansion for its
choice. `fromForm` names exact parent, including generated parents. Reserve suffixes and refuse
collisions. Base skill slug maximum 52 leaves room within SB's 64-character slug limit.
Written branches clone parent then apply ordered typed transforms; generated uses P06 exactly.

Check roots parent=null/tier0; all other parents exactly tier−1; no cycles/orphans; three distinct
skills per class; one owning class per base skill. All leaves advanced. Advanced skills have
exactly two written branches for base and for each first-step form. No earlier-tier branches.
Resolve every internal ref and validate every generated descendant/transform index/type/budget.
New class total base score must exceed parent total; each supplied replaces link must also
increase its predecessor's base score. This checks “already stronger” without retaining old skills.

Normalize nested local slugs into `pack.<id>/<slug>`, following SB `validate.js:185`. Canonical
raw export uses local slugs for internal refs; resolved runtime uses full IDs. Preserve authored
class/skill/branch display order and effect/transform order; sort object keys for hash/export.
Text: NFC, trim outer whitespace, normalize line endings, reject controls/markup. Refuse unsafe
keys, unknown fields, duplicates, nonfinite/fractional integers and unresolved refs. Export UTF-8,
two-space indent, final newline; no timestamps/random IDs/self-hash. Export authored bases and
transforms, not duplicate expanded forms. Hash normalized authored data + schema + constants;
retain resolved result immutably in timeline storage. Repeated import/export yields identical
bytes/IDs/forms/hash. Budget/closure uses the same pure functions in import, runtime and Studio.

SB limits stay: 512 KiB/pack, 2 MiB installed, depth16, 200 keys/object, 1000 entries/array,
4000 chars/string (`packs/limits.js:5`). Expanded limits: 1000 forms, 1000 branches, 1000 item
rules, 100 trainers, 2 MiB resolved ruleset. Reject oversized graphs, never truncate. Source form
origin/provenance determines generated-legendary prohibition; a runtime flag cannot relabel it.

### Machine-readable schema

The JSON schema below is normative, extractable data for the manifest and its owned content.
It supplements SB's envelope validator, not replaces it. Structural checks run first; shared
semantic checks then enforce references, graph counts, budgets, Unicode bounds and slot/target
compatibility. Schema defaults are annotations; normalization must actually apply them.
The root is a raw `content.rules[0]` manifest. The new checker runs before SB record wrapping;
normalization keeps host-added id/pack metadata outside the closed manifest. Runtime lookup
unpacks only those known wrapper fields, never silently drops arbitrary unknown input fields. `$defs` also covers owned creature/quest/shop/
recipe lists so the same checker can bind those existing content kinds. No external `$ref` is
needed. Track D packages this data as new `src/v2/packs/rules-v2.schema.json` and exports it
from new `rules-v2.js`; this notes-only revision does not create runtime files.

```json
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "$id":"urn:story-suite:rb-rules-v2:manifest",
  "type":"object",
  "additionalProperties":false,
  "required":["slug","name","schema","classes","skills","branches","itemRules","trainers"],
  "properties":{"slug":{"const":"rules"},"name":{"$ref":"#/$defs/name"},"schema":{"const":2},"statLabels":{"type":"object","additionalProperties":false,"required":[],"properties":{"STR":{"$ref":"#/$defs/name"},"VIT":{"$ref":"#/$defs/name"},"AGI":{"$ref":"#/$defs/name"},"DEX":{"$ref":"#/$defs/name"},"INT":{"$ref":"#/$defs/name"},"LUK":{"$ref":"#/$defs/name"},"CHA":{"$ref":"#/$defs/name"}},"default":{}},"memory":{"enum":["deja-vu","none","full"],"default":"deja-vu"},"classes":{"type":"array","minItems":1,"maxItems":40,"items":{"$ref":"#/$defs/class"}},"skills":{"type":"array","minItems":3,"maxItems":120,"items":{"$ref":"#/$defs/skill"}},"branches":{"type":"array","minItems":0,"maxItems":1000,"items":{"$ref":"#/$defs/branch"}},"itemRules":{"type":"array","minItems":0,"maxItems":1000,"items":{"$ref":"#/$defs/itemRule"}},"trainers":{"type":"array","minItems":0,"maxItems":100,"items":{"$ref":"#/$defs/trainer"}}},
  "$defs":{
    "id":{"type":"string","minLength":1,"maxLength":160,"pattern":"^[A-Za-z0-9][A-Za-z0-9._:/#-]*$"},
    "ref":{"type":"string","minLength":1,"maxLength":110,"pattern":"^(?:pack\\.[a-z0-9]+(?:-[a-z0-9]+)*/)?[a-z0-9]+(?:-[a-z0-9]+)*$"},
    "slug":{"type":"string","minLength":1,"maxLength":64,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
    "name":{"type":"string","minLength":1,"maxLength":80},
    "note":{"type":"string","minLength":0,"maxLength":240,"default":""},
    "stat":{"enum":["STR","VIT","AGI","DEX","INT","LUK","CHA"]},
    "target":{"enum":["one","all","self","ally","allies"]},
    "element":{"enum":["none","fire","ice","lightning","poison","holy"]},
    "slot":{"enum":["weapon","offhand","head","body","legs","feet","accessory-1","accessory-2"]},
    "stats":{"type":"object","additionalProperties":false,"required":["STR","VIT","AGI","DEX","INT","LUK","CHA"],"properties":{"STR":{"type":"integer","minimum":1,"maximum":99},"VIT":{"type":"integer","minimum":1,"maximum":99},"AGI":{"type":"integer","minimum":1,"maximum":99},"DEX":{"type":"integer","minimum":1,"maximum":99},"INT":{"type":"integer","minimum":1,"maximum":99},"LUK":{"type":"integer","minimum":1,"maximum":99},"CHA":{"type":"integer","minimum":1,"maximum":99}}},
    "requires":{"type":"object","additionalProperties":false,"required":[],"properties":{"STR":{"type":"integer","minimum":1,"maximum":99},"VIT":{"type":"integer","minimum":1,"maximum":99},"AGI":{"type":"integer","minimum":1,"maximum":99},"DEX":{"type":"integer","minimum":1,"maximum":99},"INT":{"type":"integer","minimum":1,"maximum":99},"LUK":{"type":"integer","minimum":1,"maximum":99},"CHA":{"type":"integer","minimum":1,"maximum":99}}},
    "cost":{"type":"object","additionalProperties":false,"required":["mp","sp","cooldown"],"properties":{"mp":{"type":"integer","minimum":0,"maximum":999},"sp":{"type":"integer","minimum":0,"maximum":999},"cooldown":{"type":"integer","minimum":0,"maximum":10}}},
    "effect":{"oneOf":[{"type":"object","additionalProperties":false,"required":["op","target","power","element"],"properties":{"op":{"enum":["damage","heal","shield"]},"target":{"$ref":"#/$defs/target"},"power":{"type":"integer","minimum":1,"maximum":1000},"element":{"$ref":"#/$defs/element"}}},{"type":"object","additionalProperties":false,"required":["op","target","kind","chance","rounds"],"properties":{"op":{"const":"condition"},"target":{"$ref":"#/$defs/target"},"kind":{"enum":["poison","burn","bleed","stun","slow","weaken","regen","guard"]},"chance":{"type":"integer","minimum":1,"maximum":100},"rounds":{"type":"integer","minimum":1,"maximum":6}}},{"type":"object","additionalProperties":false,"required":["op","target","stat","amount","rounds"],"properties":{"op":{"const":"stat"},"target":{"$ref":"#/$defs/target"},"stat":{"$ref":"#/$defs/stat"},"amount":{"type":"integer","minimum":-10,"maximum":10,"not":{"const":0}},"rounds":{"type":"integer","minimum":1,"maximum":6}}}]},
    "base":{"type":"object","additionalProperties":false,"required":["type","stat","cost","effects"],"properties":{"type":{"enum":["physical","magic","heal","buff","debuff"]},"stat":{"$ref":"#/$defs/stat"},"cost":{"$ref":"#/$defs/cost"},"effects":{"type":"array","minItems":1,"maxItems":4,"items":{"$ref":"#/$defs/effect"}}}},
    "class":{"type":"object","additionalProperties":false,"required":["id","name","tier","parent","skills"],"properties":{"id":{"$ref":"#/$defs/ref"},"name":{"$ref":"#/$defs/name"},"tier":{"type":"integer","minimum":0,"maximum":3},"parent":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]},"skills":{"type":"array","minItems":3,"maxItems":3,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"note":{"$ref":"#/$defs/note"}}},
    "skill":{"type":"object","additionalProperties":false,"required":["id","name","base"],"properties":{"id":{"$ref":"#/$defs/ref"},"name":{"$ref":"#/$defs/name"},"note":{"$ref":"#/$defs/note"},"replaces":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}],"default":null},"base":{"$ref":"#/$defs/base"}}},
    "transform":{"oneOf":[{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-target"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/target"}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-element"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/element"}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-power"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"type":"integer","minimum":1,"maximum":1000}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"replace-effect"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/effect"}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"add-effect"},"value":{"$ref":"#/$defs/effect"}}},{"type":"object","additionalProperties":false,"required":["op","at"],"properties":{"op":{"const":"remove-effect"},"at":{"type":"integer","minimum":0,"maximum":3}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"set-cost"},"value":{"$ref":"#/$defs/cost"}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"set-stat"},"value":{"$ref":"#/$defs/stat"}}}]},
    "branch":{"type":"object","additionalProperties":false,"required":["id","skill","fromForm","step","choice","name","transforms"],"properties":{"id":{"$ref":"#/$defs/ref"},"skill":{"$ref":"#/$defs/ref"},"fromForm":{"$ref":"#/$defs/ref"},"step":{"enum":[1,2]},"choice":{"enum":["a","b"]},"name":{"$ref":"#/$defs/name"},"note":{"$ref":"#/$defs/note"},"transforms":{"type":"array","minItems":1,"maxItems":8,"items":{"$ref":"#/$defs/transform"}}}},
    "itemRule":{"type":"object","additionalProperties":false,"required":["def","allowedSlots","hands","requires","weight"],"properties":{"def":{"$ref":"#/$defs/ref"},"allowedSlots":{"type":"array","minItems":0,"maxItems":2,"items":{"$ref":"#/$defs/slot"},"uniqueItems":true},"hands":{"enum":[0,1,2]},"requires":{"$ref":"#/$defs/requires"},"weight":{"type":"integer","minimum":0,"maximum":10000},"unique":{"type":"boolean","default":false}}},
    "trainer":{"type":"object","additionalProperties":false,"required":["id","name","place","skills","fee","minutes","eventTemplates"],"properties":{"id":{"$ref":"#/$defs/ref"},"name":{"$ref":"#/$defs/name"},"place":{"$ref":"#/$defs/id"},"skills":{"type":"array","minItems":1,"maxItems":30,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"fee":{"type":"integer","minimum":1,"maximum":1000000},"minutes":{"const":60},"eventTemplates":{"type":"array","minItems":0,"maxItems":8,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true}}},
    "requirement":{"oneOf":[{"type":"object","additionalProperties":false,"required":["kind","min"],"properties":{"kind":{"const":"level"},"min":{"type":"integer","minimum":1,"maximum":99}}},{"type":"object","additionalProperties":false,"required":["kind","stat","min"],"properties":{"kind":{"const":"stat"},"stat":{"$ref":"#/$defs/stat"},"min":{"type":"integer","minimum":1,"maximum":99}}},{"type":"object","additionalProperties":false,"required":["kind","template"],"properties":{"kind":{"const":"quest"},"template":{"$ref":"#/$defs/ref"}}},{"type":"object","additionalProperties":false,"required":["kind","def","qty"],"properties":{"kind":{"const":"item"},"def":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999}}},{"type":"object","additionalProperties":false,"required":["kind","place"],"properties":{"kind":{"const":"place"},"place":{"$ref":"#/$defs/id"}}},{"type":"object","additionalProperties":false,"required":["kind","thread"],"properties":{"kind":{"const":"thread"},"thread":{"$ref":"#/$defs/id"}}}]},
    "objective":{"oneOf":[{"type":"object","additionalProperties":false,"required":["id","kind","foe","count"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"kill"},"foe":{"$ref":"#/$defs/ref"},"count":{"type":"integer","minimum":1,"maximum":999}}},{"type":"object","additionalProperties":false,"required":["id","kind","def","count","consume"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"collect"},"def":{"$ref":"#/$defs/ref"},"count":{"type":"integer","minimum":1,"maximum":999},"consume":{"type":"boolean"}}},{"type":"object","additionalProperties":false,"required":["id","kind","place"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"visit"},"place":{"$ref":"#/$defs/id"}}},{"type":"object","additionalProperties":false,"required":["id","kind","text"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"story"},"text":{"type":"string","minLength":1,"maxLength":240}}}]},
    "reward":{"type":"object","additionalProperties":false,"required":["coin","xp","items"],"properties":{"coin":{"type":"integer","minimum":0,"maximum":9007199254740991},"xp":{"type":"integer","minimum":0,"maximum":9007199254740991},"items":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["def","qty"],"properties":{"def":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999}}}}}},
    "quest":{"type":"object","additionalProperties":false,"required":["slug","name","category","giver","turnInPlace","requirements","objectives","reward","durationMinutes","repeat","chain"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"category":{"enum":["main","side","bounty"]},"giver":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/id"}]},"turnInPlace":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/id"}]},"requirements":{"type":"array","minItems":0,"maxItems":16,"items":{"$ref":"#/$defs/requirement"}},"objectives":{"type":"array","minItems":1,"maxItems":8,"items":{"$ref":"#/$defs/objective"}},"reward":{"$ref":"#/$defs/reward"},"durationMinutes":{"oneOf":[{"type":"null"},{"type":"integer","minimum":1,"maximum":525600}]},"repeat":{"oneOf":[{"type":"null"},{"type":"object","additionalProperties":false,"required":["cooldownMinutes"],"properties":{"cooldownMinutes":{"type":"integer","minimum":0,"maximum":525600}}}]},"chain":{"oneOf":[{"type":"null"},{"type":"object","additionalProperties":false,"required":["previous","next"],"properties":{"previous":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]},"next":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]}}}]}}},
    "foe":{"type":"object","additionalProperties":false,"required":["slug","name","tier","level","stats","skills","loot","loreTags"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"tier":{"type":"integer","minimum":0,"maximum":9},"level":{"type":"integer","minimum":1,"maximum":99},"stats":{"$ref":"#/$defs/stats"},"skills":{"type":"array","minItems":1,"maxItems":3,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"loot":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["def","chance","qty"],"properties":{"def":{"$ref":"#/$defs/ref"},"chance":{"type":"integer","minimum":0,"maximum":100},"qty":{"type":"integer","minimum":1,"maximum":99}}}},"loreTags":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"string","minLength":1,"maxLength":40},"uniqueItems":true}}},
    "shop":{"type":"object","additionalProperties":false,"required":["slug","name","place","kind","stock"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"place":{"$ref":"#/$defs/id"},"kind":{"$ref":"#/$defs/slug","maxLength":40},"stock":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","additionalProperties":false,"required":["item","qty","price"],"properties":{"item":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999},"price":{"type":"integer","minimum":0,"maximum":9007199254740991}}}}}},
    "recipe":{"type":"object","additionalProperties":false,"required":["slug","name","craft","makes","qty","materials","fee","minutes","dc","stat"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"craft":{"$ref":"#/$defs/slug"},"makes":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":99},"materials":{"type":"array","minItems":1,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["item","qty"],"properties":{"item":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":99}}}},"fee":{"type":"integer","minimum":0,"maximum":9007199254740991},"minutes":{"type":"integer","minimum":0,"maximum":1440},"dc":{"type":"integer","minimum":5,"maximum":40},"stat":{"type":"string","pattern":"^(STR|VIT|AGI|DEX|INT|LUK|CHA)(\\+(STR|VIT|AGI|DEX|INT|LUK|CHA)){0,2}$"},"station":{"$ref":"#/$defs/slug"},"known":{"type":"boolean","default":true},"teaches":{"type":"string","minLength":1,"maxLength":120}}}
  }
}
```

| Entry point | Required result; all new except validatePack |
|---|---|
| `rulesV2Schema` | Frozen schema data, identical to the packaged schema artifact. |
| `normalizeRulesV2(raw,{packId,constants})` | Normalized authored manifest or structured errors; no mutation. |
| `expandRulesV2(manifest,content,constants)` | Resolved references/forms/hash or errors. |
| `validateRulesV2(manifest,content,constants)` | `{ok:true,resolved,warnings}` or `{ok:false,errors:[{code,path,message}]}`. |
| `powerScore(form)`, `generatePowerUp(form)` | Shared pure P06 functions used by validator/runtime/Studio. |
| Existing `validatePack(input,options)` | Envelope/safety plus registered v2 checker; existing signature SB `packs/validate.js:40`. |
| `exportRulesV2(document)` | Canonical raw envelope text accepted by the same import path. |

## 8. Death and return

The user decided restored state, retained chat, faded interval and waking scene. Current SB
save points are branch bookmarks (`src/v2/rewind.js:178`); RB `returnInTime` branches to fatal
fight start (`src/v2/return/index.js:76`). Neither implements this return. Keep bookmarks as
bookmarks; do not silently relabel their stored data as v2 snapshots.

Proposal (needs the user): **P13 — snapshot and restoration edges.** Implement the following
new SB capability, with NSD participation whenever installed:

1. Keep an initial checkpoint at the first usable rules/clock state. Retain each story day's
   **start** snapshot. At start of D+1, eligible automatic target becomes start of D, tied to
   D's visible journal. Taking a snapshot at detection of D+1 is not start of D. On crossing
   midnight within a reply, capture the exact clock-boundary cursor before later reply effects.
   SB needs boundary retention; afterCapture alone cannot reconstruct discarded starts.
   A multi-day jump creates intermediate anchors from the last proven pre-gap state, with
   distinct day labels and no invented events. Unset clock creates no automatic save.
2. Keep current/previous day anchors and the eligible previous-day point. Manual points remain
   until explicitly forgotten; proposed limit 20, then ask the player to forget one. Initial
   checkpoint is fallback until a manual/previous-day save exists. Retain payload/participant
   checkpoints while any live point or replay dependency references them. Payload caches alone
   do not make an invalidated save eligible. No silent eviction of a referenced checkpoint.
3. Select the eligible manual or previous-day target with greatest **target cursor**, not
   creation/wall time. Compare surviving carrier order, span, op, rev; manual wins exact tie.
   Target must precede lethal batch and belong to active ancestry. Missing payload/participant
   returns `SNAPSHOT_UNAVAILABLE`; hold return, never silently substitute an older point.
4. RB records lethal batch/result once. An asynchronous SB coordinator prepares a manifest for
   exact chat/head revision, snapshot and participant hashes. Each owner validates its slice.
   NSD prepares full native checkpoint, not just SB meters. Stale head cancels preparation.
   No async chat-file/branch operations inside synchronous command handlers.
5. SB commits one authenticated **absolute restore span** covering all participating story
   domains: pools, inventory/wallet, quests, SD clock/threads/journal, RB choices/training and
   story claims. This is a new host primitive, not permission for RB to draft foreign domains.
   Verify manifest/hashes; bypass delta rebasing only for this operation. Meta revision/receipt
   IDs stay monotonic. Do not restore receipt history, snapshot archive, UI settings or restore
   audit journal. Restore effective rules/settings. Restored class/path choices still consume their milestones;
   their historical guards are audit data, not rerun during snapshot installation. Start a fresh epoch and keep resolved death/
   return journal outside restored story claims. Rewards can be earned in the new timeline
   because old balances/items/progress were undone with their claims.
6. NSD switches prepared native checkpoint idempotently by return ID. Block generation,
   extraction and mutable reads until all participant hashes match committed SB state.
   Persist prepared/committed recovery journal; resume after crash/reload. Success means
   `complete`, never a living RB companion beside a dead NSD dossier. Swipe/delete of return
   also switches NSD to the selected timeline checkpoint before unblocking. This is new NSD
   work: today's adapter leaves native storage/history independently owned
   (NSD `src/storysuite-v2.js:3`, `:346`).
7. Keep chat messages and mark exact `(target,restore]` interval faded. Exclude it from future
   active prompt history, extraction, journal facts and NPC scanning. Every history consumer
   must use SB's new active-history projection; changing RB's prompt alone is insufficient.
   One waking cue contains saved scene and allowed memory: vague déjà vu, none, or pack-enabled
   full recall. Full recall grants no restored loot/XP/evidence from faded events. Raw faded
   messages remain readable. Suppress/retract their derived facts and out-of-band extraction.

`return.point` gains a v2 point `{snapshot:Id,target:Cursor,place:string,fight:Id|null,
index:Count,beforeRev:Count}` or null. `return.status` keeps dead/point and adds pending,
memory and lastReturn. `return.cue {return:Id}` is authorized only after complete restoration.
Legacy `{fight,place}` adapter is limited to old bookmark returns; it cannot create v2 restore
or duplicate a wake. Narrative PC death uses the same route as wipe. Companion death is
permanent until a PC return restores earlier state; no companion resurrection button.

## 9. Migration

Fresh start is decided (log 749). Detect host version and RB rules version separately **before
module registration/initialization or mutation**, using a new SB read-only preflight probe.
Host v2 is not proof of rules v2. Registration otherwise adds missing slices but never replaces
old party data (SB `src/v2/registry.js:558`). No old character conversion is authorized.

| Input | Behavior |
|---|---|
| No RB character in a valid new/empty timeline | Initialize fresh rules-v2 domains, choose basic class. |
| Supported old host/rules save | Keep compatible old reader/runtime where available; offer read/export and new character in a new timeline. Do not mutate old save. |
| Host v2 with old party and no rulesVersion:2 | Legacy, not empty. No implicit reset or v2 initialization of party. |
| Partial/mixed v2 markers, future schema, bad hash | Refuse mutation with mismatch notice; preserve original. |
| Pack missing/changed | Use retained resolved definitions only if hash matches; otherwise RULES_MISMATCH, never newest pack substitution. |

Content/command adapters, not character migration: `mainhand/main-hand -> weapon`,
`off-hand -> offhand`, `armour/armor -> body`, accessory-1/2 unchanged. Generic worn/hands/
waist/bare accessory is ambiguous: require an explicit v2 slot during authoring/import.
Never guess. Keep old runtime compatibility isolated; never register two owners for the same
names/domains in one host. Rules schema 2 is distinct from SB's state/envelope version.

## 10. Deliverables per track

This revision supplies a reviewable contract and embedded schema. Runtime files, validators,
tests and fixtures below remain implementation deliverables. Freeze only after the user's
answers and fresh review; no track may invent a missing rule to unblock itself.

| Folder/file | Owner during implementation | Integration rule |
|---|---|---|
| SD quests and quest-only tracker code; new RB `src/v2/quests/`; SB inventory slot adapters; NSD preset files | A | Extraction map below; lead applies shared registration/settings edits. |
| RB new `src/v2/rules/`, `progress/`, `training/`, `death/`; party/combat/items adapters; SB replay/snapshot internals; SD checks/tiers; NSD restore participant | B | Name one owner per subfolder; SB/SD/NSD changes are reviewed with their owners. |
| RB `src/v2/screens/`, `board/`, creation/progression UI components | C | Query projections/commands only; no rule duplication. Coordinate creation engine files with B. |
| SB new `src/v2/packs/rules-v2.js`, schema artifact, `tests/v2/studio/` | D, schema/checker portion | Shared registration stays lead-owned. |
| Separate `Story_studio` repository: engine/export/undo/fixtures/docs | D | Later split (log 798) wins over earlier all-in-SB plan. Pin implementation commit at integration. |
| Module definitions/entry points, registration, settings/features, shared testkit/matrix, manifests, release notes | Lead | Tracks deliver patches; lead alone integrates shared files. |

RB/SD `src/v2/module.js`, SB registry/domain aggregator/pack kind tables, feature/setting maps
and NSD `src/storysuite-v2.js` stay lead-owned even when a track needs a small edit. Lead records
subfolder assignments before starting. No folder has two writers.

### A: extraction map

| Existing source | Destination/seam | Retire or redirect |
|---|---|---|
| SD `src/v2/quests/index.js:1041`, parse/progress/ranks | RB `src/v2/quests/`; retain quest.take/abandon/finish/payOwed and progress/details/ranks/owed queries | Remove SD registration and afterCapture payOwedHook (`index.js:1064`); transfer director.retriable and quest.board adapters to RB. One reward transaction. |
| SD `tracker/quest-lines.js:127`, `:335` | RB quest met/turn-in/settlement adapter | Remove SD quest.settle registration and beforeGenerate/afterCapture payout paths. Keep generic thread capture/journal. |
| SD `tracker/capture.js:269`, `tracker/index.js:20` quest branch | RB owns quest capture; SD owns accepted generic thread/link/close | Remove RPG reward/ready/target parsing in SD. Thread is not another quest ledger. |
| RB `combat/quest.js`, `party/commands.js:654`; SD reward calls `quests/index.js:418` | RB objective events + one party.grantXp/SB wallet settlement | Retire double fight/quest XP and coin hooks; preserve story-credit/owed deduplication. |
| SB `inventory.js:1227`, `:1768`, money.js | Stay SB; add rules.moneyPolicy/purse.currency delegation | **No money move** after log 796. Keep SB-alone budgeting fallback. |
| RB `items/commands.js:285`, `queries.js:185`, rules.js:38; SB inventory.js:1039 | RB eight-slot legality; SB equipped record and definition-ID seam | Replace six-slot limits consistently in rules, packs, prompt and UI; retain stack/to, add targetSlot. |
| NSD `src/npc-meters-presets.js:139`, `src/storysuite-v2.js:368`; SB meterPresets checker | NSD remains runtime preset owner; packs retain meterPresets kind | No preset engine to invent in RB. Move only any identified old RPG preset glue; do not displace existing NSD catalog. |

A supplies pure seams: `planQuest(Quest,Inputs) -> {ready:boolean,blocked:Text240[],reward:Reward}`;
`planEquip(ItemRule,Inputs,actor,stack,slot) -> {ok:true,unequip:Id[],equip:{stack:Id,slot:Slot}}|Failure`.
These new functions perform no writes/narration. Explicit fixtures cover aliases and retired
payout hooks. For SD standalone, generic accepted goals/threads remain usable without RPG quests.

### B: rules and return core

Deliver §4 validators, §5 constants/formulas/transitions/effect interpreter, pure eligibility
`canPromote/canStep/creditUse/planTraining/resolveLethal`, §6 guards/counters/scratch, and §8
SB/NSD restore protocol. Pure functions take typed state + Inputs and return plan/Failure;
no hidden clock/pack access. First slice: 5/5 cap, promotion, class swap and deleted-prerequisite
replay. Include immutable generated forms and active-history filtering. Retained combat fixture
outcomes must match pins through new adapters. No “formula later in B” gap remains.

### C: query/payload fixtures

Build against §3 views/payloads with SB widgets/tokens. Keep lean slot tiles, tap to arm then
unequip, collapsible companions (log 734–742). Party checklist and exactly three skills are
visible. Fixtures assert query outputs and command payloads, not screenshots alone.

| Fixture | Assertion |
|---|---|
| C01 fresh | Basic picker; created level1 PC, exactly three 0/5 skills. |
| C02 promotion | Level10 5/5,5/5,4/5 blocks; last credit enables child; atomic three-skill swap. |
| C03 max mastery | All 5/5; further uses zero; XP still advances. |
| C04 waiting | Level90 basic class: only promotion10, then ordered promotions, then six waiting paths without auto-picks. |
| C05 selected parent | Written step1; its own a/b/g step2; missing parent invalidates choice. |
| C06 training midnight | Day4 minute1410 → day5 minute30; day5 cap; re-read removes jump/completion/event. |
| C07 expiry | Deadline7200: 7199 active, 7200 expired before turn-in; repeat/chain displayed. |
| C08 roster | PC+2 active, 2 reserves, 2 temporary; temporary outside limit/carry/wipe rescue. |
| C09 hands | 2H clears offhand; offhand beside 2H refused; explicit dual-wield target; no self-qualifying gear. |
| C10 fight | Offer/manual active turn/finish, retained projections and stale board refusal. |
| C11 death | Pending/intervention/permanent companion death/wipe batch/missing snapshot. |
| C12 complete return | Faded interval, both RB/NSD companion alive, one wake, no retained duplicate reward. |
| C13 dependencies | Missing/late SD, unset clock, unknown tier, optional journal/social off; distinct UI states. |
| C14 replay | Swipe/re-read/middle deletion invalidates dependent choices/rewards/saves without substitutes. |

### D: schema and Studio engine

Deliver §7 schema/checker/normalization/export shared with SB import and RB activation. Valid
fixtures: small complete tree with 24/12 graph, each effect variant, generated-parent step2,
seven renamed stat labels, 2H/dual-slot items, trainer events and typed quest/shop/recipe.
Round-trip twice with identical bytes/hash. Invalid fixtures: unknown top-level field, old SB
unknown kind/capability, duplicate/generated ID collision, tier/cycle/orphan, missing reference,
12-versus-24 written graph, non-three skills, numerical/transform/budget closure failure,
markup/unsafe key, generated legendary, oversized graph/file. Include fixtures for defaults
and foreign place/NPC refs that pass structure but block runtime eligibility.

Later log 798 puts schema/checker in SB and engine/export/undo/docs in Story_studio. Part 1:
schema data, validator, document state, stable export, edits with undo, unstyled development
page/smoke, fixtures, docs. Styled UI waits for approved mocks; then SB widgets/tokens
(log 777, 797–798). Engine fixtures do not approve styled UI. Dependent work waits for freeze.

### End-to-end fixture: thread → quest → reward → daily save → death → restoration

Use D-valid-small-tree, fixed hashes/IDs and proposed constants. Run with and without NSD;
NSD variant includes its real native checkpoint participant over synthetic data.

| Cursor/input | Expected state/record |
|---|---|
| s10: day10 start, minute14400, haven, PC level1, coin100, companion ac_friend/npc_friend alive | Retain day10-start before actions: both alive, coin100, no quest/reward claim. |
| s11: accepted visible th_job, RB offer q_job-1 | quest.take links instance1; visit mill objective, reward coin30/XP25, no deadline. Coin100. |
| s12: visit mill, return to giver in haven | One quest.finish: coin130, earned25, done/settlement claim, SD thread resolved/journal outcome. Retry unchanged. |
| s13: day11 start, minute15840 | Eligible automatic target is **day10-start**, not s13. Attach day10 visible journal; retain day11 start anchor. |
| s14: explicit companion lethal event, die2/mod0/DC15 | Companion dead in RB/NSD, native checkpoint includes death; day10-start remains unchanged. |
| s15: PC/all active durable down, summons standing | One wipe PC-death batch; summons do not rescue. No later manual save: select day10-start. |
| s15: authenticated restore | Absolute time14400/haven/coin100/XP0; quest absent/unaccepted, thread as at s10, companion alive in both stores; old reward/claim gone. Revision increases; new epoch/return journal remain. |
| s16: waking passage | One cue, vague déjà vu; (s10 target,s15] faded and absent from active extraction/prompt history, raw chat still readable. |

Variants: manual after s12 outranks day10-start and retains coin130/done on return; removing
its carrier removes eligibility. Re-read/swipe s13 recomputes automatic target. Delete s12:
payout/closure disappear together. Swipe away from s15 switches matching NSD checkpoint before
scanning. Crash/retry between SB and NSD commit completes once. Never combine old loot/XP
with restored wallet. These checks cover claims, not only visible status.

All tracks need lead-owned registration/settings, exact integration pins, error/receipt fixtures
and this scenario passing. Merge order remains phase0 → A → B → C wiring → integration/matrix
→ user test (log 782). D's schema gates content/import/UI fixtures; balancing follows the
approved formulas, not a divergent validator.

## 11. Decided: the user's answers

| Retained decision | Log lines, later correction where relevant |
|---|---|
| SB hub/inventory; SD genre-neutral world/clock/threads/checks; RB RPG rules; NSD relationships; item defs RB/pack, stacks SB | 748, 752–756, 773 |
| Save points stay SB | 752 replaces initial move in 748 |
| Purse stays SB and works without RB; RB prices/rewards/sinks and optional currency override | 796 replaces 795(1) and money move in 778 |
| Fresh start; fixed structure, generated content validated for lore/area; standard pack Studio baseline | 749–750, 755 |
| Cap99; classes at 0/10/20/30; always exactly three skills; class change swaps all three for stronger new ones, nothing inherited | 758, 800 replaces inherited/active split in 748 |
| Promotion needs level and three 5/5; combat/narrative/training uses, paid SD time/events, reply/day caps, XP continues, Party checklist | 759; new skills 0/5 is implication recorded at 800; detailed thresholds/form resets P02 |
| 40–90: one step each ten levels, three advanced skills twice, current form5/5, 1 generated+2 written, step2 from selected step1 | 758–759, confirmed800: 24 written+12 generated per advanced class |
| Keep seven keys STR/VIT/AGI/DEX/INT/LUK/CHA; pack labels only | 795(4) supersedes six-stat wording |
| Player stat spending, no respec; eight slots after beta; 2H/dual wield; stat requirements, no class locks; weight | 742, 748, 764, 771 |
| Full companion sheets, code AI/manual toggle, PC+2 active, relationship NSD | 748, 756, 773 |
| Pets/summons temporary combat units; summons outside PC+2 | 762, 795(3) |
| Optional SD factions/reputation, area rarity through epic, pack-only legendary, unique named items, validated sinks | 761, 765–766 |
| All quest types, SD-clock expiry; crafting for everyone scaled by stats | 767, 769 |
| Narrated level-ups/promotions/steps, situation-dependent adjustable prompt cap, difficulty if cheap | 768, 770, 772 |
| Battle HP0 downed; wipe PC death; companion recovery with injury; code decides permanent companion death | 763, 774, confirmed800 |
| Narrative lethal check: dead or gravely injured unless intervention | 774 |
| PC death restores saved state/companions; retained chat/faded marker/waking scene | 774–775 |
| Manual + previous narrative day's start automatic save, tied to journal; latest target wins | 795(2) replaces danger-point saves775 |
| Default déjà vu; setting none; full memory pack option | 776 |
| Upgraded thread stays SD journal, closed with quest outcome | 795(5) |
| Separate tracks/folders; lead shared integration; later Studio repo split and hold for freeze | 777–782, 797–802 |

Proposals do not override these decisions. Their unanswered numbers/edge policies remain
visible, and may be changed without reopening an accepted rule.

## 12. For the user

All proposals needing the user, repeated here. Recommendations are the concrete baselines
above; none is already accepted.

| ID | Yes/no or pick-one question | Recommendation |
|---|---|---|
| P01 | Approve the §7 schema/normalization limits, one self-contained content.rules manifest, immutable timeline definitions and item-rule lookup by SB definition ID? | Yes; explicit host capability/checker first. |
| P02 | Approve level1 after basic pick, 5/10/4/99/100 stat/XP defaults, cumulative mastery [1,5,12,22,35], and 0/5 on new forms? | Yes. |
| P03 | Approve shared 2/10 skill and 6/30 actor reply/day caps, 60-minute/two-use training and recorded 10% interruption/no-refund policy? | Yes. |
| P04 | Approve oldest milestone first, free eligible advanced-skill choice, 1..40 classes/up to six children, optional display-only replaces? | Yes; no auto-picks/inheritance. |
| P05 | Approve tiers0..9, place→region→world fallback, unknown-tier hold, foe ceiling and rarity table? | Yes. |
| P06 | Approve typed-effect maths, 12/24/36/48 budgets, +12/step and deterministic power-up transform? | Yes; validate generated closure. |
| P07 | Approve machine slot IDs, targetSlot/swap, dual-wield bonuses and active-member carry policy? | Yes; one SB record per piece. |
| P08 | Approve expiry at now>=due before settlement, atomic reward/closure, overweight hold and repeat/chain policy? | Yes. |
| P09 | Approve moving non-combat checks to SD, combining optional RB/NSD modifiers exactly once? | Yes; retain shipped names. |
| P10 | Approve DC15 VIT lethal check, 1HP/24-hour/−2 injury and simultaneous-event batching? | Yes. |
| P11 | Approve roster commands, excess recruits in reserve, six temporary units, fight-end dismissal, and reserves/temporary units excluded from wipe rescue? | Yes. |
| P12 | Approve prefix guards deactivating invalid spans and clock-dependent settlement replanning after edits/deletes? | Yes; no automatic replacement choices. |
| P13 | Approve initial fallback, skipped-day anchors, 20 manual saves, exact target order, full SB/NSD restore and faded-history filtering? | Yes; hold on missing checkpoint. |
| P14 | Approve RB currency precedence through SB formatting and level-based credit/debit caps without balance conversion? | Yes. |
| P15 | First release normal-only or include easy/hard now? Approve prompt cap500..8000/default2000 alongside it? | Normal-only and stated cap. |
