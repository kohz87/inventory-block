# RB rebuild, phase 0: contract draft v3

Status: revision for the user; not frozen or implemented. Sources: [V2_LOG.md](V2_LOG.md),
lines 747–809. Later USER entries win. `P01`–`P22` are proposals, not decisions.
All choices beyond §11, including the typed interfaces, algorithms and fixtures, are
**Proposal (needs the user):** the recommendations indexed in §12. They are implementation
targets, not accepted decisions or claims about shipped capabilities. The confirmed
three-skill swap and 24 written + 12 generated pathway graph are decisions, not proposals.

The [API appendix](RB_PHASE0_APIS.md) lists retained names, payloads, projections and file:line.
Code paths start at `/tmp/p0v3`; SB, RB, SD and NSD mean the four repositories. Citations refer
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
| `director`, `atlas`, `chronicle`, `arc`, `checks` | SD | `director.*`, `atlas.*`, `chronicle.*`, new `threads.link/questWrite/close`, `checks.roll`; time/agenda/event/hook/clock/beat/secret/route/landmark/world/faction/check | Move checks from RB; keep the single director.threads store, including the RB-computed rpg extension; remove SD RPG calculation/capture/payout. |
| `rules`, `party`, `progress`, `training`, `death` | RB | Creation/party/progression/quest/death commands in §3; retained party capture, wound/join/skill/rest/leave/xp, new skill-use/lethal/intervention, transferred quest | New rules state; no implicit reset of old `party`. |
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
(`src/npc-meters.js:1321`). SB retains pack/event/assist, dice and module-init/capture dispatch as hub services.
The appendix records the retained interfaces used here; §3 enumerates additions and migrations.

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

Proposal (needs the user): **P22 — dependency lifecycle.** Track E adds
`requires.peers:{'story-director':range}` to RB, checking registered module IDs/versions,
including prereleases. Keep requires.storyBlock; do not pretend requires.storyDirector works.
Missing/disabled/incompatible peers reserve names but leave RB dormant. Cycles refuse activation.

New synchronous `sdk.preflight({module:'rpg-battle',rulesVersion:2})` is read-only, available
before registration: `{hostApi:2,hostVersion:string,storeVersion:number|null,
classification:'empty'|'current'|'legacy'|'mixed'|'future'|'damaged',domains:string[],
rulesVersion:number|null,rulesHash:Hash|null,peers:[{module,version:string|null,enabled:boolean}],
restore:'idle'|'pending'|'failed'}`. Unreadable data means damaged, never empty. No initialization,
receipt or save write. If sdk.preflight/host lifecycle support is absent, RB bootstrap refuses
before registering its mechanics definition; it must not invoke old ensureModules and then
try to undo initialization. Track E interposes the same classification before today's
sdk.registerModule invokes ensureModules (SB src/v2/sdk.js:300).

New SD `director.contract({}) -> {api:2,enabled,clock,tiers,threads,journal,checks}` and SB
`savepoint.contract({}) -> {api:2,snapshots,retainedChatRestore,participantsReady}` have boolean
capabilities; all must be true for ready RB. Journal means recap data independent of its UI.
Probe through public sdk.query/view.query/ctx.query at activation, before generation/mutation.
Thrown missing-query, null/undefined, malformed/version mismatch or false capability yields RB
DEPENDENCY_UNAVAILABLE. Unset director.time.minutes permits creation/views; timed actions yield
CLOCK_UNSET. Unknown atlas.here/tier blocks dependent content, not activation.

| State | Required behavior |
|---|---|
| preflight | Preserve legacy/mixed/future/damaged stores; §9. |
| dormant | Register/reserve once; no RB domain init, capture, prompts, AI, rule hooks or generation veto. Views show reason; actions refuse. Other modules continue. |
| ready | Initialize missing slices once on fresh/current stores; enable RB dispatch. Retry late/reenabled peer on next view/action/generation cycle, never register twice/reset. |
| ready→dormant | Preserve state; suppress RB hooks/capture when peer disappears/disables. |
| restore-pending | Host-wide barrier blocks generation/capture/scanning/mutable reads until every participant agrees (§8). |

Today canGenerate refusal blocks the whole story (SB turn.js:379); dormancy must therefore
suppress that hook, not return false. Optional NSD/social and journal UI may be off. Installed
native state still needs its participant on restoration; absent saved participant bytes hold it.

## 3. Interface: existing and new

The [appendix](RB_PHASE0_APIS.md) replaces the old “kept `*`” shorthand. Every old draft name
is resolved here. Draft-only aliases are documentation mappings, not additional registrations.

Keep shipped names/payloads in the appendix. Draft aliases world.place/threads.list/
stats.spend/quest.accept/quest.turnIn/companion.recruit/dismiss/control map respectively to
atlas.place/here, director.threads/thread, party.spend, quest.take/finish and shipped party
roster commands; no alias registrations. savepoint.* is new. return.point/status/cue are
shipped, but rules-v2 restoration is an explicit §8 migration. New rules.* queries do not
replace existing party.* wire shapes. All typed API/state changes below are proposals.

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
// Consumed view of director.threads with proposed additive rpg extension.
// Preserve their other existing fields; this is not a replacement wire shape.
type ThreadProjection = {id:Id; key:Text120; kind:string; summary:Text600;
  fields:Record<string,string>; status:'active'|'resolved'; offer:boolean;
  taken:{rev:Count}|null; ended:{rev:Count; reason:string; outcome:string}|null;
  rpg?:Quest};
// journal.day({day:Day,snapshot?:Id}); at most 12 visible lines
type JournalDay = {day:Day; title:Text80; lines:Text240[];
  source:'digest'|'facts'|'snapshot'; missing:boolean};
// rules.modifier({actor:Id,stat:Stat,skill?:Text80}); no die, no relationship bonus
type RulesModifier = {actor:Id; stat:Stat; amount:Int<-30,30>;
  parts:{source:'stat'|'skill'|'talent'|'item'|'effect'|'encumbrance'; ref:Id|null; reason:Text120; amount:Int<-30,30>}[]};
type SkillView = {skill:Ref; form:Ref; name:Text80; mastery:Int<0,5>;
  uses:Int<0,35>; nextAt:Int<1,35>|null; steps:Int<0,2>; formMastery:Record<Ref,{uses:Count; mastery:Int<0,5>}>};
