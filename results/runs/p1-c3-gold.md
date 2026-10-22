# p1-c3-gold

config: `{"tag": "p1-c3-gold", "exit": 0, "VIEW": "desk", "PACK_MODE": "none", "FEATURES": "keep", "ECON": "", "MODULES": "Story_block,rpg_battle,Story_director,npc_state_delta", "SEED_SETTINGS": ""}`
heads: `{"Story_block": "5ef7ead", "rpg_battle": "924b9a3", "Story_director": "affde13", "npc_state_delta": "5243d79"}`
static prompt: 0 requests, 0 distinct, 0 change(s)
rebuild == live (B20): PASS
console: 38 lines, unclassified 0


| row | what | owner | result | note |
|---|---|---|---|---|
| A0 | pack installs through Story Block's importer | SB-packs2 | PASS | no pack (built-in defaults); packs left [] |
| A1 | generation held until a character exists; creation wizard | RB-screens2 | FAIL | driver/page threw: page.evaluate: TypeError: Cannot read properties of undefined (reading 'id') |
| A2 | capture across all modules | main | FAIL | {"story-block":[],"story-director":[],"rpg-battle":[],"npc-state-delta":[]} |
| A3 | quest taken by words, fight, story turn-in paid by code, next reply told | SD-ranks | FAIL | taken by words=false; fight 1 undefined (undefined), early: "undefined", fight 2 undefined; "no turn-in receipt"; wallet 0→0; told=false; quest buttons=[] |
| A4 | check with pre-rolled dice | main | FAIL | tail "null"; die undefined undefined = undefined vs dc undefined → undefined (said undefined) |
| A5 | story item use | main | FAIL | no use receipt; salves 0→0, HP undefined→undefined |
| A6 | chat switch right after a UI command; nothing lost | SB-storage | FAIL | equip NOT_FOUND That item is not among the party's things.; in main after switch=false, after reload=false, leaked into spare=false |
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
| B13 | RB screens: HUD, Party/gear, Crafting, export → import round trip | RB-screens2 | SKIP | no export/import or Crafting screen yet (RB-screens2 not merged); tabs ["Party","Quests","Scene","Inventory","Map","Cast","Fight","Items","Trade","Chronicle","Days","Director"]; HUD "Story Game view Suite RPG Battle: Create your character first." |
| B14 | Day digest: crossing a day writes a code-made digest; Chronicle Days lists it; reminder after a skip | SD-digest | FAIL | chronicle.days: 0 day(s) undefined; receipt none; Chronicle has Days=false; tail reminder "null" |
| B15 | NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail | NSD-meters2 | FAIL | driver/page threw: ENOENT: no such file or directory, open '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/inst/m3/log/undefined' |
| B16 | SB inspector: opens on a reply, shows its receipts, problems and state; read-only | SB-view | FAIL | inspector: "New character Start Race Talents Stats You This story has no ready-made characters. Go on to make your own. Random Next"; state untouched=true |
| B17 | Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers | SB-view | SKIP | no save points query/screen (SB-view not merged) |
| B18 | Compat panel: module versions, requires, missing domains, features each module brings | SB-view | SKIP | no compat panel (SB-view not merged) |
| B19 | Storage: saves per reply ≤ 2, record kept once (no swipe_info copy), checkpoint spacing | SB-storage | FAIL | saves/reply [1,1,1,1] (mean 1), bytes/reply [7283,7495,7707,7919]; records also in swipe_info: 1/1; checkpoints 1 |
| B21 | Money scale: pack economy.scale / Settings economyScale scales built-in prices and rewards | SB-packs2 | SKIP | ECON not set for this configuration |
| B20 | After every beta step: live head == rebuild from the saved file | main | PASS | identical |
| A8 | static prompt byte-identical; shared prefix | main | PASS | 0 requests, 0 distinct static part(s), 0 change(s) (feature toggles allow 2); prefix median undefined% |
| A9 | NSD hosted Cast tab; other tabs not clobbered | NSD-meters2 | FAIL | Cast shows Fenna=false, meters=0, Quests kept=true |
| A10 | map: search and zoom | main | FAIL | 0 places, search ["No place by that name."], zoom ×NaN |
| A11 | Chronicle tab | SD-digest | FAIL | Events Nothing is under way in the wider world. Factions No factions recorded yet. |
| A11p | phone (390 px): tabs fit, wizard fits | RB-screens2 | PASS | page 390/390; tabs over the edge []; wizard {"dialog":true,"w":390} |
| A12 | console errors | main | PASS | 26 lines; 8x SillyTavern warnings; 12x NSD sidecar 404 on a chat without one yet; 4x NSD scan got the mock's empty side answer; unclassified 2 |
