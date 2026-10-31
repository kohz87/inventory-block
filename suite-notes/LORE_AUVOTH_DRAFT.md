# Ersveil lore change: Auvoth sealed by Veyr (DRAFT for USER review, 31 Oct)

USER decisions (30–31 Oct):
- The Depths are the only mega-dungeon sealed by human hand.
- The sealer is the Guild's founder, Veyr the Unbound, already in the lore. The seal and the Charter are the same year, CY 384.
- The Guild governs the city and the Depths, with one seat per country, which makes it a transnational power.
- There is no Delver/adventurer split: the Delver calling is dropped.
- The Depths are a world with its own ecosystem, not a cave.

Kept on purpose, so saved chats keep working:
- The region name "Auvoth Compact": the Compact is now the CY 384 treaty that gave the Guild custody, and the Standing module's faction label uses this name.
- Place ids.
- The name "Rimeglass Delve": a place's proper name, not a profession.
- The renamed ward keeps its old name as a hidden alias.
- Mysteries stay sealed: Veyr's fate; the bottom of the Depths.

## Lorebook entries

### Auvoth Depths (rewritten)
Auvoth Depths: the largest known leyline and the only mega-dungeon ever sealed by human hand. In CY 384, the Crownless Winter, Veyr the Unbound closed it with seals no one has been able to remake or fully read since. Other great dungeons are walled, warded or abandoned; only the Depths were shut.
Below the seals is not a cave but a world. Each band has its own light, weather and seasons of circulation, its own plants, prey and predators, and food chains that never touch the surface. Some creatures are born, breed and die there without ever rising; some bands hold rivers, forests or open skies of glowing mana. Upper bands are the most worked and the most dangerous to complacency.
The Seals segment the descent into bands, with controlled gates, collapsed transitions, ward barriers and quarantine layers. Entry requires a recorded party, a Guild permit matching the band's recommended clearance letter, and a recovery plan.
No band has ever been permanently cleared. What lies at the bottom, and what Veyr sealed in, is a sealed question; deeper bands are known only from broken records and survivors who will not talk about them.

### Auvoth (rewritten)
Auvoth: the Guild city around the sealed entrance to the Auvoth Depths; the northernmost city in the known world and the Adventurer Guild's capital.
In CY 384 Veyr the Unbound sealed the Depths and forced the surviving crowns to charter the Guild in the same winter. The Auvoth Compact, sworn that year, put the city and the Depths in the Guild's keeping: no crown, Church office or army may own either.
Government: the Guild governs Auvoth and the Depths. The Guildmaster presides over the Compact Council, where every signatory realm keeps one representative: Highmark, River Confederacy, Holy Dominion (for the Church), Ironanvil, Ashmere, Valegard, Border Kingdoms; Startrace witnessed. The representatives advise, bargain and watch one another; the Guild decides. That seat at the Council is the reason every power keeps an embassy in a city none of them rules, and why the Guild counts as a transnational power in its own right.
The Seventh Seal Court rules on Depths permits, claims, seals and quarantines.
Law: the Guild's. Guild courts try crimes and disputes; Guild wardens keep the streets. The city extradites no one and honors no outside writ, warrant, bounty or debt claim.
Every great power wants Auvoth; none can take it without the others uniting against it and the Guild declaring a Withdrawal. Red line: foreign troops inside the walls. The Sealwardens hold the descents.
Visitors notice: lamps that never go out, Guild badges everywhere, how expensive everything is. Locals complain: adventurers who die owing money; crowns that want the city without its dead.
The Guild auctions its tithe and Sealwarden salvage at the Pale Market monthly; crowns bid through agents.
- Keys: drop "Delver's Crown", "treaty city", "CY 391"; add "Sealcrown", "Guild city", "Compact seat", "CY 384".

### Adventurer Guild (edits)
- First line becomes: "The Adventurer Guild was chartered in CY 384, the winter Veyr the Unbound sealed the Auvoth Depths and ended the Crownless Winter. Motto: "Contract above crown." Capital Auvoth, which it governs with a seat for every signatory realm; Guild Grand Hall in Sealcrown."
- Everything else is unchanged. The Withdrawal paragraph already fits.

