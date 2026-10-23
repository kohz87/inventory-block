# RB phase 0 API appendix

Read with [the contract](RB_PHASE0.md). These are **existing APIs at the four reference commits
in §2**, not invented families. A transfer keeps the shipped name once; a new adapter/argument
is identified below. Paths are relative to the named repository; links point to the inspected
files. Optional arguments retain current defaults unless the contract explicitly replaces them.
Existing function implementations/validators remain the source for fields omitted from compact
projections here. No wildcard below stands in for an unlisted retained API.

### SB registration, dispatch and replay

| Existing surface | Evidence and constraint |
|---|---|
| Module fields | [registry.js:43](/tmp/p0v2/Story_block/src/v2/registry.js:43): id, name, version, description, requires, domains, commands, queries, capture, context, hooks, settings, tabs, screens, widgets, features, cards. No invented module-level registration key. |
| `sdk.registerModule`, `sdk.command`, `sdk.query`, `sdk.view` | [sdk.js:300](/tmp/p0v2/Story_block/src/v2/sdk.js:300), [sdk.js:313](/tmp/p0v2/Story_block/src/v2/sdk.js:313), [sdk.js:323](/tmp/p0v2/Story_block/src/v2/sdk.js:323), [sdk.js:217](/tmp/p0v2/Story_block/src/v2/sdk.js:217). Public commands are UI actions; views contain frozen state and query access. |
| `ctx.query`, `ctx.call`, `ctx.draft`, `ctx.claim`, `ctx.absolute`, `ctx.time` | [commands.js:234](/tmp/p0v2/Story_block/src/v2/commands.js:234), [commands.js:227](/tmp/p0v2/Story_block/src/v2/commands.js:227), [commands.js:267](/tmp/p0v2/Story_block/src/v2/commands.js:267), [commands.js:286](/tmp/p0v2/Story_block/src/v2/commands.js:286), [commands.js:294](/tmp/p0v2/Story_block/src/v2/commands.js:294), [commands.js:334](/tmp/p0v2/Story_block/src/v2/commands.js:334). Nested commands share transaction. Drafts remain owner-scoped. Time reads director.time.minutes. |
| Stored operations and UI attachment | [store.js:3](/tmp/p0v2/Story_block/src/v2/store.js:3): replay does not call handlers; UI ops follow their carrier. Guard-aware replay and absolute multi-owner restoration are new contract work. |
| Receipts / failures / replan | [commands.js:351](/tmp/p0v2/Story_block/src/v2/commands.js:351), [commands.js:467](/tmp/p0v2/Story_block/src/v2/commands.js:467): summary/narrate/data, id/type/module/cause/seed/rev, optional system replan payload; failure `{ok:false,code,message}`. |
| Cards | [reply-cards.js:1](/tmp/p0v2/Story_block/src/v2/reply-cards.js:1): cards[id].for(state,message,ctx); tone/icon/title/text, up to four rows/three actions, command+payload or open. Later is viewer state, not save state. |
| Tab/screen `active(state,ctx)` | [view/screens.js:102](/tmp/p0v2/Story_block/src/v2/view/screens.js:102): `{on,badge?}`; retain active Fight behavior. |

### RB combat and bestiary

Registered at [combat/index.js:952](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:952).
All names remain RB-owned. v2 sheet/skills/temporary-unit adapters are new; engine stays.

| Command | Existing payload and behavior | Definition |
|---|---|---|
| `combat.start` | `{offer}` → create fight/session and seeded setup | [index.js:468](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:468) |
| `combat.act` | `{action:{type,target?,skill?,item?,actor?},session?,board?,logLength?}` → player action, then automatic turns until next choice; action types attack/skill/item/defend/flee/parley/auto | [index.js:549](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:549), [cleanAction:143](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:143) |
| `combat.flee` | `{session?,board?,logLength?}`; same stale-view checks | [index.js:560](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:560) |
| `combat.end` | `{session?}`; settle ended fight exactly once, pools/uses/XP/loot | [index.js:580](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:580) |
| `combat.dismiss` | `{offer}`; decline offer | [index.js:773](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:773) |
| `combat.fold` | `{rev?}`; system only | [index.js:742](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:742) |

