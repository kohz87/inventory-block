# p1-c4-nsdv1

config: `null`
heads: `null`
static prompt: 0 requests, 0 distinct, 0 change(s)
rebuild == live (B20): ?
console: 0 lines, unclassified 0


| row | what | owner | result | note |
|---|---|---|---|---|
| A0 | pack installs through Story Block's importer | SB-packs2 | PASS | installed; ersveil-bluewatch:true:{"items":41,"creatures":6,"shops":4,"recipes":7,"events":6,"quests":3,"races":7,"talents":6,"skills":2,"presets":1,"places":54,"routes":63,"terms":1,"ranks":7,"crafts":2,"meterPresets":2} |
| A1 | generation held until a character exists; creation wizard | RB-screens2 | PASS | notice="RPG Battle: Create your character first.", New character steps=Start/Race/Talents/Stats/You, requests while held=0, pc=User |
| A2 | capture across all modules | main | PASS | {"story-block":["capture.place","capture.present","capture.item"],"story-director":["capture.quest","capture.faction","capture.world","capture.time"],"rpg-battle":["capture.encounter"],"npc-state-delta":["capture.npc"]} |
| A3 | quest taken by words, fight, story turn-in paid by code, next reply told | SD-ranks | PASS | taken by words=true; fight 1 won (Cellar rats 3/6), early: "The story says Granary Rats was turned in, but only 3 of 6 cellar rats are beaten; it stays open.", fight 2 won; "User turns in Granary Rats: 6 cellar rats beaten (target 6), 50 marks paid."; wallet 44→94; told=true; quest buttons=[] |
| A4 | check with pre-rolled dice | main | PASS | tail "Dice for this reply: Roll 1 = 4 · Roll 2 = 12 (the first uncertain attempt takes Roll 1, the next Roll 2, whatever they say)."; die 4 +1 = 5 vs dc 15 → fail (said success, flagged) |
| A5 | story item use | main | PASS | User uses the Healing Salve: +10 HP (now 17/82 HP).; salves 1→0, HP 7→17 |
| A6 | chat switch right after a UI command; nothing lost | SB-storage | PASS | equip ok ("User equips the Cane-Blade (ATK +2, capped from ATK +4 at level 1)."); in main after switch=true, after reload=true, leaked into spare=false |
| A7 | swipe, delete-middle, rewind | main | PASS | swipe follows; delete-middle checks 1→0, live==rebuild true; rewind branch wallet 44 (was 94), quest active, main kept 94 |
| B01 | Features: every module declares, toggles off/on, static prompt changes once and comes back | SB-features | SKIP | False |
| B02 | Features: a feature off refuses its commands and nulls its queries; back on restores state | SB-features | SKIP | none of story-block.loot, story-block.encumbrance, rpg-battle.wear, rpg-battle.crafting, rpg-battle.effects declared yet |
| B03 | Equip / unequip and "Equip on…" a companion | SB-inv | SKIP | inventory.equipOn / inventory.equipment not there (SB-inv not merged) |
| B04 | Loot picker: `? loot` offered, the reader takes part, the rest stays; replay-safe | SB-inv | SKIP | loot kind / inventory.lootTake not there |
| B05 | Encumbered: carrying past the limit shows and is told; dropping clears it | SB-inv | SKIP | inventory.encumbrance not there |
| B06 | Condition, wear and repair: story wear, fight wear, repair costs and restores | RB-gear | SKIP | items.condition / inventory.wear / inventory.repair not there (RB-gear, SB-inv not merged) |
| B07 | Refinement: a piece refined with materials, capped; the fight uses the refined stats | RB-gear | SKIP | no refine command (RB-gear not merged) |
| B08 | Crafting with dice: `! craft` takes the reply's roll, code sets the result; materials taken once | RB-craft | SKIP | craft kind / craft.make not there (RB-craft not merged) |
| B09 | Party ranks and foe rank | RB-party2 | SKIP | party.ranks not there (RB-party2 not merged) |
| B10 | Points badge: unspent points show a badge; spending clears it | RB-party2 | SKIP | party.toSpend not there |
| B11 | Timed effects: story `+ effect` with a duration, shown, counted in checks, ends with time; capped | RB-party2 | SKIP | effect kind / party.effects not there |
| B12 | Normalized fights: same-tier groups of different creatures are comparable; a lone foe; a boss keeps its level | RB-balance2 | SKIP | offers carry no power/boss fields yet (RB-balance2 not merged); 3 offers |
| B13 | RB screens: HUD, Party/gear, Crafting, export → import round trip | RB-screens2 | SKIP | no export/import or Crafting screen yet (RB-screens2 not merged); tabs ["Party","Quests","Scene","Inventory","Map","Cast","Fight","Items","Trade","Chronicle","Days","Director"]; HUD "Story Game view Suite" |
| B14 | Day digest: crossing a day writes a code-made digest; Chronicle Days lists it; reminder after a skip | SD-digest | FAIL | chronicle.days: 1 day(s) {"day":220091,"date":"CY 611, Goldwane 12","line":"CY 611, Goldwane 12: took on Granary Rats; finished Granary Rats; 2 fights (2 won); 50 marks in; 1 world event.","brief":false,"count":43,"made":57,"; receipt none; Days tab has Days=false; tail reminder "[Yesterday] CY 611, Goldwane 12: took on Granary Rats; finished Granary Rats; 2 fights (2 won); 50 marks in; 1 world event." |
| B15 | NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail | NSD-meters2 | SKIP | no stage reached after trust +60 (no ladder yet; NSD-meters2 not merged): {"key":"fenna","name":"Fenna","meters":{"trust":80,"affection":40,"desire":0,"tension":0},"stages":{},"unlocked":[],"reply":36} |
| B16 | SB inspector: opens on a reply, shows its receipts, problems and state; read-only | SB-view | SKIP | no inspector screen (SB-view not merged): story-block.inspector The screen "story-block.inspector" cannot be shown. |
| B17 | Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers | SB-view | SKIP | no save points query/screen (SB-view not merged) |
| B18 | Compat panel: module versions, requires, missing domains, features each module brings | SB-view | SKIP | no compat panel (SB-view not merged) |

**The run did not finish** (see the run log tail below).

    [176s] 
    ---- B15 NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail (NSD-meters2) ----
    [176s]    Fenna meters before: {"key":"fenna","name":"Fenna","meters":{"trust":20,"affection":0,"desire":0,"tension":0},"stages":{},"unlocked":[],"reply":2}
    [189s] >> SKIP B15 NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail — no stage reached after trust +60 (no ladder yet; NSD-meters2 not merged): {"key":"fenna","name":"Fenna","meters":{"trust":80,"affection":40,"desire":0,"tension":0},"stages":{},"unlocked":[],"reply":36}
    [189s] 
    ---- B16 SB inspector: opens on a reply, shows its receipts, problems and state; read-only (SB-view) ----
    [190s] >> SKIP B16 SB inspector: opens on a reply, shows its receipts, problems and state; read-only — no inspector screen (SB-view not merged): story-block.inspector The screen "story-block.inspector" cannot be shown.
    [190s] 
    ---- B17 Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers (SB-view) ----
    [190s] >> SKIP B17 Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers — no save points query/screen (SB-view not merged)
    [190s] 
    ---- B18 Compat panel: module versions, requires, missing domains, features each module brings (SB-view) ----
    [190s] >> SKIP B18 Compat panel: module versions, requires, missing domains, features each module brings — no compat panel (SB-view not merged)
    [190s] 
    ---- B19 Storage: saves per reply ≤ 2, record kept once (no swipe_info copy), checkpoint spacing (SB-storage) ----