type SheetView = {id:Id; name:Text80; role:Text80; portrait:string|null; background:Text2000; origin:Actor['origin']; kind:Actor['kind']; npcId:Id|null;
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

New `threads.link` stores the RB-computed Quest only at director.threads[thread].rpg;
Quest.id equals thread.id. No separate quest domain or linked second quest ID exists.
New threads.questWrite replaces that extension with expected-hash checking. SD alone drafts
director; RB calls SD writers inside the shared transaction, including reward/closure.
`threads.close` retains rpg, sets resolved/ended and appends one outcome journal record.
For upgraded threads, outer target/reward/ready/owed fields are compatibility projections of
rpg objectives/reward/settlement; they are not separately editable payout state. SD generic
editing preserves rpg and cannot change its mechanics. Old owed queries project rpg unpaid
amounts in schema2; do not run both old owed writes and new settlement writes.
Repeated identical closure succeeds without changes; conflicting outcome returns `CONFLICT`.
expectedHash and returned hash are SHA-256 over canonical normalized **public director.thread
projection**, including rpg and rev, excluding only private track (the query already omits it).
SD computes the identical projection inside the transaction; callers need no private-state reads.

`journal.day` works independently of digest/journal UI switches. Filter hidden facts, then use
visible digest, visible facts, then saved visible scene. Missing day returns `missing:true`,
title `Day <day>`, saved-scene line or `[]`; no hidden-event recap. Current digest queries can
return null when disabled (SD `chronicle/queries.js:13`), so this adapter is new work.

Proposal (needs the user): **P09 — independent checks.** Transfer the checks domain,
check capture and shipped check interfaces to SD. Merely moving files is insufficient: RB
checks/commands.js:106 requires party.actor/pc, and checks/modifiers.js:5 includes topic
skills/talents/items, effects and burden. SD gets its own settings and new state
`checks.policy:{actors:Record<Id,{id:Id,name:Text80,bonuses:Record<string,Int<-30,30>>}>,
defaultActor:Id|null,rbActors:Record<Id,ActorId>,rbModifiers:boolean,social:boolean}`.
Initialize maps empty/default null and booleans true. New player command
`checks.actor({id?:Id,name:Text80,bonuses?:Record<string,Int<-30,30>>,makeDefault?:boolean})`
creates ca_ ID or edits known actor, defaults bonuses {}, makeDefault false (first becomes
default), result `{actor:Id}`; bad names/keys/numbers INVALID, unknown supplied id NOT_FOUND.
Bonuses use stat/topic keys, no RPG sheet required; lookup never requires installed RB.

SD checks.roll resolves SD actor/default, optional explicit rbActors link and one
rules.modifier({actor,stat,skill}) projection. Retain RPG base-stat modifier plus topic skill+2,
talent+1, one item+1, extras together cap+3, effects cap±3, burden−2 outside caps. Do not add
gear stat modifiers again. Standalone SD policy bonuses apply when RB supplies no modifier;
never sum two stat bases. SD combines at most one NSD npc.socialModifier({name,skill}) result
`{mod,name,skill,reasons:[{text,value}]}` or null (NSD src/storysuite-v2.js:524); no target,
missing/off social or absent RB contributes zero. Do not also gather old checkModifiers.
Standalone bonus = bonuses[resolvedStat] (default0) plus each distinct matching
`topic:<name>` bonus once, using the transferred topic table; no implicit item/talent/party read.
Resolve explicit stat first, else transferred statForCheck(skill) (unknown→LUK). With a valid RB
link/projection, replace that entire standalone subtotal with RB parts. Add one optional NSD
part, clamp final modifier to −30..30 and append a policy-cap adjustment part if clamped, so
recorded parts sum exactly to mod. SD settings defaultDc:15 (range1..40), costMargin:2 (0..5),
rbModifiers:true and social:true are SD-owned; no RB settings lookup. checks.roll dc omitted
uses defaultDc. One SD d20: natural20 crit, natural1 critfail, else total>=dc success,
>=dc−costMargin cost, else fail (default matches RB party/checks.js:57).

New/extended payloads. Optional fields have the stated default. Refuse unknown fields. Retain
shipped payload variants through adapters; see appendix. In particular, `party.spend` still
accepts its existing points map, and `party.edit` retains its existing non-progression fields.

```ts
type Commands = {
  'class.choose':{actor:Id; milestone:10|20|30; class:Ref; expectedClass:Ref; rulesHash:Hash};
  'path.choose':{actor:Id; milestone:40|50|60|70|80|90; skill:Ref; fromForm:Ref; option:Ref; rulesHash:Hash};
  'skill.train':{actor:Id; skill:Ref; form:Ref; trainer:Ref; session:Id};
  'party.spend':{actor?:Id; points:Partial<Record<Stat,Int<0,99>>>}; // shipped map retained
  'quest.take':{id?:Id; key?:Text120}; // same SD thread, not a second RB offer store
  'quest.abandon':{id?:Id; key?:Text120};
  'quest.finish':{id?:Id; key?:Text120; by?:'story'}; // omitted by = player; story trusted only
  'threads.link':{thread:Id; quest:Quest; expectedHash:Hash};
  'threads.questWrite':{thread:Id; quest:Quest; expectedHash:Hash};
  'threads.close':{thread:Id; instance:Int<1,1000000>;
    outcome:'done'|'failed'|'expired'|'abandoned'; reason:Text240; settlement:Id};
  'party.addCompanion':{name:Text80; class?:Ref; offer?:Id}; // additive fields; all shipped fields retained by adapter
  'party.removeCompanion':{actor:Id};
  'party.edit':{actor:Id; control?:'player'|'auto'; name?:Text80; role?:Text80; npc?:string; portrait?:string|null; growth?:'manual'};
  'party.setActive':{actors:Id[]}; // new, 1..3 durable actors, includes PC, no active fight
  'party.summon':{owner:ActorId; template:Ref; fight:Id}; // trusted paid form/pet event only
  'summon.end':{actor:Id; reason:'expired'|'dismissed'|'downed'|'fight-ended'};
  'death.resolve':{event:Id}; // never caller-selected outcome or snapshot
  'checks.roll':{actor?:Id; stat?:Stat; skill:Text80; targetNpc?:Id; dc?:Int<1,40>; evidence:Id};
  'rules.settle':{boundary:Source}; // trusted training start/completion, condition/temporary/quest expiry
  'item.equip':{stack:Id; to?:Id; actor?:Id; targetSlot?:Slot}; // slot is the only new field
  'savepoint.make':{name?:Text80}; // default "Save point", player only
  'savepoint.restore':{snapshot:Id; deathEvent:Id; prepared:Id}; // authenticated host/RB only
};
```

`creation.finish` gains required player-selected `class:Ref`. It atomically creates the actor
and records the milestone-0 Choice with its three base skills. A standalone class.choose cannot
create an actor or choose the basic class on someone's behalf. Preserve existing creation fields.

`savepoint.list({}) -> Snapshot[]` returns eligible points in target order. `items.slots({actor?})`
adds `{slots:[{key:Slot,label:Text80,blockedBy:Id|null}]}` in the fixed eight-slot order, retaining
compatibility counts `{accessory:2,worn:4}`. `items.canWear` accepts new `targetSlot?:Slot` and
keeps `{ok,why?}`. Neither query writes equipment.

Training completion, use credit, expiry and daily saves are trusted hook steps, not UI buttons.
New rules.training({actor?:Id}) returns {actor,requests:TrainingRequest[],sessions:TrainingSession[]}
(default PC, unknown actor null); this is the UI’s replayed training view, never a second store.
Path option arrays are ordered [g,a,b].
New capture payloads, with host-supplied Source: skill-use `{actor:Id,skill:Ref,form:Ref}`;
lethal `{actor:Id,cause:"narrative"|"execution",evidence:Id[]}`; intervention
`{event:Id,evidence:Id}`. Capture may propose evidence, never a death outcome, class/path choice
or numeric mastery. New SD `atlas.dangerSet {scope:'world'|'region'|'place',key:Id|null,policy:AreaPolicy|null,
region?:Id}` is player settings-only, result `{scope,key}`; world requires null key, other scopes
known ID, absent reference NOT_FOUND, malformed INVALID. It updates atlas.danger/placeRegions;
no silent atlas.edit payload change. New grammars are
`! skill-use <actor ID> | skill: <def ID> | form: <def ID>`,
`! lethal <actor ID> | cause: narrative|execution | evidence: <comma-separated IDs>`,
`! intervention <event ID> | evidence: <ID>`. Host resolves evidence from active visible
history; invalid/ambiguous references are held REFUSED. A mention is not a paid skill use.
Intervention must target this event, precede batch sealing, be an unused code-validated rescue
action/effect by a living actor with its cost available. Capture never selects outcome/snapshot.
Training has no capture.training entry; rules.settle is its only trusted start/completion path.
`party.addCompanion` accepts the existing payload, but resolves its v2 class from the accepted
recruitment offer when omitted; old free-form skill grants cannot bypass the three-skill rule.
The lead removes SD quest registrations before RB registers their retained names.

Proposal (needs the user): **P14 — currency and money policy.** `purse.currency({})` returns
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
RB rule in the same transaction. Keep crafted craft/<slug> or craft/<order-suffix> IDs (RB craft/make.js:209, trade/index.js:164)
and generated trade/<slug>[-rarity-l<level>] IDs (trade/core.js:463); register their rules
atomically with grant/buy. V2 stock/commission generation returns a validated def+ItemRule
plan from its frozen source template. Copy explicit slot/tags and authored weight/requirements;
unknown/ambiguous source rules hold the offer, never infer requirements from its name.
New SB inventory.definitions({ids?:Ref[]}) -> ItemDef[] returns frozen complete known defs,
default all; unknown refs omitted, malformed args []. RB builds Inputs.defs through this
query, not forbidden implicit cross-owner raw reads. E provides it under P01.
Split/merge/buy/craft/return retain that ID. Unknown RPG gear
is unusable until validated; never infer requirements from its display name. No permissive
extra fields need to be smuggled into SB item records.

Receipt/error wire shapes retain the bus envelope (SB `src/v2/commands.js:467`, `:473`). The
`v2` data extension and §6 guards are new. Critical metadata must survive display-data trimming
(SB persist.js:268; preservation is new track E work). New result fields are required exactly as listed per entry; omitted optional fields stay omitted.

```ts
type ErrorCode = 'INVALID'|'REFUSED'|'NOT_FOUND'|'NOT_ENOUGH'|'CLAIMED'|'STALE'|
  'FEATURE_OFF'|'LIMITED'|'FAILED'|'NOT_OWNER'|'UNSUPPORTED'|'UNKNOWN_COMMAND'|'DEPENDENCY_UNAVAILABLE'|'CLOCK_UNSET'|
  'RULES_MISMATCH'|'CONFLICT'|'SNAPSHOT_UNAVAILABLE'|'RESTORE_PENDING'|'REPLAY_PREREQUISITE';
type Failure = {ok:false; code:ErrorCode; message:string};
type ResultData = {[key:string]:Json}; // exact closed per-entry shape in table below, not arbitrary extension keys
type Receipt = {id:Id; type:string; module:string; cause:'ui'|'story'|'system';
  seed:Int<0,4294967295>; summary:string; narrate:boolean; rev:Count;
  data:{v2?:{schema:2; key:string; epoch:Id; source:Source; rulesHash:Hash|null;
    guard:Guard; evidence?:Inputs['evidence']; result:ResultData}}; afterCapture?:true; replan?:{payload:object; line?:object}};
type Success = {ok:true; receipt:Receipt};
```

Existing data stays alongside v2. New mechanics require v2. Retry uses the same persisted
action ID and returns the original result; failures apply no partial payout/spend/claim.
The shipped receipt has replan:{payload,line?} and sibling afterCapture:true (SB commands.js:467,
turn.js:720; neither has the review's nested afterCapture shape).

| New entry | Allowed issuer; receipt.data.v2.result | Extra refusal |
|---|---|---|
| class.choose / path.choose | Player UI only, no module caller; `{actor,milestone,previous,selected,skills?:[Ref,Ref,Ref]}` | REFUSED ineligible; STALE expected class/form; invalid replay REPLAY_PREREQUISITE. |
| skill.train | Player request; `{session,status:'requested'}` | REFUSED running/pending session, unknown trainer NOT_FOUND. No fee/time at UI. |
| rules.settle | Host system only; `{started:Id[],completed:Id[],expired:Id[],credited:Id[]}` | Replan=true; CLOCK_UNSET when required; atomic time/fee; no duplicate boundary. |
| threads.link / questWrite | RB nested call only; `{thread,instance,hash}` | SD validates extension shape; id must equal thread; expectedHash mismatch STALE, conflicting link CONFLICT; identical retry succeeds. |
| threads.close | RB nested only; `{thread,instance,outcome,settlement}` | Conflict CONFLICT; same closure no-op. Keep abandoned as shipped ended.outcome; map expired to failed; retain exact RB outcome in rpg/journal. |
| party.setActive | Player outside combat; `{actors,reserve}` | REFUSED >3, lacks PC, duplicate/dead/temporary actor or active fight. |
| party.summon | Authenticated paid form/pet event; `{actor,fight,template}` | REFUSED limit6 or wrong owner/fight; no arbitrary stat/class payload. |
| summon.end | Host/RB rule; player owner may dismiss only; `{actor,reason}` | REFUSED durable actor/wrong reason/caller; identical dismissal returns prior result. |
| checks.roll | SD capture/precheck/system only; `{check,actor,die,modifiers,mod,total,dc,outcome}` | NOT_FOUND unknown actor/evidence; REFUSED inactive/used evidence; no supplied die/outcome. |
| death.resolve | RB/host system only; `{event,batch,outcome,snapshot:Id|null}` | REFUSED unsealed/invalid evidence; no caller-picked outcome/target; native protocol §8. |
| savepoint.make / restore | Player asynchronous host adapter / authenticated coordinator; `{snapshot}` / `{return,status:'committed'}` | SNAPSHOT_UNAVAILABLE missing bytes/participant; STALE prepared head; RESTORE_PENDING barrier. |
| return.cue v2 | Host complete-token only; `{return,cue}` | REFUSED before complete; same wake idempotent, conflicting cue CONFLICT. Legacy payload only in legacy runtime. |

Common failures: INVALID bad/unknown fields, NOT_FOUND unknown IDs, REFUSED authority/eligibility,
DEPENDENCY_UNAVAILABLE, CLOCK_UNSET, RULES_MISMATCH, STALE, RESTORE_PENDING. All singular new
queries return null on unknown references; lists []. New types such as Clock, AreaTier,
JournalDay, PoolView and SkillView are projections, not changes to shipped query results.

## 4. State shapes

Proposal (needs the user): **P16 — pools:** retain shipped public {cur,max} and private loss
bookkeeping. **P17 — quests:** retain SD's single thread store with RB-computed rpg extension.
**P18 — XP:** retain shipped grantXp payload/difficulty ownership; no new amount/reason signature.

Closed JSON shapes. `Int<L,H>` is a safe integer in the inclusive range; `Count` is
`Int<0,9007199254740991>`. Detect arithmetic overflow. Defaults apply at creation/import,
not as guesses for old saves. Required fields without a stated default must be supplied.
All domain initializers return objects, including `{override:null}` currency policy
(SB `src/v2/registry.js:158`). Maps start empty and optional notes start `''` unless stated.

```ts
type RecordId = string; // /^[a-z][a-z0-9]*_[0-9a-z]{8}$/ (SB src/v2/check.js:7)
type DefId = string; // /^[a-z0-9]+(?:[._-][a-z0-9]+)*\/[a-z0-9]+(?:[_-][a-z0-9]+)*$/ (:9)
type Id = RecordId|DefId; type Ref = DefId;
type ActorId = string; // /^ac_[0-9a-z]{8}$/
type Owner = 'party'|ActorId; // /^(?:party|ac_[0-9a-z]{8})$/ (domains/common.js:4)
type Json = null|boolean|number|string|Json[]|{[key:string]:Json};
type Hash = string; // 64 lowercase hex characters, SHA-256
type Text80 = string; type Text120 = string; type Text240 = string; type Text600 = string; type Text2000 = string;
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
// P14 requires value1 in a nonempty table; this is a proposed policy check, not shipped coinsOf behavior. Values are worth in base units, not ratios.
type RulesIdentity = {packKey:string; packVersion:string; packHash:Hash;
  schema:2; engine:'rb-rules-2'; constantsHash:Hash};
type Source = {sid:RecordId; swipeKey:RecordId; evidence:RecordId; ordinal:Int<0,1000000>};
type Pool = {cur:Count; max:Int<-9007199254740991,9007199254740991>; lost?:Int<-9007199254740991,9007199254740991>};
type PoolView = {cur:Count; max:Count}; // clamp(max-lost,0,max) when lost exists; otherwise clamp(cur,0,max)
type UseAttempt = {id:RecordId; capSource:Source; paid:boolean; awarded:0|1; reason:'credited'|'cap'|'mastered'|'clock-unset'; actor:Id; skill:Ref; form:Ref; source:Source;
  kind:'combat'|'narrative'|'training'; minute:Minute|null; day:Day|null; session:Id|null};
type SkillState = {skill:Ref; form:Ref; steps:Int<0,2>}; // credits live only in training.attempts
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
type Actor = {id:ActorId; name:Text80; role:Text80; portrait:string|null; background:Text2000;
  origin:{race:{id:Ref; name:Text80}|null; talents:{id:Ref; name:Text80}[]}; tags:string[]; createdAtMinute:Minute|null; growth:'manual'; kind:'pc'|'companion'|'summon'|'pet'; npc:string|null; npcId:Id|null;
  control:'player'|'auto'; life:'alive'|'downed'|'gravely-injured'|'dead';
  level:Int<1,99>; earned:Int<-9007199254740991,9007199254740991>;
  levelSteps:Record<string,LevelStep>; points:Int<-1000000,1000000>; stats:Stats;
  hp:Pool; mp:Pool; sp:Pool; conditions:Record<Id,Condition>; class:Ref;
  classPath:[Ref]|[Ref,Ref]|[Ref,Ref,Ref]|[Ref,Ref,Ref,Ref];
  skills:[SkillState,SkillState,SkillState];
  temporary:null|{owner:Id; fight:Id; template:Ref; expiresAt:Minute|null; expiresRound:Int<1,60>|null}};
type PartyDomain = {rulesVersion:2; pc:Id|null; order:Id[]; reserve:Id[]; temporary:Id[];
  actors:Record<ActorId,Actor>; offers:Record<RecordId,Offer>; rested:Minute|null};
// initial pc/rested:null; arrays:[]; actors:{}
type ProgressDomain = {rulesVersion:2; choices:Record<Id,Choice>};
type TrainingSession = {id:Id; actor:Id; skill:Ref; form:Ref; trainer:Ref; source:Source;
  start:Minute; end:Minute; cost:Count; state:'running'|'completed'|'interrupted';
  awarded:Id[]; eventDie:Int<1,100>; eventPick:Ref|null; event:null|{id:Id; template:Ref; issued:boolean}};
type TrainingRequest = {id:Id; actor:Id; skill:Ref; form:Ref; trainer:Ref; source:Source;
  status:'requested'|'started'|'rejected'; reason:Text240|null};
type TrainingDomain = {rulesVersion:2; requests:Record<Id,TrainingRequest>;
  attempts:Record<Id,UseAttempt>; formMastery:Record<ActorId,Record<Ref,{uses:Count; mastery:Int<0,5>}>>; sessions:Record<Id,TrainingSession>;
  replyUse:Record<Id,Record<Id,Count>>; dayUse:Record<string,Record<Id,Count>>};
// use tallies are derived caches of surviving UseAttempts, never another authority.
type RulesDomain = {rulesVersion:2; identity:RulesIdentity|null; resolved:ResolvedRules|null;
  generated:Record<Ref,FormDef>; itemRules:Record<Ref,ItemRule>;
  contentClaims:Record<Id,{def:Ref; kind:'item'|'foe'; area:AreaTier; source:Source;
    origin:'pack'|'generated'; lore:'validated'|'held'; approvedBy:'code'|'player'|null; uniqueClaim:string|null}>;
  currency:{override:Currency|null}; flags:Record<string,{value:boolean; source:Source}>; settings:EffectiveSettings; constants:Constants};
// initial identity/resolved:null; generated/itemRules/contentClaims:{}; currency:{override:null}; constants:§5
```

Every created actor has exactly the current class's three skills. Only an uncreated party lacks
skills. `classPath` keeps class IDs, not old skills. P19 mastery and displayed uses are derived from
current-form awarded attempts, not separately writable. All sources write training.attempts, including
older classes/forms,
so swapping skills cannot reset actor/day caps. Path forms retain their base skill ID. Sheet
gear is derived from SB equipment records. Temporary actors cannot use permanent progression.

Register party counters for `actors/*/id` first, then each pool's `lost` and `max`, `level`,
`earned`, `points`, `stats/*`, and `rested`. P16 keeps public {cur,max} and optional private lost as shipped (RB party/pools.js:6, :60).
Damage/heal are deltas; every numeric reset uses ctx.absolute on the owner path, including
cur/max/lost full recovery, form-cache reset, revival and clock sets. Full recovery writes
cur=max and removes lost or sets it absolutely. Never replay a reset as a negative delta. Keep earned XP + level-step records and fit them after a
deleted award, including point debt, following RB `src/v2/party/pools.js:6`. Keep shipped cur/xp compatibility fields as fitted mirrors; rules views derive from counters. Key credits/choices by ID, not array positions. Per-reply
caches are scratch, rebuilt from surviving evidence. Do not trim evidence still referenced by
a choice, snapshot or return. Raw counters may be signed after rebasing; effective views clamp.

```ts
type Requirement = {kind:'class'; classes:Ref[]}|{kind:'flag'; key:string; value:boolean}|{kind:'level'; min:Int<1,99>}|{kind:'stat'; stat:Stat; min:Int<1,99>}|
  {kind:'quest'; template:Ref}|{kind:'item'; def:Ref; qty:Int<1,999>}|
  {kind:'place'; place:Id}|{kind:'thread'; thread:Id};
type Objective = {id:Id; kind:'kill'; foe:Ref; count:Int<1,999>}|
  {id:Id; kind:'collect'; def:Ref; count:Int<1,999>; consume:boolean}|
  {id:Id; kind:'visit'; place:Id}|{id:Id; kind:'story'; text:Text240};
type Reward = {coin:Count; xp:Count; items:{def:Ref; qty:Int<1,999>}[]};
type Quest = {id:Id; template:Ref; instance:Int<1,1000000>; title:Text80;
  category:'main'|'side'|'bounty'; giver:Id|null; turnInPlace:Id|null;
  requirements:Requirement[]; objectives:Objective[];
  evidence:Record<Id,{objective:Id; source:Source; amount:Int<0,999>}>; reward:Reward;
  storyCredit:{coin:Count; claims:string[]};
  acceptedAt:Minute|null; acceptedCursor:Cursor|null; deadline:Minute|null;
  repeat:null|{cooldownMinutes:Int<0,525600>; nextOfferAt:Minute|null};
  chain:null|{previous:Ref|null; next:Ref|null};
  state:'offered'|'active'|'done'|'failed'|'expired'|'abandoned';
  settlement:null|{id:Id; source:Source; outcome:'done'|'failed'|'expired'|'abandoned';
    coinPaid:Count; xpPaid:Count; itemsPaid:{def:Ref; qty:Int<1,999>}[]; claim:string}};
// Quest lives only at director.threads[Quest.id].rpg; no QuestsDomain or second quest ID.
type Guard = {epoch:Id; rulesHash:Hash|null; inputHash:Hash|null; actor:Id|null; minLevel:Int<0,99>;
  previousClass:Ref|null; fromForm:Ref|null; unusedMilestone:Count|null;
  mastery:{skill:Ref; form:Ref; minimum:Int<0,5>}[];
  evidence:Id[]; claims:string[]; snapshot:Id|null; clock:{min:Minute; max:Minute}|null};
// Empty guard: current epoch, minLevel:0, lists:[], other fields:null.
type DeathEvent = {id:Id; batch:RecordId; source:Source; actor:Id; npcId:Id|null;
  cause:'wipe'|'narrative'|'execution'; lethalEvidence:Id[]; intervention:Id|null;
  check:null|{die:Int<1,20>; stat:Stat; modifier:Int<-30,30>; dc:Int<5,40>; total:Int<-29,50>};
  outcome:'pending'|'saved'|'gravely-injured'|'dead'; snapshot:Id|null;
  resolvedClaim:string|null; cue:Id|null};
type DeathDomain = {rulesVersion:2; events:Record<Id,DeathEvent>; pending:Id[];
  batches:Record<RecordId,{events:Id[]; sealed:boolean}>;
  memory:'deja-vu'|'none'|'full'; lastReturn:ReturnRecord|null};
// initial events:{},pending:[],memory:'deja-vu',lastReturn:null
type Cursor = {sid:RecordId; swipeKey:RecordId; block:RecordId; op:Count; rev:Count};
type Participant = {module:string; checkpoint:Id; hash:Hash; schema:Count};
type Snapshot = {capturedAtRev:Count; label:Text80; id:Id; kind:'initial'|'manual'|'day-start'; name:Text80; epoch:Id;
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
type Offer = {id:RecordId; kind:'join'|'skill'|'leave'; source:Source; actor:ActorId|null;
  name:Text80; npcId:RecordId|null; class:Ref|null; skill:Ref|null; form:Ref|null;
  level:Int<1,99>|null; state:'offered'|'accepted'|'dismissed'};
type ItemDef = {id:Ref; name:Text80; kind:'goods'|'material'|'consumable'|'equipment'|'quest'|'money';
  rarity:Rarity; value:Count; stack:boolean; slot:string|null; stats:Record<string,number>;
  effect:Record<string,Json>; tags:string[]; note:string; carry?:Int<1,1000>};
type EquippedGearItem = {stack:RecordId; def:Ref; slot:Slot; rarity:Rarity; level:Int<1,99>;
  stats:Partial<Record<Stat|'ATK'|'MATK'|'DEF'|'MDEF'|'HP'|'MP'|'SP'|'crit'|'hit'|'dodge',number>>;
  tags:string[]; cond:Count|null; max:Count|null; band:'good'|'worn'|'tattered'|'broken'|null;
  factor:number; refine:Int<0,3>; final:true};
type EffectiveSettings = {carryLimit:boolean; carrySize:Int<10,500>; carryItems:{item:Text80; carry:Int<1,1000>}[];
  difficulty:'normal'; promptChars:Int<500,8000>; memory:'deja-vu'|'none'|'full'; wear:boolean; refine:boolean};
type Inputs = {actors:Record<ActorId,Actor>; rules:ResolvedRules; flags:Record<string,boolean>;
  roster:{pc:ActorId|null; active:ActorId[]; reserve:ActorId[]; temporary:ActorId[]}; gear:{byActor:Record<ActorId,EquippedGearItem[]>};
  encumbrance:Record<ActorId,{encumbered:boolean; penalty:number; stats:Stat[]; load:Count; capacity:Count}>;
  settings:EffectiveSettings; present:RecordId[]; ownedStacks:Record<Owner,RecordId[]>;
  evidence:Record<RecordId,{source:Source; kind:'kill'|'visit'|'story'|'rescue'|'use'; actor:ActorId|null;
    foe:Ref|null; place:Id|null; count:Count; visible:boolean; payloadHash:Hash}>;
  storyBudget:{budget:Count; paid:Count; left:Count; vouched:Count}; clock:Clock; here:{id:Id; name:Text80}|null; area:AreaTier;
  inventory:{defs:Record<Ref,ItemDef>;
    stacks:Record<Id,{id:Id; def:Ref; owner:Owner; qty:Count; equipped:Slot|null}>;
    wallets:Record<Owner,{coin?:Count}>};
  fight:{id:Id|null; status:'none'|'active'|'won'|'lost'|'fled'; round:Int<0,60>;
    durable:Id[]; temporary:Id[]; pools:Record<Id,PoolView>};
  threads:ThreadProjection[]; journal:JournalDay|null; participants:Participant[]};
```

`Inputs` is a read-only seam projection, not copied authority. SB supplies inventory/wallet;
SD supplies clock/place/tier; RB's fight adapter supplies battle facts from `combat.session`,
not narration. Never replace unset story time with real time. Existing creation, combat,
trade/craft, timed-effect and wear stores keep their pinned validators (appendix); adapters
must expose these exact inputs/views. Inputs include frozen settings, final wear/refinement bonuses, giver presence, owned-stack
selection, story-credit claims and typed kill/visit/rescue proof; no implicit narration reads.
Empty foe/tag allowlists forbid generation. atlas.danger gains placeRegions:Record<Id,Id>;
region IDs use rg_ records. Atlas display node keys pack:<key> are not IDs: SD resolves them
to content.places definition IDs or materialized pl_ records before passing Inputs (SD
atlas/world.js:125). Native NPC IDs likewise use a new NSD surrogate mapping, §8.

The shipped combat domain remains /combat/fights/<fight> (RB combat/stored.js:26), not sessions.
Its pinned validator and bestiary/gear records remain in the appendix; proposed additions are
rulesHash:Hash, formActions:Record<RecordId,{actor:ActorId; skill:Ref; form:Ref; paid:boolean; source:Source}>,
cooldownLeft:Record<ActorId,Record<Ref,Count>> and temporary:Record<ActorId,Actor>, initially {}.
Current pools/order/turn/log come from rebuilding its setup/actions, never a second live store. Canonical
schema is CombatDomain={offers:Record<Id,EncounterOffer>,session:null,fights:Record<Id,Fight>,
beaten:Record<Id,{fight:Id,rev:Count,foes:{name:Text80,count:Count}[],won:boolean}>,last:Last[]}.
EncounterOffer={id:RecordId,foes:{name:Text80,count:Int<1,9>,tier:string}[],stakes:'normal'|'death',
place:Text80,rev:Count,note?:Text240}; Fight={id:RecordId,rev:Count,setup:EngineSetup,
actions:EngineAction[],status:'active'|'won'|'lost'|'fled',ranks?:{name:Text80,rank:string}[],
rulesHash:Hash,formActions:Record<RecordId,{actor:ActorId,skill:Ref,form:Ref,paid:boolean,source:Source}>,
cooldownLeft:Record<ActorId,Record<Ref,Count>>,temporary:Record<ActorId,Actor>}.
EngineSetup/EngineAction/Last are the pinned retained JSON records copied in appendix; v2 typed
effect/unit records are the only additions, never sessions/another live combat authority.
Skill action costs are paid at act; permanent mastery is credited once at end.

Training.formMastery is a derived cache for **every** form, initialized {uses:0,mastery:0};
validate equality to awarded surviving attempts. Keep old forms/classes so swaps never erase
mastery/caps. P20 rejects revisiting chosen paths under the no-respec decision; no revisit API.
Actor growth:auto is refused in rules-v2; all stat spends are player-issued. Presentation
fields survive adapters; migration and callers are in the appendix. Cross-domain
validation checks actor/NPC references, disjoint rosters, milestone uniqueness, evidence lineage,
forms/class membership and pool bounds. Condition kind stat-shift requires stat data; shield
requires shield data; all other kinds require status data. Injury uses potency1 and the frozen
penalty. A dead actor has HP0; downed is HP0 without terminal death. Party offers initialize {}; rules.flags {}; training.formMastery {}; death.batches {}; settings
carryLimit:true/carrySize:100/carryItems:[],wear/refine:true,difficulty:normal,promptChars:2000,
memory:deja-vu. All new RB domains start
with rulesVersion:2 and the stated empty maps/nulls; savepoints uses its separate schema:2. Definitions/constants follow §7/§5.

## 5. Rules

User decisions are collected in §11. Unsettled numerical defaults below are proposals.
The freeze records approved constants and their hash; track B cannot invent later formulas.

Proposal (needs the user): **P02 — progression numbers.** Basic class is chosen at creation's
level-0 milestone; play starts at level 1. Keep base stats 5, 10 player-spent creation points,
4 points per level, base-stat cap 99 and 100 XP per level. P19 supplies cumulative mastery thresholds; P02 does not silently approve a new mastery schedule. Each new class skill and pathway form starts at 0/5. At 5/5,
additional uses give no credit. This explicitly replaces old incremental mastery semantics
(RB `src/rules.js:55`); do not accidentally interpret that array as this cumulative schedule.

```ts
type Constants = {
  levelCap:99; startLevel:1; startStat:5; startPoints:10; pointsPerLevel:4; statCap:99;
  xpPerLevel:Int<10,10000>; masteryAt:[1,5,12,22,35]; // xpPerLevel default100
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
| Effective level | Consume surviving LevelStep.cost; new steps cost resolved constants.xpPerLevel (default100), cap99; never a second hardcoded divisor |

Retain target order, attack resolution/rounding, flee/parley, condition ticks, companion AI,
loot and encounter clamps through the pinned pure functions. No attack-math rewrite is
implied. The new rules adapter maps xpPerLevel→character.xpBase, xpExponent:0, maxLevel:99,
pointsPerLevel:4 under P02; legacy runtime keeps old XP rules. End settlement calls
foeXpWorth(enemy,member.level,adaptedRules,{parleyed}) per member, preserving difficulty/
level-gap ownership in RB rather than moving it to quest callers. All dice/results are recorded; replay never rerolls. Level and XP advance while
promotion/path choices wait. At level 99 show remaining earned XP without granting level 100.

Proposal (needs the user): **P03 — use and training caps.** All three sources share caps:
per skill 2/reply and 10/story day, per actor 6/reply and 30/story day. Credit at most one use
per actual paid skill action/evidence ID, including a miss; none for invalid actions or mentions.
Combat permanent awards use the combat.end settlement boundary for reply/day caps; keep
the action Source as proof and a distinct capSource for that end boundary. Narrative capSource
is its own source; training capSource is completion. Attempt.minute/day comes from capSource
clock; reconciliation recomputes it at that prefix, never from stale action text.
Use replyUse[capSource.swipeKey] for reply cache keys (globally unique immutable record ID).
Day is `floor(minutes/1440)`; minute-of-day uses positive modulo. Reply is immutable SID + swipeKey (§6), not a numeric swipe index. Count per-skill caps across all that skill's forms,
so a pathway reset cannot bypass them. Project caps from surviving awarded attempts; keep zero-award attempts for suffix reconciliation (§6). New days use new buckets; do not clear old evidence.
Returning to an earlier day does not make a second bucket in the same epoch. An unset clock
refuses skill credit rather than inventing a day.

`skill.train` stores a TrainingRequest (no payment/time/credit on that UI receipt). The next
trusted beforeGenerate step starts it; only one training start per carrier and one running
session per actor. rules.settle is the sole start/completion command; no separate training capture. Trusted story/system execution checks trainer/place/form,
funds and clock, then calls `wallet.pay` and `director.advance` atomically. One session takes
60 minutes, costs the trainer's explicit fee, and offers up to two capped credits at completion.
No banked over-cap credit. A seeded 10% pick from a nonempty trainer event list can interrupt;
an empty list means no event. Record eventDie and eventPick, including null; same request always reuses its draw. Interrupted sessions give no
completion uses and no automatic refund. A session is running until a trusted completion step
settles it; its completion day supplies caps, including midnight. Re-read replans from surviving
SD time. Reject/roll back start if director.advance did not actually advance 60 minutes;
its per-cause claim must not cause a second fee without time. Current `director.advance` allows 1..1440 minutes and refuses UI calls
(SD `src/v2/time/advance.js:4`, `:55`); the requested session is not an immediate UI time jump.

Proposal (needs the user): **P04 — choice ordering and class content.** Offer only the oldest
unconsumed milestone. Class/path choices refuse while a fight is active or unsettled. At 10/20/30 require level, all three current forms at 5/5 and a direct
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
12/24/36/48; each pathway step adds 12. Numeric power uses hundredths: 100 = ×1.0. P19
multiplies damage/heal/shield power by `1+.1*mastery`. Skill scaling is its declared stat;
replace the engine's stat input through the adapter, not a narrative number. `damage` feeds
retained mitigation/hit/crit/variance using each damage effect's explicit damageType, including mixed-effect forms. `heal` restores
`round(2*effectiveStat*power/100*masteryFactor)` HP. `shield` adds that many shield points.
Clamp healing to max HP; shields absorb damage before HP and expire after one actor turn
if not consumed. Stat effects store stat-shift data. Conditions record attackAtApply as
round(2*effectiveStat*masteryFactor), potency100, and the applier ID, then roll recorded chance and
use retained condition behavior for the stated rounds. Stat effects add signed effective stats
for their rounds, without changing base points or qualifying gear; overlapping identical
(fight/action-or-form source, actor, effect-index, kind) effects refresh, distinct sources add with effective stats floored at 1.

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
Reply conditions decrement once at the end of each subsequent active carrier, not their
application carrier; Continue/re-read do not tick twice. A swipe selects its own boundary.
Source identity includes effect index; remaining/expiry replans with the suffix. Legacy timed
effects retain their own pinned timing policy. A clock change never uses real time.

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
independent fields. `quest.take` is player-only and requires a visible SD thread (including an RB-authored offer in that store),
requirements met, no active instance and cooldown elapsed. For an offer, the same
transaction records explicit player acceptance and its rpg extension through threads.link; an
already accepted thread can be upgraded directly. Quest.id is that th_ ID throughout. Background narration cannot auto-accept a thread. One rpg extension per thread; repeat offers allocate fresh th_ IDs with incremented instance.
No QuestsDomain or quests.* registrations. Generic SD threads still work without RB. `now >= deadline` expires before progress/turn-in at that boundary. Unset
clock blocks timed acceptance/settlement. All objectives are required. Kills use post-acceptance
combat event IDs; collect uses SB stacks; visit uses SD place evidence; story goals require
validated lines. Turn-in rechecks giver/place/requirements. Consume required items and pay typed
reward once in one transaction. If reward items cannot fit, leave ready with no partial reward.
Story coin already credited for that reward reduces the remaining payout; preserve shipped owed-credit
queries through extraction. RPG quests do not run without RB, so no absent-RB training-credit
ledger is invented. For schema2 authored XP, quest.finish calls the shipped
party.grantXp {quest:thread.id,amount:reward.xp,claim:<epoch/thread/instance XP key>}; legacy
{quest,difficulty} callers remain valid and RB still computes difficulty awards. A zero-XP
reward omits the call. Existing XP namespace prefixes stay intact; supplied claim carries epoch.
No second payout/XP hook. Abandon/fail/expire give no
success reward. Close/journal the SD thread with the outcome in the same settlement. Cooldown
starts at terminal minute; next chain quest is offered only after done, never auto-accepted.
Even zero-cooldown repeats require a new offer and acceptance, preventing a button reward loop.

Crafting remains open to anyone with recipe/material/station, scaled by declared stats. Keep
current crafting and commission maths. Narrative sinks use validated debit lines and SB wallet
commands. Each level-up, promotion and pathway step emits one narration receipt. Companion AI
runs in code. These are retained user decisions, not proposed optional features.

Proposal (needs the user): **P10 — death check numbers.** Validated intervention saves the
actor. Otherwise record `d20 + rules.modifier({actor,stat:'VIT'}).amount` against DC15: success = gravely
injured, failure = dead. Narration cannot select outcome. Battle execution of an already downed
companion needs an explicit validated lethal event and the same check; HP0 alone is never death.
After a surviving fight, a downed companion returns to 1HP with injury: 1440 SD minutes,
−2 STR/AGI checks. Gravely injured also starts at 1HP with that injury. Use one host-assigned batch ID per active capture boundary (or fight settlement), collect
all lethal/intervention evidence, then seal it after capture. Settle sealed batch events in
actor-ID order; a PC death makes one return for the batch. death.resolve({event}) resolves that event’s **entire sealed batch** atomically (all recorded
dice/results first), then emits at most one PC-return request; event selects the batch, never
an order-dependent early restore. Repeated selectors return saved results. Unknown target
or intervention evidence holds the event rather than silently killing an NPC.

Proposal (needs the user): **P11 — temporary units.** Separate roster, at most six summons/pets,
with owner, fight, optional minute expiry and optional round expiry. Fight ending always
dismisses them; downing also dismisses. They do not occupy PC + 2, add carry capacity or prevent
wipe. Wipe means all active durable members including PC are downed/dead; reserves do not
rescue it. New party.setActive is player-only outside combat, includes PC and at most two
companions; excess recruits enter reserve. New party.summon is trusted-only and materializes
the immutable form's UnitTemplate without permanent XP or milestone claims.
Template kind selects summon/pet, class selects three skills, level is owner's; base stats
clamp(floor(owner stat*statShare/100),1,99), maxima from normal formulas then
floor(max*poolShare/100) (HP at least1), pools filled, conditions empty, growth manual.
Set owner/fight/template, expiresRound=currentRound+rounds, expiresAt=null. Temporary classPath is the template class’s pack ancestry; level comes from owner and is
excluded from earned-XP fitting. Temporary skills
start0/5, cannot earn permanent uses/XP; at most one unit per paid action. No narrative free
pet spawn; a validated pack pet event uses this same paid rule and template. A downed PC can remain while
an active companion acts. Companion death is permanent
on the timeline; only the decided PC return restores earlier saved life state.

Proposal (needs the user): **P19 — mastery schedule/power.** Cumulative thresholds
[1,5,12,22,35] give mastery1..5, zero uses is0/5; factor 1+.1*mastery applies once to numeric
damage/heal/shield. This is a proposed replacement for shipped incremental mastery, not a
user decision. All forms keep derived formMastery entries; new forms start0/5.

Proposal (needs the user): **P20 — revisit policy.** Recommend no return to an earlier form:
permanent paths and no respec remain binding. Reject the review's unapproved one-credit revisit
alternative; archival mastery is still retained for replay/views, never a switch entitlement.

Proposal (needs the user): **P21 — wave recovery.** Recommend retaining shipped behavior:
joining a wave grants no HP/MP/SP (RB src/combat.js:342). Do not add the unapproved 15% SP
wave heal. Defend's retained recovery remains separate.

Proposal (needs the user): **P15 — first-release settings.** Ship normal difficulty first;
easy/hard needs separate approval without changing kept combat math. Situation-dependent RB
prompt cap: 500..8000 characters, default 2000. Essential rule/return facts, then active fight/
quest/progression, then flavor; truncate whole optional lines only. Default memory déjà vu,
no-memory setting, full memory only when pack-enabled. Snapshot effective settings as rule inputs.

## 6. Replay recording

Shipped SB stores flat `record.ops` and `record.spans:[{n,story}]` (persist.js:16), not the
review's span.ops object. replayRecord applies saved operations without handlers (store.js:344).
Re-read replans marked steps on its carrier, then replays later carriers (store.js:786, :831).
trimReceipts removes **all** data after 200 carriers (persist.js:262, :268). No current host
mechanism checks these guards. The following P12/P13 changes are mandatory track E gates.

Proposal (needs the user): **P12 — guarded blocks and suffix reconciliation.** Extend each
transaction's span to `{n,story,id:RecordId,module:string,source:Source,guard:Guard|null,
claims:string[],evidence:Inputs['evidence'],boundaries:{cursor:Cursor,prefixHash:Hash,payloadHash:Hash}[],result:Json,replan:null|{type:string,payload:Json,seed:number}}`; ops remain a
flat list, and n delimits its **atomic op block**. Capture blocks must be split per root
transaction; nested cross-owner commands share its guard/claims. New
`ctx.replayGuard(guard:Guard) -> void` attaches/combines prefix requirements to that root;
only host can attach source, block ID and authority. New pure owner
`hooks.replayGuard({state,query},{guard,source,block:RecordId}) -> {ok:true}|{ok:false,reason}`
checks epoch/hash/input payload hash, actor/class/form, fitted level/mastery, milestone,
evidence/claim prerequisites, clock and snapshot ancestry. Throw/malformed result means failure.
No handlers, new content or random rolls in ordinary replay.
New host query story.evidence({ids?:RecordId[]}) -> Inputs evidence values[] returns only
active visible code-validated proof (default all, unknown omitted, malformed args []).
Owning adapters attach typed evidence in receipt.data.v2.evidence; host stamps Source/hash and
stores it per block, checking the declared kind owner: RB kill/use/rescue/story, SD visit.
It becomes visible only if the block commits; a skipped block contributes no proof. Guards
and Inputs use this projection, never inactive raw text. New proof/parent references are pinned
and restored/reconciled with blocks; no receipt-only proof authority.

The host extracts **claim additions per block** from /meta/claims ops. Apply block ops and its
claims together only after guard and all touched-domain validators pass; otherwise neither
applies. Do not merge carrier-wide claims after skipping a block. Legacy blocks remain on the
legacy path and cannot masquerade as guarded rules-v2 blocks. Invalid UI choices stay stored
but inactive with REPLAY_PREREQUISITE; never choose replacement classes/forms/rewards/saves.
Cache/checkpoint identity includes the prefix hash of block/evidence contents and active
swipeKey, not just carrier SID. In chain (store.js:289), stop trusting subsequent checkpoints
at the **first** failed covers/hash window; remove the fallback to a later unverified checkpoint.
Retained blocks in replaceStory call step(state,ops,{replayed:true}), not the shipped call at
store.js:810. Validate skipped whole blocks rather than leave individual orphan operations.

Persist immutable swipeKey/action/evidence IDs before dispatch; numeric swipe indices are
presentation only (persist.js:6 allows index shifts). Edits/re-read preserve the logical key
but change evidence hashes; a new swipe gets a fresh key. Claims use
`rb:<epoch>:<operation>:<stable-key>`. Quest settlement key is
`rb:<epoch>:quest:<thread-id>:<instance>:settled`, not instance alone. No double grant across
retries, and different quests with instance1 cannot collide. Receipt data retention keeps
`data:{v2:old.data.v2}` when trimming other display data; guards/results also live on blocks,
so replay never depends on receipts surviving. Pin referenced evidence and snapshot bytes.

All valid paid uses, including capped/mastered zero awards, store immutable UseAttempts.
At each prefix, derive awards in capSource carrier/block order then paid-action ordinal, one per attempt. Reconcile
the full surviving suffix after swipe/re-read/delete/rollback if clock, caps, mastery or
prerequisites changed: recompute attempt minute/day and awards, derived formMastery, training,
expiry, daily-save eligibility and dependent guards. Remove old system ops/claims before
replacing them atomically; UI answers are retained only if still valid. Reuse each recorded
seed/draw by stable attempt/session/event ID, even when an earlier zero award now becomes one.
No fresh dice. Combat act stores paid-action attempts in the fight; **combat.end alone** commits
permanent skill awards, XP, final pools/conditions, loot and wear atomically. Its applyResult
adapter must omit the old skill-use/XP path; act never also grants permanent mastery.

| Operation | Saved once | Replay/re-read/delete rule |
|---|---|---|
| class/path choices | Source, predecessor, milestone, rules hash, chosen frozen form/three-skill swap, guard, cue | Losing level/mastery/parent deactivates whole block including claims/cue. Never regenerate. |
| Stats/recruit/control/equipment | Player action, allocation/offer/presentation, expected actor/points/gear, legality | Preserve shipped payloads; missing prerequisite deactivates, no replacement offer. |
| Combat act/end | Fight/setup/action/dice/cost; end key + attempts/XP/pools/loot/wear | /combat/fights/<id>; guard surviving start/form; end is the only permanent settlement. |
| Narrative use/sink/lethal/intervention | Host Source, active proof/hash, attempted award (even zero), debit/check | Re-read replaces capture; suffix reconciliation recomputes awards/buckets, never rerolls. |
| Training start/completion | Request/session, fee/time, advance.data.advanced, eventDie/eventPick, award attempts | rules.settle replans; one start/carrier. Fee and SD time roll back if advanced != requested. |
| Condition/temporary/quest expiry | Entity, exact minute/reply/round boundary, source, result/claim | rules.settle replan on surviving suffix; expiry before action/settlement at now>=deadline. |
| Quest progress/finish | Thread+instance, proof, selected consumed stacks, story credit, payout/XP, SD close/journal | One nested transaction; reward/closure/claim all skip together. No quests domain. |
| Manual save | Cursor, ancestry/prefix hash, all-domain payload/participants, scene/journal | Carrier/action bound eligibility; cached payload alone conveys no authority. |
| Daily save | Exact boundary anchor, trigger source, previous-day target, visible journal link | Replan selection if clock/ancestry changes. Earlier-day cached bytes do not preserve eligibility. |
| Death/restore | Sealed batch, proof/intervention/hash, recorded die/result, exact selected snapshot/prepared token, absolute host block | Guarded ordinary replay never reselects target. Changed evidence replans with original die; invalid old restore/cue retracts first. Missing target holds. |
| Wake | Return ID/cue, saved scene/memory | Exactly once after all participants complete; told status follows selected timeline. |

Each reset uses ctx.absolute at the **owner's** numeric paths (SB commands.js:270, :391);
restoration is a host absolute installation, never ordinary delta replay. Example: removing
10 earlier damage before a reset cannot turn lost0 into −10 or create extra HP. Suffix planning
and participant switching finish before a new head is exposed; crash/retry follows §8 journal.

## 7. Pack schema v2

### Envelope and registered kinds

Keep SB's envelope. Only top-level `id/version/name/author/description/requires/currency/economy/
calendar/weather/content/start/layouts/screens/theme` are accepted (SB `packs/limits.js:33`,
`validate.js:69`). No top-level kind/schema/classes/branches/foes object. Pack `requires` accepts
only storyBlock/capabilities (`validate.js:158`), not new module keys.

Today's registered kinds: items/creatures/shops/recipes/events/quests/races/talents/skills/
presets/places/routes/terms/ranks/crafts/meterPresets/markets (`limits.js:27`). Unknown kinds
are refused (`validate.js:90`). Item/skill fields are closed (`validate.js:226`, `:718`).
Creatures/quests use openRecord (:95/:102/:220), not the review’s nonexistent
checkCreature/checkQuest functions. Rules checks are opt-in by manifest; old packs keep old checks.

Under **P01**, lead adds `rules` to CONTENT_KINDS/OPTIONAL_KINDS, checker, lookup/count/
classification support and capability `rb-rules-v2`. It is **not registered today**. Old SB rejects rules with UNKNOWN_KIND. Missing capability yields MISSING_CAPABILITY only
when capabilities is supplied; null checks syntax only (validate.js:174).
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

Raw nested definitions use slug; normalization adds full SB definition id and resolves
all refs before state storage. No arbitrary raw id overrides host name+slug identity
(SB validate.js:185–215). Following types are resolved; raw omit assigned id; outer content records receive id/slug/pack from SB and the runtime
checker separates these known wrappers before checking raw definitions.
Closed records; all numeric bounds and list limits are validation rules. Optional notes default
`''`, statLabels `{}`, memory déjà vu, replaces null, unique false, recipe known true. Other
fields are required. Arrays capped below or by SB's 1000-entry bound, whichever is smaller. Non-null unit adds
budget score12, spawns once per paid action, maximum6. Damage requires explicit physical/magic
damageType; heal/shield require null. Mixed effects resolve their own targets/damage types.

```ts
type Target = 'one'|'all'|'self'|'ally'|'allies';
type Element = 'none'|'fire'|'ice'|'lightning'|'poison'|'holy';
type Effect = {op:'damage'|'heal'|'shield'; target:Target; power:Int<1,1000>; element:Element; damageType:'physical'|'magic'|null}|
  {op:'condition'; target:Target; kind:Exclude<ConditionKind,'injury'|'stat-shift'|'shield'>; chance:Int<1,100>; rounds:Int<1,6>}|
  {op:'stat'; target:Target; stat:Stat; amount:Int<-10,10>; rounds:Int<1,6>}; // amount != 0
// Damage: one/all. Heal/shield: self/ally/allies. Stat amount>0: self/ally/allies, <0: one/all.
// Harmful conditions poison/burn/bleed/stun/slow/weaken: one/all; regen/guard: self/ally/allies. Shield uses the numeric shield effect only.
type UnitTemplate = {kind:'summon'|'pet'; class:Ref; statShare:Int<10,100>; poolShare:Int<10,100>; rounds:Int<1,60>};
type FormPayload = {unit:UnitTemplate|null; type:'physical'|'magic'|'heal'|'buff'|'debuff'; stat:Stat;
  cost:{mp:Int<0,999>; sp:Int<0,999>; cooldown:Int<0,10>}; effects:Effect[]}; // 1..4 effects
type FormDef = FormPayload & {id:Ref; skill:Ref; name:Text80; note:Text240;
  step:0|1|2; fromForm:Ref|null; origin:'base'|'written'|'generated'};
type SkillDef = {id:Ref; slug:string; name:Text80; note?:Text240; replaces?:Ref|null; base:FormPayload};
type ClassDef = {id:Ref; slug:string; name:Text80; tier:0|1|2|3; parent:Ref|null;
  skills:[Ref,Ref,Ref]; note?:Text240};
type Transform = {op:'set-type'; value:FormPayload['type']}|{op:'set-target'; at:Int<0,3>; value:Target}|
  {op:'set-element'; at:Int<0,3>; value:Element}|{op:'set-power'; at:Int<0,3>; value:Int<1,1000>}|
  {op:'replace-effect'; at:Int<0,3>; value:Effect}|{op:'add-effect'; value:Effect}|
  {op:'remove-effect'; at:Int<0,3>}|{op:'set-cost'; value:FormPayload['cost']}|
  {op:'set-stat'; value:Stat};
type BranchDef = {id:Ref; slug:string; skill:Ref; fromForm:Ref; step:1|2; choice:'a'|'b';
  name:Text80; note?:Text240; transforms:Transform[]}; // 1..8 ordered transforms
type ItemRule = {def:Ref; allowedSlots:Slot[]; hands:0|1|2; requires:Partial<Stats>;
  weight:Int<0,10000>; unique?:boolean};
// non-equipment slots:[],hands:0; equipment 1..2 allowed slots;
// hand items hands:1/2, other gear hands:0; 2H slots exactly ['weapon']; no class locks.
type Trainer = {id:Ref; slug:string; name:Text80; place:Id; skills:Ref[]; fee:Int<1,1000000>;
  minutes:60; eventTemplates:Ref[]}; // 1..30 skills; 0..8 event refs
type FoeDef = {id:Ref; slug:string; name:Text80; tier:Int<0,9>; level:Int<1,99>; stats:Stats;
  skills:Ref[]; loot:{def:Ref; chance:Int<0,100>; qty:Int<1,99>}[]; loreTags:string[]};
// 1..3 skills; 0..8 loot; 0..8 tags (1..40 chars each).
type QuestTemplate = {id:Ref; slug:string; name:Text80; category:'main'|'side'|'bounty';
  giver:Id|null; turnInPlace:Id|null; requirements:Requirement[]; objectives:Objective[];
  reward:Reward; durationMinutes:Int<1,525600>|null;
  repeat:null|{cooldownMinutes:Int<0,525600>}; chain:null|{previous:Ref|null; next:Ref|null}};
// requirements 0..16; objectives 1..8; reward items 0..8.
type ShopDef = {id:Ref; slug:string; name:Text80; place:Id; kind:string;
  stock:{item:Ref; qty:Int<1,999>; price:Count}[]}; // 1..100 rows; kind slug 1..40
type RecipeDef = {id:Ref; slug:string; name:Text80; craft:string; makes:Ref; qty:Int<1,99>;
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
uses the same types/budgets and frozen story/craft/trade runtime namespaces. Raw pack refs cannot name runtime story/craft/trade IDs; runtime validation binds them against the
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
4000 chars/string (`packs/limits.js:5`). Expanded limits: 2048 forms, 1000 branches, 1000 item
rules, 100 trainers, 2 MiB resolved ruleset. 2048 covers 1092 forms for 40 classes/27 advanced (120 bases +27*36 descendants).
Raw pack limits remain unchanged; expanded maps are not pack input. Reject oversized graphs, never truncate. Source form
origin/provenance determines generated-legendary prohibition; a runtime flag cannot relabel it.

### Runtime adapters and validator scope

New pure `formToEngine(form,{actor,mastery,rules}) -> {ok:true,skill,effects,unit}|Errors`:
skill is `{name,type,stat,target,element,mp,cooldown,cooldownLeft:0}`; name/type/stat from form,
mp=cost.sp for physical else cost.mp; target/element from first effect are preview only.
Typed interpreter replaces old skill application: every effect executes its own target and
damageType using retained hit/crit/variance/mitigation; cost/cooldown paid once. Conditions
store resolved integer attackAtApply/shield remaining/stat amount, never an ambiguous raw
Condition.power multiplier. No round(1.3*1.15): power is integer hundredths and P06 adds20 to
**resolved selected parent** (written a/b included). set-type is in Transform; validate every
result/closure. Numeric-only a/b is refused.

New `foeToEngine(foe,{rules,forms,items,ordinal}) -> {ok:true,combatant,loot}|Errors` validates
area/level/refs, derives stats/pools and patk/matk/pdef/mdef/crit by §5 with empty gear, fills
pools, sets side enemy/controller auto, id fo_<8 base36 ordinal> unique across all waves,
role skirmisher/talks false/fleesBelow0/boss false, xp:0 (unused legacy field). Skills are
formToEngine results (foe skills are SkillDef refs, mapped to forms[skill+'-base'] at mastery0);
name/level/loreTags retained. XP at end calls pinned
foeXpWorth(enemy,member.level,adaptedRules,{parleyed}) for each member; no ambiguous foe-only XP. Bypass cleanCreature/finishCreature for v2 foes
(RB templates.js:665): it drops reference skills/stats and may invent template loot. Old packs
retain their object-move/named-loot path. Errors is `{ok:false,errors:[{code,path,message}]}`;
unknown ref UNKNOWN_REF, bounds/budget BAD_RULES; these adapters are rule-internal, no UI writes.

Loot retains `{def,chance,qty}` and the die/result per row. Zero chance gives none; otherwise
roll once, resolve exact SB def/rule and inventory.grant full def. If a legacy summary row is
needed, map to `{name,kind,rarity,stats,effect,qty:[qty,qty],chance}` from ItemDef; stored setup
uses range, not qty array (RB combat/stored.js:59). Do not run v2 drops through cleanLootRow
(templates.js:638), which requires name/kind, restricts qty1..9 and can substitute drops.
Retain carry hold and one atomic settlement. Never store engine e1 or wave-suffixed IDs; remap
all participants/actions/order to SB IDs before storing. Persist referenced kill proofs beyond
combat's 200-fight display history.

New `questTemplateToThread(template,{thread,source,clock}) -> {ok:true,quest:Quest}|Errors`
creates only that thread's rpg extension; preserve key/summary/fields/target/reward/track/owed/
stamps. Template-local objective record IDs are scoped by thread+instance in proof/claim keys.
Old creature fields level/template/moves/traits/boss/look/aliases and quest difficulty/detail/
giver/place/objective remain legal **without** a rules manifest. With rules-v2 manifest use the
closed owned-content schemas here; require explicit reauthoring of conflicting old fields,
never silently drop them. Existing content.skills still uses its shipped strict template format.

### Machine-readable schema

The JSON schema below is normative, extractable data for the manifest and its owned content.
It supplements SB's envelope validator, not replaces it. Structural checks run first; shared
semantic checks then enforce references, graph counts, budgets, Unicode bounds and slot/target
compatibility. Schema defaults are annotations; normalization must actually apply them.
The root is a raw `content.rules[0]` manifest. The new checker runs before SB record wrapping;
normalization keeps host-added id/pack metadata outside the closed manifest. Runtime lookup
unpacks only those known wrapper fields, never silently drops arbitrary unknown input fields. `$defs` also covers owned creature/quest/shop/
recipe lists only when a rules-v2 manifest is present; it does not replace old-pack checks. No external `$ref` is
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
    "id":{"type":"string","minLength":1,"maxLength":160,"pattern":"^(?:[a-z][a-z0-9]*_[0-9a-z]{8}|[a-z0-9]+(?:[._-][a-z0-9]+)*/[a-z0-9]+(?:[_-][a-z0-9]+)*)$"},
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
    "effect":{"oneOf":[{"type":"object","additionalProperties":false,"required":["op","target","power","element","damageType"],"properties":{"op":{"enum":["damage","heal","shield"]},"target":{"$ref":"#/$defs/target"},"power":{"type":"integer","minimum":1,"maximum":1000},"element":{"$ref":"#/$defs/element"},"damageType":{"enum":["physical","magic",null]}}},{"type":"object","additionalProperties":false,"required":["op","target","kind","chance","rounds"],"properties":{"op":{"const":"condition"},"target":{"$ref":"#/$defs/target"},"kind":{"enum":["poison","burn","bleed","stun","slow","weaken","regen","guard"]},"chance":{"type":"integer","minimum":1,"maximum":100},"rounds":{"type":"integer","minimum":1,"maximum":6}}},{"type":"object","additionalProperties":false,"required":["op","target","stat","amount","rounds"],"properties":{"op":{"const":"stat"},"target":{"$ref":"#/$defs/target"},"stat":{"$ref":"#/$defs/stat"},"amount":{"type":"integer","minimum":-10,"maximum":10,"not":{"const":0}},"rounds":{"type":"integer","minimum":1,"maximum":6}}}]},
    "base":{"type":"object","additionalProperties":false,"required":["type","stat","cost","effects","unit"],"properties":{"type":{"enum":["physical","magic","heal","buff","debuff"]},"stat":{"$ref":"#/$defs/stat"},"cost":{"$ref":"#/$defs/cost"},"effects":{"type":"array","minItems":1,"maxItems":4,"items":{"$ref":"#/$defs/effect"}},"unit":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/unit"}]}}},
    "class":{"type":"object","additionalProperties":false,"required":["slug","name","tier","parent","skills"],"properties":{"name":{"$ref":"#/$defs/name"},"tier":{"type":"integer","minimum":0,"maximum":3},"parent":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]},"skills":{"type":"array","minItems":3,"maxItems":3,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"note":{"$ref":"#/$defs/note"},"slug":{"$ref":"#/$defs/slug"}}},
    "skill":{"type":"object","additionalProperties":false,"required":["slug","name","base"],"properties":{"name":{"$ref":"#/$defs/name"},"note":{"$ref":"#/$defs/note"},"replaces":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}],"default":null},"base":{"$ref":"#/$defs/base"},"slug":{"$ref":"#/$defs/slug"}}},
    "transform":{"oneOf":[{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-target"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/target"}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-element"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/element"}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"set-power"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"type":"integer","minimum":1,"maximum":1000}}},{"type":"object","additionalProperties":false,"required":["op","at","value"],"properties":{"op":{"const":"replace-effect"},"at":{"type":"integer","minimum":0,"maximum":3},"value":{"$ref":"#/$defs/effect"}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"add-effect"},"value":{"$ref":"#/$defs/effect"}}},{"type":"object","additionalProperties":false,"required":["op","at"],"properties":{"op":{"const":"remove-effect"},"at":{"type":"integer","minimum":0,"maximum":3}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"set-cost"},"value":{"$ref":"#/$defs/cost"}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"set-stat"},"value":{"$ref":"#/$defs/stat"}}},{"type":"object","additionalProperties":false,"required":["op","value"],"properties":{"op":{"const":"set-type"},"value":{"enum":["physical","magic","heal","buff","debuff"]}}}]},
    "branch":{"type":"object","additionalProperties":false,"required":["slug","skill","fromForm","step","choice","name","transforms"],"properties":{"skill":{"$ref":"#/$defs/ref"},"fromForm":{"$ref":"#/$defs/ref"},"step":{"enum":[1,2]},"choice":{"enum":["a","b"]},"name":{"$ref":"#/$defs/name"},"note":{"$ref":"#/$defs/note"},"transforms":{"type":"array","minItems":1,"maxItems":8,"items":{"$ref":"#/$defs/transform"}},"slug":{"$ref":"#/$defs/slug"}}},
    "itemRule":{"type":"object","additionalProperties":false,"required":["def","allowedSlots","hands","requires","weight"],"properties":{"def":{"$ref":"#/$defs/ref"},"allowedSlots":{"type":"array","minItems":0,"maxItems":2,"items":{"$ref":"#/$defs/slot"},"uniqueItems":true},"hands":{"enum":[0,1,2]},"requires":{"$ref":"#/$defs/requires"},"weight":{"type":"integer","minimum":0,"maximum":10000},"unique":{"type":"boolean","default":false}}},
    "trainer":{"type":"object","additionalProperties":false,"required":["slug","name","place","skills","fee","minutes","eventTemplates"],"properties":{"name":{"$ref":"#/$defs/name"},"place":{"$ref":"#/$defs/id"},"skills":{"type":"array","minItems":1,"maxItems":30,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"fee":{"type":"integer","minimum":1,"maximum":1000000},"minutes":{"const":60},"eventTemplates":{"type":"array","minItems":0,"maxItems":8,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"slug":{"$ref":"#/$defs/slug"}}},
    "requirement":{"oneOf":[{"type":"object","additionalProperties":false,"required":["kind","min"],"properties":{"kind":{"const":"level"},"min":{"type":"integer","minimum":1,"maximum":99}}},{"type":"object","additionalProperties":false,"required":["kind","stat","min"],"properties":{"kind":{"const":"stat"},"stat":{"$ref":"#/$defs/stat"},"min":{"type":"integer","minimum":1,"maximum":99}}},{"type":"object","additionalProperties":false,"required":["kind","template"],"properties":{"kind":{"const":"quest"},"template":{"$ref":"#/$defs/ref"}}},{"type":"object","additionalProperties":false,"required":["kind","def","qty"],"properties":{"kind":{"const":"item"},"def":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999}}},{"type":"object","additionalProperties":false,"required":["kind","place"],"properties":{"kind":{"const":"place"},"place":{"$ref":"#/$defs/id"}}},{"type":"object","additionalProperties":false,"required":["kind","thread"],"properties":{"kind":{"const":"thread"},"thread":{"$ref":"#/$defs/id"}}},{"type":"object","additionalProperties":false,"required":["kind","classes"],"properties":{"kind":{"const":"class"},"classes":{"type":"array","minItems":1,"maxItems":40,"uniqueItems":true,"items":{"$ref":"#/$defs/ref"}}}},{"type":"object","additionalProperties":false,"required":["kind","key","value"],"properties":{"kind":{"const":"flag"},"key":{"type":"string","minLength":1,"maxLength":80},"value":{"type":"boolean"}}}]},
    "objective":{"oneOf":[{"type":"object","additionalProperties":false,"required":["id","kind","foe","count"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"kill"},"foe":{"$ref":"#/$defs/ref"},"count":{"type":"integer","minimum":1,"maximum":999}}},{"type":"object","additionalProperties":false,"required":["id","kind","def","count","consume"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"collect"},"def":{"$ref":"#/$defs/ref"},"count":{"type":"integer","minimum":1,"maximum":999},"consume":{"type":"boolean"}}},{"type":"object","additionalProperties":false,"required":["id","kind","place"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"visit"},"place":{"$ref":"#/$defs/id"}}},{"type":"object","additionalProperties":false,"required":["id","kind","text"],"properties":{"id":{"$ref":"#/$defs/id"},"kind":{"const":"story"},"text":{"type":"string","minLength":1,"maxLength":240}}}]},
    "reward":{"type":"object","additionalProperties":false,"required":["coin","xp","items"],"properties":{"coin":{"type":"integer","minimum":0,"maximum":9007199254740991},"xp":{"type":"integer","minimum":0,"maximum":9007199254740991},"items":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["def","qty"],"properties":{"def":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999}}}}}},
    "quest":{"type":"object","additionalProperties":false,"required":["slug","name","category","giver","turnInPlace","requirements","objectives","reward","durationMinutes","repeat","chain"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"category":{"enum":["main","side","bounty"]},"giver":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/id"}]},"turnInPlace":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/id"}]},"requirements":{"type":"array","minItems":0,"maxItems":16,"items":{"$ref":"#/$defs/requirement"}},"objectives":{"type":"array","minItems":1,"maxItems":8,"items":{"$ref":"#/$defs/objective"}},"reward":{"$ref":"#/$defs/reward"},"durationMinutes":{"oneOf":[{"type":"null"},{"type":"integer","minimum":1,"maximum":525600}]},"repeat":{"oneOf":[{"type":"null"},{"type":"object","additionalProperties":false,"required":["cooldownMinutes"],"properties":{"cooldownMinutes":{"type":"integer","minimum":0,"maximum":525600}}}]},"chain":{"oneOf":[{"type":"null"},{"type":"object","additionalProperties":false,"required":["previous","next"],"properties":{"previous":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]},"next":{"oneOf":[{"type":"null"},{"$ref":"#/$defs/ref"}]}}}]}}},
    "foe":{"type":"object","additionalProperties":false,"required":["slug","name","tier","level","stats","skills","loot","loreTags"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"tier":{"type":"integer","minimum":0,"maximum":9},"level":{"type":"integer","minimum":1,"maximum":99},"stats":{"$ref":"#/$defs/stats"},"skills":{"type":"array","minItems":1,"maxItems":3,"items":{"$ref":"#/$defs/ref"},"uniqueItems":true},"loot":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["def","chance","qty"],"properties":{"def":{"$ref":"#/$defs/ref"},"chance":{"type":"integer","minimum":0,"maximum":100},"qty":{"type":"integer","minimum":1,"maximum":99}}}},"loreTags":{"type":"array","minItems":0,"maxItems":8,"items":{"type":"string","minLength":1,"maxLength":40},"uniqueItems":true}}},
    "shop":{"type":"object","additionalProperties":false,"required":["slug","name","place","kind","stock"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"place":{"$ref":"#/$defs/id"},"kind":{"$ref":"#/$defs/slug","maxLength":40},"stock":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","additionalProperties":false,"required":["item","qty","price"],"properties":{"item":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":999},"price":{"type":"integer","minimum":0,"maximum":9007199254740991}}}}}},
    "recipe":{"type":"object","additionalProperties":false,"required":["slug","name","craft","makes","qty","materials","fee","minutes","dc","stat"],"properties":{"slug":{"$ref":"#/$defs/slug"},"name":{"$ref":"#/$defs/name"},"craft":{"$ref":"#/$defs/slug"},"makes":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":99},"materials":{"type":"array","minItems":1,"maxItems":8,"items":{"type":"object","additionalProperties":false,"required":["item","qty"],"properties":{"item":{"$ref":"#/$defs/ref"},"qty":{"type":"integer","minimum":1,"maximum":99}}}},"fee":{"type":"integer","minimum":0,"maximum":9007199254740991},"minutes":{"type":"integer","minimum":0,"maximum":1440},"dc":{"type":"integer","minimum":5,"maximum":40},"stat":{"type":"string","pattern":"^(STR|VIT|AGI|DEX|INT|LUK|CHA)(\\+(STR|VIT|AGI|DEX|INT|LUK|CHA)){0,2}$"},"station":{"$ref":"#/$defs/slug"},"known":{"type":"boolean","default":true},"teaches":{"type":"string","minLength":1,"maxLength":120}}},
    "unit":{"type":"object","additionalProperties":false,"required":["kind","class","statShare","poolShare","rounds"],"properties":{"kind":{"enum":["summon","pet"]},"class":{"$ref":"#/$defs/ref"},"statShare":{"type":"integer","minimum":10,"maximum":100},"poolShare":{"type":"integer","minimum":10,"maximum":100},"rounds":{"type":"integer","minimum":1,"maximum":60}}}
  }
}
```

| Entry point | Required result; all new except validatePack |
|---|---|
| `rulesV2Schema` | Frozen schema data, identical to the packaged schema artifact. |
| `normalizeRulesV2(raw,{packKey,constants})` | `{ok:true,manifest}` or Errors; raw JSON plus valid raw pack key/constants, normalize defaults/slug IDs/refs without mutation. |
| `expandRulesV2(manifest,content,constants)` | `{ok:true,resolved:ResolvedRules,hash:Hash}` or Errors; expand selected-parent graph and bind content, no writes. |
| `validateRulesV2(manifest,content,constants)` | `{ok:true,resolved,warnings}` or `{ok:false,errors:[{code,path,message}]}`. |
| `powerScore(form)` | `{ok:true,score:Count}` or Errors; P06 sum including unit12; no state reads/caller limits. |
| `generatePowerUp(form)` | `{ok:true,form:FormDef}` or Errors; clone validated parent, derive id=parent.id+'-g', step+1/origin generated/fromForm parent.id, apply P06, validate bounds/budget; parent step2 or invalid closure BAD_RULES. |
| Existing `validatePack(input,options)` | Envelope/safety plus registered v2 checker; existing signature SB `packs/validate.js:40`. |
| `exportRulesV2(document)` | `{ok:true,text:string,hash:Hash}` or Errors; full validated normalized document→canonical raw envelope, strip assigned wrapper fields and shorten same-pack refs. |

## 8. Death and return

PC death restores state/companions while retaining raw chat, with faded history and a waking
scene. The latest decision fixes the target: **START of the previous narrative day**, unless
a manual save is more recent, in which case use the most recent save. Death on day11 returns
to start day10; §11 records both. Current bookmarks create/open branches (SB rewind.js:231,
:269); RB returnInTime uses sdk.rewind at the fatal fight (RB return/index.js:76). Neither is
this retained-chat restore. There are no shipped return.save/load/checkpoint/clear/back or
sdk.rewindTo APIs at the pins.

Proposal (needs the user): **P13 — snapshot/participant mechanics and edge cases.** All APIs
in this section are new track E/NSD work, not permission for RB to draft other owners' state.
Clock-boundary markers are new host work too. New synchronous
`ctx.clockBoundary({minute:Minute,source:Source}) -> {cursor:Cursor,prefixHash:Hash}` is callable
only by SD clock commands (wrong owner/cause REFUSED, non-crossed boundary INVALID). SD emits
one marker per crossed midnight while its draft clock equals that boundary. The host captures
all transaction drafts **at that logical point**, including already-staged training session/fee,
not an arbitrary index in opsOf's domain-sorted diff. Markers/payloads are staged on the root
block, discarded with its failure/guard, and only become eligible after root commit. The async
coordinator obtains each participant's checkpoint **as of that marker's native event prefix**,
not its later live state, before publishing snapshot readiness. Re-read regenerates markers in
order from the saved seed. No native I/O occurs in the synchronous clock handler. This extra
logical-boundary metadata/participant prefix materialization is an E gate; current SB cannot
supply it. Restoring an in-progress paid training snapshot resumes its running session, without
charging again. A snapshot payload is `{schema:2,domains:Record<DomainName,Json>,storyClaims:Record<string,true>,
effectiveSettings:Record<string,Json>,domainVersions:Record<string,number>,participants:Participant[]}`.
Capture **every registered domain**, including director/atlas/chronicle/arc/checks, all RB
slices, inventory/scene, npc, death **and savepoints**; no hand-maintained five-domain allowlist.
Immutable payload bytes and native checkpoints live in a host archive outside replayed domains
(to avoid recursively embedding snapshots). Descriptor.payloadHash locates/verifies them.
Restore all captured slices absolutely, validate all registered validators and participant
schemas (historical choices/guards inside the payload are saved state, not handlers to rerun), then overlay the new epoch/current ReturnRecord and the selected target descriptor from the
archive (capture precedes inserting its own descriptor, so it may not be in its payload).
Snapshot.epoch records provenance: prior points at/before target remain eligible across the
new epoch only when restored ancestry/prefix hashes prove them; post-target points lose
eligibility. Repeated deaths may therefore use the same restored save without accepting a
faded future save. Do not require epoch equality as a substitute for ancestry. Story claims reset to the saved
set; host monotonic revision/receipt IDs, archive, restore audit and UI preferences stay outside
that restored payload. Saved effective rule settings are restored; current UI settings are not.
Newly registered domain absent from snapshot requires its owner's versioned default/migration
recorded in the manifest, otherwise SNAPSHOT_UNAVAILABLE. Never silently keep post-save data.

New host-local coordinator `sdk.timeline` exposes the following asynchronous methods. Public
UI may call make/forget/list/status/history only. Prepare/activate/abort/native methods require an
unforgeable host capability, never caller-supplied cause or an asserted prepared ID. All promises
resolve `{ok:true,...fields below}` or `{ok:false,code,message}`; no native I/O in synchronous
command handlers. E adds an SDK host-action adapter for sdk.command('savepoint.make',payload):
it reserves the immutable action/source/target, awaits timeline.make checkpoint preparation,
then atomically commits the descriptor/receipt if expectedHead still matches. Direct bus calls
to make refuse REFUSED; module async handlers are not introduced. On stale head discard the
uncommitted descriptor and preserve bytes only as an unreferenced cache. The public adapter
returns the same receipt envelope as §3. Internal savepoint.restore commits only a validated
prepared token, synchronously installing the host block after preparation.

| Method | Input → success fields | Refusal/authority |
|---|---|---|
| registerParticipant | `{module,schema,checkpoint,prepare,activate,abort,status,applyEvent?}` → `{module}` | Host registration callback only; duplicate CONFLICT, bad callbacks INVALID. |
| make | `{kind:'initial'|'manual'|'day-start',name?,target?:Cursor,day?:Day}` → `{snapshot:Snapshot}` | UI may manual only/current head; host boundary may others; stale cursor STALE, missing bytes SNAPSHOT_UNAVAILABLE. Public savepoint.make calls this, not a synchronous snapshot shortcut. |
| list / status | `{}` → `{points:Snapshot[]}` / `{state:'idle'|'pending'|'failed',return:Id|null,participants:Participant[]}` | Read-only, only eligible ancestry targets, ordered by target cursor. |
| prepare | `{snapshot:Id,deathEvents:Id[],expectedHead:Hash}` → `{prepared:RecordId,return:RecordId,manifestHash:Hash}` | Host authenticated sealed batch; hashes/availability/version checked, stale head STALE; emits durable prepared record. This produces §3's prepared ID. |
| activate | `{prepared:Id,expectedHead:Hash}` → `{return:Id,status:'complete'|'participants-pending'}` | Host only, once; commit SB absolute restore then activate participants. Unknown token NOT_FOUND; stale head aborts preparation. |
| abort | `{prepared:Id}` → `{status:'aborted'}` | Host only/precommit; idempotent; postcommit REFUSED (must finish recovery). |
| recover | `{}` → `{state:'idle'|'pending'|'failed',return:Id|null}` | Host startup/head-selection; resume committed work, abort stale uncommitted prepare. No clock/target reselection. |
| history | `{through?:Cursor}` → `{messages:[{sid,swipeKey,text,active:boolean}],faded:[{after:Cursor,through:Cursor}]}` | Host/UI read projection, ordered source messages including user messages; host gives projection-only msg_ identities
for messages without carrier IDs. No hidden facts. |
| nativeEvent | `{event:Id,participant:string,kind:'confirmed-death',npc:RecordId,expectedHead:Hash}` → `{event,checkpoint:Id,hash:Hash,ack:true}` | Host outbox only after code-confirmed death; unknown/mismatched native target REFUSED, stale head STALE; barrier until durable ack. |

Every native mutation (scan, manual dossier edit, meter/native synchronization and confirmed
death) records Source/prefix hash → immutable checkpoint in the coordinator journal before
exposing its new head. No snapshot-only participant can handle an arbitrary selected swipe.
New host-bound `timeline.nativeMutation({participant,source,expectedHead,prepare})`
returns `{ok:true,checkpoint:Id,hash:Hash}` or the common failure envelope. Only the registered
participant may call; prepare is an async local callback returning
`{before:Participant,after:Participant,prepared:Id}` with both checkpoints durable, without
exposing after. Host raises the barrier, checks expectedHead, persists its journal, calls that
participant’s activate/abort using this transaction’s host-assigned ID, then publishes the prefix
mapping. STALE cancels before activation; postactivation failure recovers to the journal
choice before unblocking. NSD scanner/manual editor/meter synchronization use this entry.
Participant history must support checkpoint lookup for each surviving source prefix; edits and
re-read rebuild that mapping before native scanners resume.

Participant callbacks (bound to module, no cross-owner draft rights):
`checkpoint({cursor,headHash}) -> {checkpoint:Id,hash:Hash,schema:number}` persists full native
state/history/evidence/identity map and applied death IDs;
`prepare({return:Id,checkpoint:Id,hash:Hash}) -> {prepared:Id,hash:Hash}` verifies bytes without
switching visible state; `activate({return:Id,prepared:Id}) -> {checkpoint:Id,hash:Hash}` switches
idempotently; `abort({return:Id,prepared:Id}) -> {aborted:true}` releases precommit work;
`status({return:Id}) -> {checkpoint:Id,hash:Hash,status:'prepared'|'active'|'aborted'}`.
Each callback resolves `{ok:true,...listed fields}` or the common failure envelope; unavailable bytes SNAPSHOT_UNAVAILABLE,
conflicting return/hash CONFLICT. NSD additionally supplies host-bound
`applyEvent({event,nativeKey,kind:'confirmed-death'}) -> {event,checkpoint,hash,ack:true}`;
no existing npc.adjust/set/refresh/milestone/tick can stand in for it (NSD storysuite-v2.js:75).
New `npc.identity({name}) -> {id:RecordId,nativeKey:string,name:Text80}|null` persists an np_
surrogate map in that checkpoint. Do not rename native keys or pass arbitrary native IDs as SB
id fields. Same event ID/meaning returns prior ack; conflicting meaning CONFLICT. RB records
confirmed outcome and durable outbox in its transaction; host applies native event and verifies
ack before exposing a consistent head. Unknown native identity holds death, never guesses.

Coordinator procedure:

1. Retain initial snapshot after character creation. At every SD clock advance crossing midnight,
   host splits at each boundary, installs that exact clock value, settles boundary expiry then
   checkpoints before subsequent actions. At day D, eligible automatic is start D−1; retain start D
   for the next day. Visible journal for the target day is attached later without changing payload.
   Multi-day jumps materialize each boundary using state before later actions; unset/midday-first
   clock has no invented earlier day. Proposed initial fallback is explicitly marked as such.
2. On a sealed lethal batch choose latest eligible target **before death** in active ancestry:
   previous-day start or more-recent manual. Manual wins exact cursor tie. Cursor order uses surviving
   carrier/block/op order, not revision alone; swipes and deleted saves lose eligibility. If no
   previous-day anchor exists, proposed initial fallback; missing saved bytes/participant holds
   SNAPSHOT_UNAVAILABLE, never substitutes another save. Proposed cap20 manual descriptors; at the limit make returns LIMITED. New UI host
   timeline.forget({snapshot:Id}) -> {ok:true,forgotten:Id} records carrier-bound loss of eligibility;
   unknown target NOT_FOUND, pinned active return REFUSED. It never deletes still-referenced
   payload/native bytes. No forget/replan may move the death target silently.
3. Prepare exact head/snapshot/participant hashes durably. Validate every slice; prepare NSD full
   native checkpoint. Stale head aborts precommit. Commit one authenticated SB restore block;
   apply saved state and claims absolutely, append durable ReturnRecord/new epoch and fade interval.
4. Activate each prepared native participant and verify hashes. Failure leaves participants-pending
   barrier; reload/retry completes from the durable journal. No partial success or living RB actor
   beside a dead dossier. Mark complete only after all acknowledgments, then one return.cue.
5. Swipe/delete/re-read changing the selected timeline invokes recover and switches NSD to the
   matching active checkpoint before scan/read/generation. Precommit cancellation restores the
   unchanged pre-prepare view; postcommit rollback uses another authenticated absolute selection,
   never inverse deltas or partial native abort. Death die/result are retained per §6.

Faded operation interval is exactly `(target,restore]`. For **text** exclusion, a target inside a
reply excludes that entire carrier from active history; saved visible scene/journal supplies the
replacement recap. Raw text stays readable. Boundary cursors between messages exclude only later
messages. All prompt assembly, extraction, journal facts, NPC scanning and native evidence readers
must use history's active messages and checkpoint, including their out-of-band paths; no direct
raw-chat scan may resurrect faded facts. Wake uses saved scene and permitted memory (default vague
déjà vu, setting none, pack full); full memory grants no retained inventory/XP/objective proof.

`return.point` adds snapshot/target to its old index/beforeRev/place/fight projection; fight may be
null for narrative death. `return.status` retains dead/point and adds pending/memory/lastReturn.
Old `{fight,place}` return.cue and branch rewind stay legacy-only. New rules-v2 callers are
return card, returnInTime adapter and host completion; all must migrate together (appendix).
Companion death is permanent on the active timeline; PC return restores its saved living state.

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
| SD quest-only mechanics; new RB `src/v2/quests/`; RB item slot planners; NSD preset audit | A | Extraction map below; lead applies shared registration/settings edits. |
| RB new `src/v2/rules/`, `progress/`, `training/`, `death/`; party/combat sheet consumers; SD checks/tiers; NSD restore participant | B | Name one owner per subfolder; SB/SD/NSD changes are reviewed with their owners. |
| RB `src/v2/screens/`, `board/`, creation/progression UI components | C | Query projections/commands only; no rule duplication. Coordinate creation engine files with B. |
| SB store/persist/commands/sdk/registry/turn/rewind, pack host integration, new testkit/matrix | E | E owns host gates below; D supplies pure checker/schema. |
| SB new `src/v2/packs/rules-v2.js`, schema artifact, `tests/v2/studio/` | D, pure schema/checker | E integrates host validator dispatch; no overlapping edits. |
| Separate `Story_studio` repository: engine/export/undo/fixtures/docs | D | Later split (log 798) wins over earlier all-in-SB plan. Pin implementation commit at integration. |
| Module definitions/entry points, registration, settings/features, shared testkit/matrix, manifests, release notes | Lead | Tracks deliver patches; lead alone integrates shared files. |

RB/SD `src/v2/module.js`, SB registry/domain aggregator/pack kind tables, feature/setting maps
and NSD `src/storysuite-v2.js` stay lead-owned even when a track needs a small edit. Assignments below are fixed: A owns quest extraction and item command/slot routing; B owns
party/sheets/pools, combat setup/view/interpreter, progress/training/death and SD checks/danger;
C owns screens/board/creation UI; D owns pure schema/export; E owns host internals. A supplies
item rules to B through Inputs; B does not edit A item command files. A identifies no remaining
NSD preset runtime to move: NSD already owns it, so that seam is an audit/no-op unless code is
identified. B owns new NSD checkpoint/death participant files; lead applies its registration
patch. Shared definitions/settings stay lead-integrated from reviewed patches, without writers
editing each other’s folders.

### E. Story Block host changes — merges first

These P01/P12/P13/P22 host extensions are prerequisites, not work hidden in B. E implements
and tests their public contracts before downstream wiring; A–D may build pure fixtures in parallel.

| Change / concrete API and source to extend | Required tests | Tracks waiting |
|---|---|---|
| Per-op-block metadata in record.spans, ctx.replayGuard and hooks.replayGuard (§6); extract claim ops and gate claims with ops; store.js:344 / persist.js:16 / commands.js:447 | Invalid guard removes payout+closure+claim together, two instance1 quests, nested cross-owner rollback, old blocks isolated | A settlement, B progression, C action wiring |
| persist.trimReceipts keeps data.v2 at >200 carriers; source swipeKey/block/action/evidence IDs; prefix-content hashes and pins (§6) | Trim/reload retains results/guards/seed; deleted earlier swipe shifts index but identity stable; edited same SID invalidates payload hash | A/B, C replay fixtures |
| chain stops first invalid covers/hash and never falls back across gap; replaceStory step uses {replayed:true}; atomic suffix reconciler (§6) | Delete between three checkpoints; change clock before zero-credit attempt; re-read missing target; replacement system claims once; full recovery never negative-delta heals | A/B, C |
| sdk.preflight + requires.peers enforcement + dormant/ready/restore-pending dispatch (§2), before ensureModules | Old party untouched before registration; missing/late/off/wrong-version peer; cyclic peers; dormant hooks do not block SB/NSD generation; no duplicate init | A/B/C activation |
| sdk.timeline methods/participant registry, internal savepoint.restore host block, all-domain payload/version manifest (§8) | Enumerate every registry domain incl. new test domain; absolute restore of time/wallet/pools/XP/gear/combat/training/npc; unauthorized/forged token; stale head; missing native bytes; crash at each phase | B/NSD, C return wiring |
| Active-history projection + participant head-selection barrier; ctx.clockBoundary logical markers inside SD clock transactions (§8) | Intra-reply exclusion, midnight/multiday anchors, new day/removed time, faded extraction/journal/native scans, swipe/delete restore and reload before scans | B, SD/NSD, C |
| SB inventory policy delegation: item definition ref, eight-slot legality in every storage/capture/equipOn path; purse.currency/moneyPolicy fallback (§3/P07/P14) | SB alone still works, direct equip cannot bypass RB, 2H/offhand/swap, invalid override fallback and integer balance unchanged | A item routing, B trade/craft, C |
| Register content.rules in CONTENT_KINDS/OPTIONAL_KINDS (limits.js:27/:30); normalize via records(name+slug) at validate.js:185, invoke D checker before wrapper; add lookup/count/installed classification and rb-rules-v2 capability | Old host UNKNOWN_KIND; supplied missing capability MISSING_CAPABILITY; valid small graph; malformed nested field; old packs unchanged; name+slug ID wrapping | D import, A/B pack activation |
| Validator opt-in scope: preserve openRecord creatures/quests without manifest (:95/:102); with schema2 validate their owned definitions plus shop/recipe refs; keep strict old items/skills; normalize nested slug IDs/refs (§7) | Legacy moves/template/difficulty/detail packs pass unchanged; schema2 rejects conflicts, numeric branch-only copy, graph mismatch, unknown fields/refs, unsafe/oversized content; complete advanced graph 24/12 | A/B adapters, D content |
| Shared testkit/matrix runner and versioned vendor sync (§2) | Every positive/negative combination with real modules and new host tests; synchronize RB's second QA vendor too | All integration |

No checkRecordHead exemption or checkCreature/checkQuest patch is needed: those functions do
not exist at the pinned SB head. Nested branches live in rules[0], not a new content.branches
kind. Every host validator change is in this table; no envelope widening or relaxed SB ID regex.

### A: extraction map

| Existing source | Destination/seam | Retire or redirect |
|---|---|---|
| SD `src/v2/quests/index.js:1041`, parse/progress/ranks | RB `src/v2/quests/`; retain quest.take/abandon/finish/payOwed and progress/details/ranks/owed queries | Remove SD registration and afterCapture payOwedHook (`index.js:1064`); transfer director.retriable and quest.board adapters to RB. One reward transaction. |
| SD `tracker/quest-lines.js:127`, `:335` | RB quest met/turn-in/settlement adapter using SD-owned thread writers | Remove SD quest.settle registration and beforeGenerate/afterCapture payout paths. Keep generic thread capture/journal. |
| SD `tracker/capture.js:269`, `tracker/index.js:20` quest branch | RB owns quest capture; SD owns accepted generic thread/link/close | Remove RPG reward/ready/target parsing in SD. The same thread carries its rpg extension; no second ledger. |
| RB `combat/quest.js`, `party/commands.js:654`; SD reward calls `quests/index.js:418` | RB objective events + one party.grantXp/SB wallet settlement | Retire double fight/quest XP and coin hooks; preserve story-credit/owed deduplication. |
| SB `inventory.js:1227`, `:1768`, money.js | Stay SB; add rules.moneyPolicy/purse.currency delegation | **No money move** after log 796. Keep SB-alone budgeting fallback. |
| RB `items/commands.js:285`, `queries.js:185`, rules.js:38; SB inventory.js:1039 | RB eight-slot planner; E installs SB equipped record/definition-ID delegation | Replace six-slot limits consistently in rules, packs, prompt and UI; retain stack/to, add targetSlot. |
| NSD `src/npc-meters-presets.js:139`, `src/storysuite-v2.js:368`; SB meterPresets checker | NSD remains runtime preset owner; packs retain meterPresets kind | No preset engine to invent in RB. Move only any identified old RPG preset glue; do not displace existing NSD catalog. |

A supplies pure seams: `planQuest(Quest,Inputs) -> {ready:boolean,blocked:Text240[],reward:Reward}`;
`planEquip(ItemRule,Inputs,actor,stack,slot) -> {ok:true,unequip:Id[],equip:{stack:Id,slot:Slot}}|Failure`.
These new functions perform no writes/narration. Explicit fixtures cover aliases and retired
payout hooks. For SD standalone, generic accepted goals/threads remain usable without RPG quests.

### B: rules and return core

Deliver §4 validators, §5 constants/formulas/transitions/effect interpreter, pure eligibility
`canPromote/canStep/creditUse/planTraining/resolveLethal`, §6 guards/counters/scratch, and §8
NSD restore participant against E’s host protocol. Pure functions take typed state + Inputs and return plan/Failure;
no hidden clock/pack access. First slice: 5/5 cap, promotion, class swap and deleted-prerequisite
replay. Include immutable generated forms and active-history filtering. Retained combat fixture
outcomes must match pins through new adapters. No formula is deferred for another track to invent.

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

### Golden fixture seed and end-to-end trace

These executable constructors define complete changed-contract records, rather than abbreviated
actor/snapshot descriptions. `H` is the SHA-256 of the normalized fixture pack+schema+constants;
`payloadHash`/lineage are recomputed by E from the full host payload/prefix, not arbitrary IDs.
Runtime fixtures add unchanged domain slices from real module initializers, then host-snapshot
**all** registry entries; never hand-construct only five slices. NSD uses synthetic native data.

```js
function smallRulesPack() {
  const classes=[], skills=[], branches=[];
  for (let tier=0;tier<4;tier++) {
    const names=[0,1,2].map(n=>`s${tier}${n}`);
    classes.push({slug:`c${tier}`,name:`Class ${tier}`,tier,parent:tier?`c${tier-1}`:null,skills:names});
    for (const slug of names) {
      skills.push({slug,name:slug,base:{type:'physical',stat:'STR',unit:null,
        cost:{mp:0,sp:1,cooldown:0},effects:[{op:'damage',target:'one',power:20*(tier+1),element:'none',damageType:'physical'}]}});
      if (tier!==3) continue; // no starter branching
      const base=`${slug}-base`;
      for (const parent of [base,...['g','a','b'].map(c=>`${base}-${c}`)]) {
        const step=parent===base?1:2;
        for (const choice of ['a','b']) {
          const transforms=step===1
            ? [{op:'set-element',at:0,value:choice==='a'?'fire':'ice'}]
            : [choice==='a'?{op:'set-target',at:0,value:'all'}:{op:'set-element',at:0,value:'lightning'}];
          branches.push({slug:`${parent}-${choice}`,name:`${parent}-${choice}`,skill:slug,fromForm:parent,step,choice,transforms});
        }
      }
    }
  }
  return {id:'fixture',version:'2.0.0',name:'Fixture',requires:{storyBlock:'^2',capabilities:['rb-rules-v2']},
    content:{rules:[{slug:'rules',name:'Fixture rules',schema:2,classes,skills,branches,itemRules:[],trainers:[]}],
      items:[],creatures:[],shops:[],recipes:[],quests:[],places:[{slug:'haven',name:'Haven',x:0,y:0},{slug:'mill',name:'Mill',x:1,y:0}]}};
}
function goldenSeed(H,payloadHash,lineage) {
  const source={sid:'sr_00000010',swipeKey:'sw_00000010',evidence:'ev_00000010',ordinal:0};
  const cursor={sid:source.sid,swipeKey:source.swipeKey,block:'bl_00000010',op:0,rev:10};
  const actor={id:'ac_00000001',name:'Astra',kind:'pc',npc:null,npcId:null,role:'traveller',portrait:null,
    background:'',origin:{race:null,talents:[]},tags:[],createdAtMinute:14400,growth:'manual',
    control:'player',life:'alive',level:1,earned:0,levelSteps:{},points:0,
    stats:{STR:15,VIT:5,AGI:5,DEX:5,INT:5,LUK:5,CHA:5},
    hp:{cur:74,max:74},mp:{cur:32,max:32},sp:{cur:40,max:40},conditions:{},
    class:'pack.fixture/c0',classPath:['pack.fixture/c0'],
    skills:[0,1,2].map(n=>({skill:`pack.fixture/s0${n}`,form:`pack.fixture/s0${n}-base`,steps:0})),temporary:null};
  const friend={...structuredClone(actor),id:'ac_00000002',name:'Lyra',kind:'companion',
    npc:'Lyra',npcId:'np_00000001',control:'auto'};
  const quest={id:'th_job00001',template:'story/walk',instance:1,title:'Visit the mill',
    category:'side',giver:null,turnInPlace:'pack.fixture/haven',requirements:[],
    objectives:[{id:'ob_00000001',kind:'visit',place:'pack.fixture/mill'}],evidence:{},
    reward:{coin:30,xp:25,items:[]},storyCredit:{coin:0,claims:[]},acceptedAt:null,acceptedCursor:null,
    deadline:null,repeat:null,chain:null,state:'offered',settlement:null};
  const snapshot={id:'sp_00000010',capturedAtRev:10,label:'Day 10 start',kind:'day-start',name:'Day 10 start',
    epoch:'ep_00000001',target:cursor,eligibleFrom:cursor,minute:14400,day:10,
    scene:{place:'pack.fixture/haven',text:'Haven at dawn'},journal:null,payloadHash,
    participants:[],lineage,available:true};
  return {H,source,cursor,actor,friend,quest,snapshot,
    party:{rulesVersion:2,pc:actor.id,order:[actor.id,friend.id],reserve:[],temporary:[],
      actors:{[actor.id]:actor,[friend.id]:friend},offers:{},rested:null},
    progress:{rulesVersion:2,choices:{}},
    training:{rulesVersion:2,requests:{},attempts:{},sessions:{},formMastery:{},replyUse:{},dayUse:{}},
    death:{rulesVersion:2,events:{},pending:[],batches:{},memory:'deja-vu',lastReturn:null}};
}
```

Query fixtures are deterministic projections of that seed. The following constructor supplies
full sheet/progress/quest/return outputs and action payloads for C's critical states without B.
Other cases apply the explicit C01–C14 mutations above to these builders; pinned combat views
come from the retained sessionView shape in the appendix, not invented session fields.

```js
function queryFixtures(seed) {
  const {H,actor,quest,cursor}=seed, ref=x=>`pack.fixture/${x}`;
  const slots=['weapon','offhand','head','body','legs','feet','accessory-1','accessory-2'];
  const skill=(key,form=`${key}-base`,uses=35,steps=0)=>({skill:ref(key),form:ref(form),name:key,
    mastery:uses>=35?5:0,uses,nextAt:uses>=35?null:1,steps,
    formMastery:{[ref(form)]:{uses,mastery:uses>=35?5:0}}});
  const sheet={id:actor.id,name:actor.name,role:actor.role,portrait:null,background:'',origin:actor.origin,
    kind:'pc',npcId:null,control:'player',life:'alive',level:10,xp:0,xpToNext:100,stats:actor.stats,
    unspent:36,hp:{cur:110,max:110},mp:{cur:50,max:50},sp:{cur:58,max:58},conditions:[],
    class:ref('c0'),tier:0,skills:[0,1,2].map(n=>skill(`s0${n}`)),
    gear:Object.fromEntries(slots.map(k=>[k,null]))};
  const progress={actor:actor.id,level:10,class:ref('c0'),tier:0,
    checklist:sheet.skills.map(s=>({skill:s.skill,form:s.form,mastery:s.mastery,needed:5})),
    promotions:[{milestone:10,eligible:true,choices:[ref('c1')],why:[]}],pathways:[]};
  const restoreAt={sid:'sr_00000015',swipeKey:'sw_00000015',block:'bl_00000015',op:0,rev:15};
  const lastReturn={id:'rt_00000015',deathEvents:['de_00000015'],snapshot:'sp_00000010',target:cursor,
    restoreAt,oldEpoch:'ep_00000001',newEpoch:'ep_00000002',faded:{after:cursor,through:restoreAt},
    memory:'deja-vu',cue:'cu_00000015',status:'complete'};
  return {
    C02:{queries:{'rules.sheet':sheet,'rules.progress':progress},command:['class.choose',
      {actor:actor.id,milestone:10,class:ref('c1'),expectedClass:ref('c0'),rulesHash:H}]},
    C03:{queries:{'rules.sheet':sheet},attempt:{expectedAward:0,reason:'mastered'}},
    C05:{queries:{'rules.progress':{...progress,level:50,class:ref('c3'),tier:3,promotions:[],
      checklist:[0,1,2].map(n=>({skill:ref(`s3${n}`),form:ref(`s3${n}-base${n===0?'-a':''}`),mastery:5,needed:5})),
      pathways:[{milestone:50,eligible:true,skills:[0,1,2].map(n=>{const f=`s3${n}-base${n===0?'-a':''}`;
        return {skill:ref(`s3${n}`),fromForm:ref(f),step:n===0?2:1,options:['g','a','b'].map(c=>ref(`${f}-${c}`))};}),why:[]}]}},
      command:['path.choose',{actor:actor.id,milestone:50,skill:ref('s30'),fromForm:ref('s30-base-a'),option:ref('s30-base-a-g'),rulesHash:H}]},
    C07:{queries:{'director.time':{minutes:7200,text:'Day 5 start'},'rules.quests':[{...quest,state:'expired',acceptedAt:7100,
      acceptedCursor:{sid:'sr_00000007',swipeKey:'sw_00000007',block:'bl_00000007',op:0,rev:7},
      deadline:7200,settlement:{id:'st_00000007',source:seed.source,outcome:'expired',coinPaid:0,xpPaid:0,itemsPaid:[],
        claim:'rb:ep_00000001:quest:th_job00001:1:settled'},ready:false,blocked:['Expired'],remainingMinutes:0}]}},
    C12:{queries:{'return.status':{dead:false,point:null,pending:false,memory:'deja-vu',lastReturn}},
      command:['return.cue',{return:lastReturn.id}],expectedCaller:'host-complete-token'},
    C14:{result:{ok:false,code:'REPLAY_PREREQUISITE',message:'The earlier prerequisite was removed.'}}
  };
}
```

Constructor output is input to normal initialization: resolve all pack refs, initialize zero
formMastery entries from the actor's three forms, record milestone0 Choice with empty Guard
(current epoch, minLevel0, lists[], all other optional checks null), and register story/walk
QuestTemplate equal to quest's definition fields with durationMinutes:null. Host creates the
thread through SD: `{id:'th_job00001',kind:'quest',key:'Visit the mill',summary:'Visit the mill',
fields:{},status:'active',offer:true,taken:null,ended:null,target:null,reward:null,rev:11,rpg:quest}`;
index director.keys with SD's canonical key. No separate q_job record. Snapshot is captured
before this thread appears. NSD variant replaces participants[] with its real checkpoint/hash
and records np_00000001↔synthetic native key. Test snapshot restore enumerates **all** slices.

| Source cursor/input | Expected state/record |
|---|---|
| sr_00000010: day10 start minute14400 at pack.fixture/haven, coin100 | Snapshot sp_00000010: both actors alive, coin100, XP0, no thread/payout claim. |
| sr_00000011: visible th_job00001 offer | quest.take {id:'th_job00001'} accepts extension instance1; coin100. |
| sr_00000012: visit pack.fixture/mill, then giver/settlement in Haven | quest.finish {id:'th_job00001'} pays coin30/XP25 once, closes same thread/journal; retry unchanged. |
| sr_00000013: day11 boundary minute15840 | Eligible automatic target is sp_00000010, not day11. Attach visible day10 recap without altering payload. |
| sr_00000014: companion lethal ev_00000014, sealed db_00000014, die2/mod0/DC15 | RB death + NSD confirmed-death durable ack; target snapshot unchanged. |
| sr_00000015: PC/all durable down, summons standing | Single wipe db_00000015; no recent manual → sp_00000010. |
| sr_00000015: authenticated host restoration | Time14400/Haven/coin100/XP0; thread absent, training/gear/combat/effects/native state as saved; both alive. Old reward claims gone; monotonic revision/new epoch/audit retained. |
| sr_00000016: waking passage | Exactly one cue; vague déjà vu; faded text/ops excluded from active prompt/extraction/native scanning, raw messages still readable. |

Variants: manual sp_00000012 after reward outranks automatic and retains coin130/done on death;
removing its carrier removes eligibility. Delete reward carrier: payout/closure/claim vanish
together. Two thread IDs instance1 never collide. Re-read clock across midnight or cap exhaustion,
including a zero-award attempt; >200-carrier trim; shifted swipe index; deletion between three
checkpoints; missing target/checkpoint; native failure and crash after every prepare/commit/ack;
swipe away from restore before native scanning. C01–C14 are mutations of this seed with exact
query/command/receipt assertions, including error codes, not screenshot-only descriptions.

All tracks need lead-owned registration/settings, exact integration pins, error/receipt fixtures
and this scenario passing. Required merge order: phase0 freeze → **E host gates** → A → B → C wiring →
integration/matrix → user test. D’s pure schema may proceed in parallel; host import waits for E. D's schema gates content/import/UI fixtures; balancing follows the
approved formulas, not a divergent validator.

## 11. Decided: the user's answers

| Retained decision | Log lines, later correction where relevant |
|---|---|
| SB hub/inventory; SD genre-neutral world/clock/threads/checks; RB RPG rules; NSD relationships; item defs RB/pack, stacks SB | 748, 752–756, 773 |
| Save points stay SB | 752 replaces initial move in 748 |
| Purse stays SB and works without RB; RB prices/rewards/sinks and optional currency override | 796 replaces 795(1) and money move in 778 |
| Fresh start; fixed structure, generated content validated for lore/area; standard pack Studio baseline | 749–750, 755 |
| Cap99; classes at 0/10/20/30; always exactly three skills; class change swaps all three for stronger new ones, nothing inherited | 758, 800 replaces inherited/active split in 748 |
| Promotion needs level and three 5/5; combat/narrative/training uses, paid SD time/events, reply/day caps, XP continues, Party checklist | 759; new skills 0/5 is implication recorded at 800; form resets P02, mastery schedule P19 |
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
| Manual saves plus automatic target at the **START of the previous narrative day** (death day11→start day10), tied to journal | 795(2), latest USER save correction809; replaces danger-point saves775 |
| If a manual save is more recent than the automatic one, death returns to the most recent save | Latest USER save correction809 and this revision request |
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
| P02 | Approve level1 after basic pick, base5/start10/4 points per level/cap99/default100 XP and new-form0/5? | Yes; use resolved xpPerLevel and LevelStep.cost. |
| P03 | Approve shared 2/10 skill and 6/30 actor reply/day caps, 60-minute/two-use training and recorded 10% interruption/no-refund policy? | Yes. |
| P04 | Approve oldest milestone first, free eligible advanced-skill choice, 1..40 classes/up to six children, optional display-only replaces? | Yes; no auto-picks/inheritance. |
| P05 | Approve tiers0..9, place→region→world fallback, unknown-tier hold, foe ceiling and rarity table? | Yes. |
| P06 | Approve typed-effect maths, 12/24/36/48 budgets, +12/step and deterministic power-up transform? | Yes; validate generated closure. |
| P07 | Approve machine slot IDs, targetSlot/swap, dual-wield bonuses and active-member carry policy? | Yes; one SB record per piece. |
| P08 | Approve expiry at now>=due before settlement, atomic reward/closure, overweight hold and repeat/chain policy? | Yes. |
| P09 | Approve standalone SD actor/check policy and one optional RB/NSD contribution? | Yes; preserve topic skill/talent/item/effect/burden contributions in RB adapter; no mandatory party lookup. |
| P10 | Approve DC15 VIT lethal check, 1HP/24-hour/−2 injury and simultaneous-event batching? | Yes. |
| P11 | Approve roster commands, excess recruits in reserve, six temporary units, fight-end dismissal, and reserves/temporary units excluded from wipe rescue? | Yes. |
| P12 | Approve prefix guards deactivating invalid spans and clock-dependent settlement replanning after edits/deletes? | Yes; no automatic replacement choices. |
| P13 | Approve initial fallback when no previous-day anchor, skipped-day anchors, cap20, tie/ancestry order, full host/native protocol and text exclusion? | Yes; latest save decisions stay fixed; hold missing bytes. |
| P14 | Approve RB currency precedence through SB formatting and level-based credit/debit caps without balance conversion? | Yes. |
| P15 | First release normal-only or include easy/hard now? Approve prompt cap500..8000/default2000 alongside it? | Normal-only and stated cap. |
| P16 | Replace public pools with lost-only or retain shipped {cur,max} plus private loss bookkeeping? | Retain shipped public shape; every reset absolute. |
| P17 | Add a separate quest domain or retain director.threads as single store? | Retain thread.rpg extension; SD writes storage, RB computes mechanics. |
| P18 | Change party.grantXp payload/difficulty ownership? | No; retain shipped variants and RB difficulty calculation, including SD caller. |
| P19 | Approve cumulative [1,5,12,22,35] mastery and factor1+.1*mastery? | Yes; explicit replacement for shipped incremental schedule, per-form history retained. |
| P20 | Permit one-credit revisit of an unlocked form? | No; permanent paths/no respec, retain archive only for replay/views. |
| P21 | Add 15% SP wave recovery? | No; retain no wave heal; defend recovery unchanged. |
| P22 | Approve preflight/peer semver and dormant/ready/restore-pending host lifecycle? | Yes; E implements before downstream activation. |