### Veyr the Unbound (one sentence added)
- After "They chartered the Adventurer Guild.", add: "The same winter he sealed the Auvoth Depths with his own hand, the only mega-dungeon anyone has ever sealed, and left the Guild to keep it."
- His fate stays a sealed question.

### Historical Chronology (Guild Era line)
- Becomes: "Guild Era (from CY 384, within the Reopening): Veyr the Unbound seals the Auvoth Depths and forces the Guild Charter on the surviving crowns; the Auvoth Compact gives the Guild the city and the Depths, with a seat for each signatory realm."
- The "CY 391 … three years of fighting" sentence goes.

### Order of the Sealwardens (edits)
- "chartered by the Auvoth Compact to guard the Depths' seals and gates" becomes "the Guild's order, chartered under the Auvoth Compact to guard Veyr's seals and the Depths' gates".
- Everything else is unchanged.

### The Dawn-King and the Compact (one phrase)
- "the much later Auvoth Compact (a treaty city)" becomes "the Auvoth Compact of CY 384 (the Guild's keeping of Auvoth)".

### Callings (Delver line dropped)
- Title: "Callings: the Twelve Lines".
- Delete the "Delver: Drill-Yard Recruit, Drill-Yard Delver, Deep-Band Delver" line.
- Keys: drop "Delver".
- Guild drill-yard training remains, as Martial Schools says; it trains adventurers, not a separate calling.

### Smaller wording edits ("delver"/"delving" → adventurer/dungeon wording)
| Entry | Change |
|---|---|
| Leylines and Dungeons | "The Auvoth Depths are the largest known leyline." becomes "…largest known leyline, and the only mega-dungeon sealed by human hand." "delvers swear" becomes "adventurers in the deep bands swear". |
| Slavery | "delver-slaves sent first into dungeons" becomes "trap-slaves sent first into dungeons"; key "delver-slave" becomes "trap-slave". |
| The Ninth Debt | "Used as expendable vanguards and delvers." becomes "Used as expendable vanguards and sent first into dungeons." |
| Martial Schools | "Guild drill yards (Auvoth, Delver's Crown): practical delving" becomes "Guild drill yards (Auvoth, Sealcrown): practical dungeon work". |
| Disease | "deep delving" becomes "deep dungeon bands". |
| First Abyssal Tide | "delving to a great dungeon's root" becomes "descending to a great dungeon's root". |
| Hunting Rights | "Auvoth issues Depths permits by band" becomes "the Guild issues Depths permits by band". |

## Pack (pack.json) edits
- Place "Auvoth / Delver's Crown" is renamed "Auvoth / Sealcrown", with aliases Sealcrown, plus Delver's Crown and Delver’s Crown kept as hidden aliases. Its note becomes "Guild Grand Hall ward: dungeon contracts, charts, adventurer lodging." The route that starts there takes the new name.
- Auvoth's note becomes "Guild-governed megadungeon city and Guild capital; charts, adventurer gear, salvage, dear food and beds."
- Boneglass Yard (or whichever place it is): "custom delver gear" becomes "custom adventurer gear".
- Place tags "delving" become "dungeon".
- Mining camp: "delve permits" becomes "dungeon permits". Rimeglass Delve: "Seasonal licensed delve" becomes "Seasonal licensed dungeon".
- Internal Depths route: "treaty-controlled" becomes "Guild-controlled".
- Pack version: Ersveil 2.0.0 → 2.1.0 (lore and names only; no data-module definitions change, so pins and Standing values carry over).

## Checks before release
- The pack validates.
- An existing 2.0.0 chat standing in Delver's Crown still resolves its place through the old alias, and its Standing pins still read Pinned.
- The lorebook JSON is valid, and every new key is unique.
- The Story Block suite passes. It goes out as a Story Block 2.7.2 example-pack update.