| Query | Existing projection | Definition |
|---|---|---|
| `combat.offers({})` | Offer array with text/card | [index.js:962](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:962) |
| `combat.session({})` | Null or id/status/stakes/round/place/combatants/order/turn/actions/log/logLength/board | [index.js:968](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:968), [view.js:140](/tmp/p0v2/rpg_battle/src/v2/combat/view.js:140) |
| `combat.last({})` | Last result plus folded/fresh | [index.js:734](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:734) |
| `combat.foesBeaten({sinceRev?})` | `[{rev,foes:[{name,count}],won}]` | [index.js:933](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:933) |
| `bestiary.creatures({})` | `[{name,level,template,look}]` | [index.js:974](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:974) |

Pinned math: [rules.js:11](/tmp/p0v2/rpg_battle/src/rules.js:11) default constants;
[rules.js:316](/tmp/p0v2/rpg_battle/src/rules.js:316) pools/derive/check/XP/hit/mitigation;
[rules.js:450](/tmp/p0v2/rpg_battle/src/rules.js:450) flee/parley/rarity budgets;
[combat.js:874](/tmp/p0v2/rpg_battle/src/combat.js:874) startFight;
[combat.js:914](/tmp/p0v2/rpg_battle/src/combat.js:914) availableActions;
[combat.js:946](/tmp/p0v2/rpg_battle/src/combat.js:946) act;
[combat.js:1013](/tmp/p0v2/rpg_battle/src/combat.js:1013) replay;
[combat.js:1044](/tmp/p0v2/rpg_battle/src/combat.js:1044) foeXpWorth;
[combat.js:1056](/tmp/p0v2/rpg_battle/src/combat.js:1056) summarize.
These are executable retained behavior, not permission to change attack math through UI work.

### RB items, equipment and wear

Registration: [items/index.js:57](/tmp/p0v2/rpg_battle/src/v2/items/index.js:57).

| Command | Existing payload / restrictions | Definition |
|---|---|---|
| `item.use` | `{stack,target?}`; one dose, default PC; battle items go through fight action | [commands.js:90](/tmp/p0v2/rpg_battle/src/v2/items/commands.js:90) |
| `item.equip` | `{stack,to?,actor?}`; to equips on another member, actor validates current wearer. New targetSlot is contract extension. | [commands.js:285](/tmp/p0v2/rpg_battle/src/v2/items/commands.js:285) |
| `item.unequip` | `{stack}`; item stays owned | [commands.js:362](/tmp/p0v2/rpg_battle/src/v2/items/commands.js:362) |
| `item.give` | `{stack,to,qty?}`; default qty1 | [commands.js:377](/tmp/p0v2/rpg_battle/src/v2/items/commands.js:377) |
| `item.wear` | `{name|stack,wear:'scuff'|'tear'|'ruin',why?,story:true}`; validated story word, no arbitrary damage number | [wear.js:8](/tmp/p0v2/rpg_battle/src/v2/items/wear.js:8) |
| `item.fightWear` | `{fight,members:[{actor,taken,maxHp}]}`; combat-end internal settlement | [items/index.js:64](/tmp/p0v2/rpg_battle/src/v2/items/index.js:64), [wear.js:129](/tmp/p0v2/rpg_battle/src/v2/items/wear.js:129) |

| Query | Existing projection | Definition |
|---|---|---|
| `items.usable({actor?})` | Usable held consumables with target help information | [items/index.js:68](/tmp/p0v2/rpg_battle/src/v2/items/index.js:68) |
| `items.useOn({})` | Stack → eligible `{id,name}` target array; empty during fight | [queries.js:47](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:47) |
| `items.gear({actor?})` | `{actor,level,counted,unused,bonuses}`; derived from SB stacks, includes wear/refine | [queries.js:61](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:61) |
| `items.carry({owner?,add?,move?,settings?})` | Overview on/size/people/bag/load/capacity, or addition plan ok/on/weight/owner/load/capacity/partyLoad/partyCapacity/message | [queries.js:155](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:155) |
| `items.condition({stack})` | Null or stack/band/cur/max/refine/name/factor | [queries.js:129](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:129) |
| `items.slots({})` | **Today only `{accessory,worn}`**, not an eight-slot descriptor. Contract adds a v2 slot projection without removing these compatibility counts. | [queries.js:187](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:187) |
| `items.canWear({actor,stack|defId})` | `{ok,why?}`; new slot/requirements rules extend this same query | [queries.js:197](/tmp/p0v2/rpg_battle/src/v2/items/queries.js:197) |

