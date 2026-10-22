# p1-c4-noRB

config: `{"tag": "p1-c4-noRB", "exit": 0, "VIEW": "desk", "PACK_MODE": "ersveil", "FEATURES": "keep", "ECON": "", "MODULES": "Story_block,Story_director,npc_state_delta", "SEED_SETTINGS": ""}`
heads: `{"Story_block": "5ef7ead", "rpg_battle": "924b9a3", "Story_director": "affde13", "npc_state_delta": "5243d79"}`
static prompt: 25 requests, 1 distinct, 0 change(s)
rebuild == live (B20): PASS
console: 150 lines, unclassified 0


| row | what | owner | result | note |
|---|---|---|---|---|
| A0 | pack installs through Story Block's importer | SB-packs2 | PASS | installed; ersveil-bluewatch:true:{"items":41,"creatures":6,"shops":4,"recipes":7,"events":6,"quests":3,"races":7,"talents":6,"skills":2,"presets":1,"places":54,"routes":63,"terms":1,"ranks":7,"crafts":2,"meterPresets":2} |
| A1 | generation held until a character exists; creation wizard | RB-screens2 | FAIL | driver/page threw: page.evaluate: Error: Story Suite: no module answers the query "creation.content". |
| A2 | capture across all modules | main | FAIL | {"story-block":["capture.place","capture.present","capture.item"],"story-director":["capture.quest","capture.faction","capture.world","capture.time"],"rpg-battle":[],"npc-state-delta":["capture.npc"]} |
| A3 | quest taken by words, fight, story turn-in paid by code, next reply told | SD-ranks | FAIL | taken by words=true; fight 1 undefined (Cellar rats 0/6), early: "The story says Granary Rats was turned in, but no fights can be counted (RPG Battle is not running); it stays open.", fight 2 undefined; "no turn-in receipt"; wallet 44→44; told=false; quest buttons=[] |
| A4 | check with pre-rolled dice | main | FAIL | tail "null"; die undefined undefined = undefined vs dc undefined → undefined (said undefined) |
| A5 | story item use | main | FAIL | no use receipt; salves 1→1, HP undefined→undefined |
| A6 | chat switch right after a UI command; nothing lost | SB-storage | FAIL | equip UNKNOWN_COMMAND There is no command called "item.equip".; in main after switch=false, after reload=false, leaked into spare=false |
| A7 | swipe, delete-middle, rewind | main | FAIL | driver/page threw: page.evaluate: TypeError: Cannot read properties of undefined (reading 'extra') |
| B01 | Features: every module declares, toggles off/on, static prompt changes once and comes back | SB-features | FAIL | 5 features (story-block:4, story-director:1); no features from ["rpg-battle","npc-state-delta"]; settings switches in page 0; toggled story-director.digest (prompt=false) via settings: off→false, on→true; static changed when off=false, steady while off=true, identical after on=true |
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
| B12 | Normalized fights: same-tier groups of different creatures are comparable; a lone foe; a boss keeps its level | RB-balance2 | SKIP | offers carry no power/boss fields yet (RB-balance2 not merged); 0 offers |
| B13 | RB screens: HUD, Party/gear, Crafting, export → import round trip | RB-screens2 | SKIP | no export/import or Crafting screen yet (RB-screens2 not merged); tabs ["Quests","Scene","Inventory","Map","Cast","Chronicle","Days","Director"]; HUD "Story Game view Suite" |
| B14 | Day digest: crossing a day writes a code-made digest; Chronicle Days lists it; reminder after a skip | SD-digest | FAIL | chronicle.days: 1 day(s) {"day":220091,"date":"CY 611, Goldwane 12","line":"CY 611, Goldwane 12: took on Granary Rats; 1 world event.","brief":false,"count":13,"made":24,"happened":["Fenna is here.","Fenna: trust 0 → 10.","Th; receipt none; Chronicle has Days=false; tail reminder "Goldwane 14 dusk, 120 marks)." |
| B15 | NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail | NSD-meters2 | SKIP | no stage reached after trust +60 (no ladder yet; NSD-meters2 not merged): {"key":"fenna","name":"Fenna","meters":{"trust":70,"affection":40,"desire":0,"tension":0},"stages":{},"unlocked":[],"reply":38} |
| B16 | SB inspector: opens on a reply, shows its receipts, problems and state; read-only | SB-view | SKIP | no inspector screen (SB-view not merged): story-block.inspector The screen "story-block.inspector" cannot be shown. |
| B17 | Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers | SB-view | SKIP | no save points query/screen (SB-view not merged) |
| B18 | Compat panel: module versions, requires, missing domains, features each module brings | SB-view | SKIP | no compat panel (SB-view not merged) |
| B19 | Storage: saves per reply ≤ 2, record kept once (no swipe_info copy), checkpoint spacing | SB-storage | SKIP | old storage still (SB-storage not merged): saves/reply [3,3,3,3] (mean 3), bytes/reply [279242,312422,322973,333528]; records also in swipe_info: 24/24; checkpoints 2 |
| B21 | Money scale: pack economy.scale / Settings economyScale scales built-in prices and rewards | SB-packs2 | SKIP | ECON not set for this configuration |
| B20 | After every beta step: live head == rebuild from the saved file | main | PASS | identical |
| A8 | static prompt byte-identical; shared prefix | main | PASS | 25 requests, 1 distinct static part(s), 0 change(s) (feature toggles allow 2); prefix median 86.8% |
| A9 | NSD hosted Cast tab; other tabs not clobbered | NSD-meters2 | PASS | Cast shows Fenna=true, meters=1, Quests kept=true |
| A10 | map: search and zoom | main | PASS | 11 places, search ["Watch GranaryBluewatch Village · not visited"], zoom ×2.14 |
| A11 | Chronicle tab | SD-digest | PASS | Events 1 under way Hill Rain looming the hill rain is coming down the Bluewatch Branch Bluewatch Village Bluewatch Watch Since CY 611, Goldwane 12, 06:40 am Las |
| A11p | phone (390 px): tabs fit, wizard fits | RB-screens2 | FAIL | page 390/390; tabs over the edge []; wizard {"dialog":false,"w":0} |
| A12 | console errors | main | PASS | 60 lines; 8x SillyTavern warnings; 12x NSD sidecar 404 on a chat without one yet; 30x NSD scan got the mock's empty side answer; unclassified 10 |