Existing six-slot rules: weapon/offhand/armour/worn/two accessories; 2H tag. Sources:
[rules.js:38](/tmp/p0v2/rpg_battle/src/rules.js:38),
[items/commands.js:319](/tmp/p0v2/rpg_battle/src/v2/items/commands.js:319).
New eight-slot IDs and target argument are explicitly §5 P07, not a claim about current code.
Carry weights/capacity: [carry.js:7](/tmp/p0v2/rpg_battle/src/v2/items/carry.js:7).
Wear/refinement lives in RB gear, not SB equipped records: [wear.js:19](/tmp/p0v2/rpg_battle/src/v2/items/wear.js:19).

### RB trade and crafting

| Command | Existing payload | Definition |
|---|---|---|
| `trade.buy` | `{shop,def,qty}` | [trade/index.js:124](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:124) |
| `trade.sell` | `{stack,qty,kind?,who?}` | [trade/index.js:111](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:111) |
| `trade.repair` | `{stack,at?}` | [trade/index.js:109](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:109), [repair.js:104](/tmp/p0v2/rpg_battle/src/v2/trade/repair.js:104) |
| `trade.refine` | `{stack,at?,materials?}` | [trade/index.js:110](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:110), [repair.js:185](/tmp/p0v2/rpg_battle/src/v2/trade/repair.js:185) |
| `craft.commission` | `{piece,materials:[{stack,qty}],crafter}` | [trade/index.js:152](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:152) |
| `craft.collect` | `{order}`; claim once, ready time, market, carry checks | [trade/index.js:176](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:176) |
| `craft.learn` | `{name,who?,from?,makes?,with?,craft?,...}` validated recipe capture fields | [craft/commands.js:116](/tmp/p0v2/rpg_battle/src/v2/craft/commands.js:116) |
| `craft.forget` | `{name,who?}` | [craft/commands.js:187](/tmp/p0v2/rpg_battle/src/v2/craft/commands.js:187) |
| `craft.make` | `{name,by?|who?,with?,at?,roll?,result?}` validated capture request | [craft/commands.js:284](/tmp/p0v2/rpg_battle/src/v2/craft/commands.js:284) |

learn/forget/make are story/internal calls, not new UI freebies: guarded registration
[craft/commands.js:437](/tmp/p0v2/rpg_battle/src/v2/craft/commands.js:437).

| Query | Existing projection | Definition |
|---|---|---|
| `trade.market({})` | open/by/place/tier/buy/sell/level/day | [trade/index.js:205](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:205) |
| `trade.stock({kind?})` | shop/kind/day/open/items with def/price/note; default general | [trade/index.js:207](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:207) |
| `trade.quote({type,...command payload})` | Pure plan or failure; buy/sell/commission/collect/repair/refine | [trade/index.js:209](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:209) |
| `trade.shops({})` | Pack shops here `[{slug,name,kind}]` or null for generic traders | [trade/index.js:218](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:218) |
| `trade.orders({})` | `[{id,piece,materials,fee,ready,crafter,place,due}]` | [trade/index.js:220](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:220) |
| `craft.view({})` | people/skills/recipes/materials/chances/dc/mod/ready/why for screen | [craft/queries.js:3](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:3) |
| `craft.known({actor?})`, `craft.recipes({})` | Known recipes; full recipe list | [craft/queries.js:62](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:62), [queries.js:69](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:69) |
| `craft.last({})`, `craft.log({})` | Last reply craft results or null; retained ordered crafts | [queries.js:77](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:77), [queries.js:88](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:88) |
| `craft.rollsUsed({carrier})`, `craft.skills({actor?})` | Roll indices; craft/rank/uses/toNext/max | [queries.js:90](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:90), [queries.js:95](/tmp/p0v2/rpg_battle/src/v2/craft/queries.js:95) |

Current domain validators: combat/bestiary registration
[combat/index.js:941](/tmp/p0v2/rpg_battle/src/v2/combat/index.js:941);
trade [trade/index.js:227](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:227);
craft [craft/domain.js:85](/tmp/p0v2/rpg_battle/src/v2/craft/domain.js:85).
Keep their constraints and typed sheet adapters; do not replace their stores with “as today”
plus undocumented new authoritative fields.

Retained UI queries `rpg-battle.cards/heroes/hud/itemDetail/carry/crafting/trade` are registered
at [screens/view.js:735](/tmp/p0v2/rpg_battle/src/v2/screens/view.js:735). itemDetail({stack}) returns
stack/kind/slot/slotLabel/stats/effect/wearer/helps/condition/refine/lines or null
[:523](/tmp/p0v2/rpg_battle/src/v2/screens/view.js:523). Keep these adapters for existing screens.
`rpg-battle.rev` returns meta.rev, [module.js:264](/tmp/p0v2/rpg_battle/src/v2/module.js:264).
Crafted item IDs remain craft/<slug> or craft/<order suffix>, not renamed to story IDs:
[craft/make.js:209](/tmp/p0v2/rpg_battle/src/v2/craft/make.js:209),
[trade/index.js:164](/tmp/p0v2/rpg_battle/src/v2/trade/index.js:164).

### RB party, creation, effects and return seams

| Existing surface | Fate and source |
|---|---|
| `party.actors/actor/pc/offers/terms/combatNumbers/ranks/toSpend/pools/encumbered/effects` | Keep names as adapters; [party/queries.js:183](/tmp/p0v2/rpg_battle/src/v2/party/queries.js:183). New rules views are separately declared in contract. |
| `party.create`, `party.addCompanion`, `party.edit`, `party.removeCompanion` | Keep creation/offer/control names, enforce v2 class/three-skill rules; [party/commands.js:914](/tmp/p0v2/rpg_battle/src/v2/party/commands.js:914). edit retains name/role/control/growth/npc/portrait; control currently auto/player, not ai/manual strings. |
| `party.spend` | Existing `{actor?,points:{STAT:n}}`; retain, add convenience variant; [commands.js:367](/tmp/p0v2/rpg_battle/src/v2/party/commands.js:367). No new stats.spend registration. |
| `party.rest/applyResult/fightPools/grantXp/heal/restore/acceptOffer/dismissOffer/export/import` | Keep names and existing authorization; new rules restrict imported skills/forms. [commands.js:923](/tmp/p0v2/rpg_battle/src/v2/party/commands.js:923). restore is heal alias, not savepoint restoration. |
| `party.learnSkill/setSkillActive/forgetSkill` | Existing [commands.js:920](/tmp/p0v2/rpg_battle/src/v2/party/commands.js:920). Retire free-form v2 use: no fourth skill, inactive set or respec. Legacy-only adapters may refuse with explanation. |
| `check.resolve`, `checks.prepare/log/view/toldBack/rolls/last/modifiers` | Existing RB [party/commands.js:933](/tmp/p0v2/rpg_battle/src/v2/party/commands.js:933), [checks/commands.js:334](/tmp/p0v2/rpg_battle/src/v2/checks/commands.js:334), [checks/queries.js:81](/tmp/p0v2/rpg_battle/src/v2/checks/queries.js:81). Transfer non-combat ownership to SD once; reconcile compatibility check.resolve there. |
| `party.addEffect/endEffect/effectsTurn` | Keep RB effects owner, feature guards, source/timing records; [party/effects.js:601](/tmp/p0v2/rpg_battle/src/v2/party/effects.js:601). effectsTurn is trusted system step. |
| `party.recover` | System only, clock-dependent replan; [party/recovery.js:175](/tmp/p0v2/rpg_battle/src/v2/party/recovery.js:175). |
| `creation.finish/rollTalent/import/skipStart`, `creation.content/build` | Existing [creation/commands.js:412](/tmp/p0v2/rpg_battle/src/v2/creation/commands.js:412). Keep flow/preview; basic class must be player-selected, imported character cannot bypass immutable rules/three skills. |
| `return.point({})` | Today null or `{index,beforeRev,place,fight}`; [return/index.js:117](/tmp/p0v2/rpg_battle/src/v2/return/index.js:117). New v2 snapshot fields in contract §8. |
| `return.status({})` | Today `{dead,point}`; [return/index.js:123](/tmp/p0v2/rpg_battle/src/v2/return/index.js:123). Preserve fields, add return status. |
| `return.cue({fight,place?})` | Existing cue after rewind; [return/index.js:58](/tmp/p0v2/rpg_battle/src/v2/return/index.js:58). New v2 `{return:Id}` adapter is not arbitrary UI resurrection. |
| `returnInTime(sdk)` | Existing exported async coordinator, not a bus command; [return/index.js:76](/tmp/p0v2/rpg_battle/src/v2/return/index.js:76). Replace v2 branch-opening with SB snapshot coordinator. |

### SD director, atlas and chronicle

| Existing query | Current argument/result | Source |
|---|---|---|
| `director.time` | `{}` → `{minutes,text}`; unset minutes:null,text:'' | [tracker/domain.js:266](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:266) |
| `director.calendar` | `{}` → normalized calendar config | [domain.js:279](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:279) |
| `director.retriable` | Thread IDs whose turn-in place refusal belongs to this reply | [domain.js:288](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:288); transfer RPG retry logic to RB with quest extraction |
| `director.threads` | `{kind?,status?,offer?}` → full records id/kind/key/summary/fields/status/offer/taken/ended/target/reward/rev and optional readiness/owed fields | [domain.js:294](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:294), [record validation:165](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:165) |
| `director.thread` | `{id?|key?}` → record or null | [domain.js:298](/tmp/p0v2/Story_director/src/v2/tracker/domain.js:298) |
| `director.world`, `director.world.here`, `director.journal` | World/here views and `{on,days,hasDays,count,today}` journal; feature-tagged | [world/index.js:40](/tmp/p0v2/Story_director/src/v2/world/index.js:40), [world/journal.js:100](/tmp/p0v2/Story_director/src/v2/world/journal.js:100) |
| `director.arc` | Feature-tagged arc projection | [arc/index.js:58](/tmp/p0v2/Story_director/src/v2/arc/index.js:58) |
| `atlas.places` | `{discovered?}` → visible place rows | [atlas/queries.js:67](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:67) |
| `atlas.routes` | `{place?,map?}` → route/time rows | [queries.js:71](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:71) |
| `atlas.map`, `atlas.view` | Map props; full visible map view | [queries.js:79](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:79), [queries.js:84](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:84) |
| `atlas.place` | `{id?,name?}` → place + aliases/here/trip/routes or null; **no danger tier** | [queries.js:90](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:90) |
| `atlas.here` | `{}` → `{id,name,kind,placeKind,region}` or null | [queries.js:98](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:98) |
| `atlas.selected` | Focus place detail or null | [queries.js:106](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:106) |
| `atlas.travel` | `{from?,to?,mode?,map?}` → travel estimate or null | [queries.js:113](/tmp/p0v2/Story_director/src/v2/atlas/queries.js:113) |
| `chronicle.events`, `chronicle.event` | `{state?,open?}` list; `{id?,name?}` one/null | [chronicle/queries.js:238](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:238), [queries.js:245](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:245) |
| `chronicle.factions`, `chronicle.faction` | Faction list; `{id?,name?}` one/null | [queries.js:251](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:251), [queries.js:256](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:256) |
| `chronicle.board` | World event/faction board | [queries.js:261](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:261) |
| `chronicle.days`, `chronicle.day` | `{from?,to?}` digests; `{day}` digest/null, feature-off null | [queries.js:145](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:145), [queries.js:263](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:263) |
| `chronicle.dayBoard/dayFacts/noteFacts/questLog` | Digest board; day facts; recorded note facts; `{id}` → `[{rev,text}]` | [queries.js:270](/tmp/p0v2/Story_director/src/v2/chronicle/queries.js:270). New journal.day adapter must preserve visibility and work with presentation off. |

Existing director UI queries `director.behind/goal/next/problems/status` and `quest.board`:
[screens/queries.js:449](/tmp/p0v2/Story_director/src/v2/screens/queries.js:449). Keep generic
director projections in SD; transfer quest.board and director.retriable compatibility adapters
to RB with RPG logic. They retain names with one registration owner.

Existing arc commands `director.arc.accept {plan,reason?,note?}`, `director.arc.update {arc,line}`,
`director.arc.end {reason?}`: [arc/commands.js:24](/tmp/p0v2/Story_director/src/v2/arc/commands.js:24).
Existing commands retained: director.seed/director.initiative/quest.settle registration
[tracker/index.js:47](/tmp/p0v2/Story_director/src/v2/tracker/index.js:47) (quest.settle moves to RB);
`director.advance {minutes,cause?,reason?}`, system/story only, 1..1440/call and once per reply/cause
[time/advance.js:4](/tmp/p0v2/Story_director/src/v2/time/advance.js:4);
`time.settle` [time/index.js:201](/tmp/p0v2/Story_director/src/v2/time/index.js:201);
`atlas.visit/edit/focus` [atlas/index.js:20](/tmp/p0v2/Story_director/src/v2/atlas/index.js:20);
`chronicle.edit/remove/surface/digest/note`
[chronicle/index.js:65](/tmp/p0v2/Story_director/src/v2/chronicle/index.js:65).
Existing payload handlers remain in these modules. No new world.place/threads.list alias is
registered. New director.contract/world.areaTier/journal.day/threads.link/threads.close/checks.roll
are implementation requirements, not existing APIs. SB assist mentions check.roll but catches
UNKNOWN_COMMAND; it is not currently an RB command
([assist/classifier.js:140](/tmp/p0v2/Story_block/src/v2/assist/classifier.js:140)).
Update that optional pending-check adapter to SD checks.roll; do not pretend check.roll shipped.

Existing quest names to transfer once: `quest.take/abandon/finish/payOwed`; queries
`quest.progress/autoTurnIns/repeatedCoin/owed/owedCredits/details/ranks/followsLadder`
[quests/index.js:1041](/tmp/p0v2/Story_director/src/v2/quests/index.js:1041).
Retire SD's payout hook [index.js:1064](/tmp/p0v2/Story_director/src/v2/quests/index.js:1064)
and tracker settlement path [tracker/quest-lines.js:335](/tmp/p0v2/Story_director/src/v2/tracker/quest-lines.js:335).

### SB inventory, wallet and save points

| Existing command | Payload | Source in SB src/v2/domains/inventory.js |
|---|---|---|
| `inventory.grant` | `{def|defId|name,qty?,owner?,note?}`; trusted story/system/module only | [:935](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:935) |
| `inventory.consume` | `{stack|def,qty?,owner?}` | [:962](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:962) |
| `inventory.transfer` | `{stack,to,qty?}` | [:986](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:986) |
| `inventory.drop` | `{stack,qty?}`; default whole stack | [:1024](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1024) |
| `inventory.equip`, `inventory.unequip` | `{stack,slot?}`, `{stack}`; storage commands, RB supplies legality | [:1039](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1039), [:1059](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1059) |
| `inventory.split`, `inventory.merge` | `{stack,qty}`, `{stack,into}` | [:1073](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1073), [:1092](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1092) |
| `wallet.pay`, `wallet.receive` | `{owner,amount,note?}`; receive also story?:boolean; integer base units, no standalone UI | [:1115](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1115), [:1134](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1134) |
| `inventory.equipOn` | `{stack,actor}` | [:1145](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1145) |
| `inventory.wear`, `inventory.repair` | `{stack,amount}`, module rules only | [:1147](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1147) |
| `inventory.lootTake` | `{sid,pick:[indices]}`, feature guarded | [:1150](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1150) |

| Existing query | Current projection | Source in same file |
|---|---|---|
| `inventory.economy` | `{scale,source:'settings'|'pack'|'default'}` | [:1770](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1770) |
| `inventory.currency` | name/plural/short, optional coins/display | [:1776](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1776) |
| `inventory.items({owner?})` | Stack/item rows with validated carry bonus | [:1779](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1779) |
| `inventory.storyBudget` | `{budget,paid,left,vouched}` for current carrier | [:1787](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1787) |
| `inventory.wallet({owner?})` | `{coin?:integer}`; default party | [:1794](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1794) |
| `inventory.find({name})` | status found/ambiguous/none, defs, stacks | [:1796](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1796) |
| `inventory.equipment` | members/worn/wearers/givers/users/limits/detail | [:1805](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1805), [view:1683](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1683) |
| `inventory.loot` | Untaken offers sid/where/n/items | [:1807](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1807) |
| `inventory.condition({stack})` | stack/cond/events or null | [:1816](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1816) |
| `inventory.encumbrance` | on/encumbered/party/who/load/capacity/penalty/stats | [:1821](/tmp/p0v2/Story_block/src/v2/domains/inventory.js:1821) |

Wallet storage and existing denomination conversion:
[money.js:1](/tmp/p0v2/Story_block/src/v2/domains/money.js:1),
[money.js:62](/tmp/p0v2/Story_block/src/v2/domains/money.js:62),
[money.js:88](/tmp/p0v2/Story_block/src/v2/domains/money.js:88).
`purse.currency` is a **new RB query**, not a renamed SB balance API.

Existing host-local `createSavePoints` exposes `list()`, async `save({name?})`,
`returnTo(id)`, `forget(id)`, `chatId()`:
[rewind.js:178](/tmp/p0v2/Story_block/src/v2/rewind.js:178).
List points are `{id,name,index,branch,at,rev}`; save creates a branch
[:231](/tmp/p0v2/Story_block/src/v2/rewind.js:231), returnTo opens it
[:269](/tmp/p0v2/Story_block/src/v2/rewind.js:269).
None is today's public `savepoint.list/make/restore` bus contract. The new snapshot query
returns eligible Snapshot descriptors; new make/restore have contract §3/§8 payloads.

### SB pack envelope, validation and transport

| Existing boundary | Source / retained rule |
|---|---|
| `validatePack(input,{hostVersion?,capabilities?,limits?})` | [packs/validate.js:40](/tmp/p0v2/Story_block/src/v2/packs/validate.js:40) → `{ok:true,pack,raw}` or `{ok:false,errors:[{code,path,message}]}`. |
| Closed envelope | [packs/limits.js:33](/tmp/p0v2/Story_block/src/v2/packs/limits.js:33), [validate.js:69](/tmp/p0v2/Story_block/src/v2/packs/validate.js:69): id/version/name/author/description/requires/currency/economy/calendar/weather/content/start/layouts/screens/theme. No kind/schema/classes top-level fields. |
| Registered kinds | [limits.js:27](/tmp/p0v2/Story_block/src/v2/packs/limits.js:27), [validate.js:90](/tmp/p0v2/Story_block/src/v2/packs/validate.js:90): closed list; new rules kind must be registered before use. |
| requires | [validate.js:158](/tmp/p0v2/Story_block/src/v2/packs/validate.js:158): storyBlock range and capabilities only. |
| IDs | [validate.js:185](/tmp/p0v2/Story_block/src/v2/packs/validate.js:185): unique slug in kind; normalized pack.<id>/<slug>. Contract adds cross-kind/expanded-ID checks for rules. |
| Items/skills | [validate.js:226](/tmp/p0v2/Story_block/src/v2/packs/validate.js:226), [:718](/tmp/p0v2/Story_block/src/v2/packs/validate.js:718): strict field lists; new rules use separate registered manifest. |
| Shop/recipe references | [validate.js:277](/tmp/p0v2/Story_block/src/v2/packs/validate.js:277), [:299](/tmp/p0v2/Story_block/src/v2/packs/validate.js:299): existing item ref normalization retained. |
| Currency | [validate.js:558](/tmp/p0v2/Story_block/src/v2/packs/validate.js:558): name/plural/short/coins; coins 1..8, values 1..1000000; no second wallet. |
| Content lookup `packs.content` | [packs/index.js:94](/tmp/p0v2/Story_block/src/v2/packs/index.js:94), [content.js:40](/tmp/p0v2/Story_block/src/v2/packs/content.js:40): kind/optional pack filter; unknown kind returns []; must add rules kind, not rely on unknown fallback. |
| Inventory projection `itemDef` | [content.js:12](/tmp/p0v2/Story_block/src/v2/packs/content.js:12): copies known fields/carry; does not preserve hands/requires/weight. New definition-ID lookup closes that seam. |
| Size/safety | [limits.js:5](/tmp/p0v2/Story_block/src/v2/packs/limits.js:5), [validate.js:53](/tmp/p0v2/Story_block/src/v2/packs/validate.js:53): keep envelope bounds/plain safe data plus new rules semantic passes. |

Runtime item rules and content schema 2 are new, while the SB envelope and all existing APIs
above remain the compatibility boundary. The contract marks every required host extension.
