# Ersveil lore trim: proposal for the USER (nothing ships without your OK)

Branch `stage59/lean-lore` (from stage58/gear-bind). Only `examples/packs/ersveil/ersveil-lore.json` changed. Sizes are characters of entry content (the audit's 8,213 for the same seven entries counts ~300 less than the raw text; the raw numbers are used on both sides here so the comparison is fair).

## Totals

| Entry | old chars | new chars | mode |
|---|---|---|---|
| Premise and Tone | 800 | 771 | constant |
| Causality and Pressure | 943 | 828 | constant |
| Authority and Generation | 2274 | 2213 | constant |
| Classification | 1468 | 1319 | keyword |
| Knowledge and Reputation | 1028 | 679 | keyword |
| Naming | 1272 | 1176 | keyword |
| Currency | 735 | 525 | keyword |
| **All seven** | **8520** | **7511** | |

- Quiet reply (no keyword hit): **8520 -> 3812** chars (55% less, about 1177 tokens saved per reply).
- Reply where all four keyword entries fire: 8520 -> 7511 chars (12% less). The text trim alone is smaller than the 35% hoped for, because these entries were already dense and the brief said to keep every fact; most of the saving comes from the four entries no longer riding every reply.
- Keyword entries are placed at depth 4 like the lore's other keyword entries (constant ones sit before the character), so a topic coming up does not change the front of the prompt.

---

## [CORE] Premise and Tone

800 -> 771 chars. **Constant**

### New text

```text
Ersveil is a brutal, unkind world that takes everything from those who would survive it. The present age is the Reopening: civilization pushes back into Wildzones it has lost twice before, and the Church's Restorationists ask whether this is how the next Abyssal Tide begins.
Tone: grimdark. Everything has a price (help, passage, healing, information, even a proper death): coin, favor, risk or time. Peace is real but thin; any village can lose everything to war, slavers or a stampede in a day. Wonders are remote, costly, almost fantastical.
Narration is explicit and direct: violence, injury, death, cruelty, slavery and sex shown plainly, never softened; sexual content involves adults only. Death is common; named characters, companions included, can die for good.
```

### What was removed or moved, and why

- Merged "Narration is explicit..." and "Death is common" into two sentences; "All sexual content involves adults only" shortened (same rule).
- Price list tightened ("help, passage, healing, information, even a proper death" now a parenthesis). Voice kept.

---

## [CORE] Causality and Pressure

943 -> 828 chars. **Constant**

### New text

```text
- Hostility, tests, coincidence, awe and fear need a reason inside the world. React to a messenger's news, not the messenger's strength.
- Every scene sits inside at least one active pressure (debt, hunger, tax, faction agenda, monster movement, war rumor, slavers, weather); NPCs pursue their own needs on screen. Quiet is allowed; empty is not.
- When an NPC helps, show what it costs them or what they expect back.
- A solved problem stays solved unless something with a reason and a way to know acts on it. Consequences need causes and information channels, not a quota.
- Factions, monsters and people act off screen. Major events (wars, stampedes, coups, outbreaks) come every few months to years, from causes, never on a schedule.
- The world does not scale to {{user}}: any scene may hold someone far stronger or weaker.
```

### What was removed or moved, and why

- Removed "No plot armor: consequences land on the protagonist as on anyone": the RPG module states it. NOTE: with RPG Battle off, this sentence is no longer anywhere in the prompt (see questions).
- Removed "Price: nothing of value is free" (Premise says every thing has a price); kept the NPC-cost rule as one line.
- Removed "Clean success is allowed" and the labels (Causality:, Pressure floor:, Resolution:, World motion:) that only named the bullet.
- Added one line moved here from Classification: the world does not scale to {{user}} (must stay always-on).

---

## [CORE] Authority and Generation

2274 -> 2213 chars. **Constant**

### New text

```text
Sources: this lorebook, the pack (map, routes, calendar, weather, events; standing, fame, Guild records) and the extensions' records.
- Metaphysics (souls, death, mana, primordials, how magic works) never changes; everything else (laws, institutions, borders, prices, customs) is a default that confirmed campaign events can change. For changeable facts: story events > tracked records (scene block, inventory and purse, Director note, NPC dossiers) > lore and pack defaults.
- Characters know only what they saw, were told, read or could guess; the narrator knows the lorebook, NPCs do not. Levels are never seen as numbers.
- Map: a coordinate is a center, not a border, and proves no sovereignty; places connect only by recorded routes. Auvoth is the northernmost city, Bluewatch the northernmost village; beyond lie only expedition sites and Wildzone. Coordinates, km and route codes are GM metadata; characters use maps, landmarks and travel days.
- Open world: the pack lists no items, shops, prices, foes or jobs. Create them from the lore (Currency, wages, prices, the Bestiary, the Guild); once named in play they keep their identity. Gear, coin and wounds come only from what happened in the story.
- Unmapped space is not empty: freely create villages, farms, shrines, camps, ruins and minor roads, never reusing a name. Invented places never create major crossings, trunk routes or passes through barriers. Roads built, opened or destroyed in play become canon. Build every new name from the Names entries, never a stock fantasy name (Elara, Kael, Thorne, Millbrook).
- Sealed truths are never answered by anyone (which primordial the First Tide threatened, Veyr's fate, where otherworlders come from, what silenced Nareth, the bottom of the Auvoth Depths, the floor of Nyara's prison). They open only through explicit campaign events (the approach to the Hall of Heroes, the Iron Archive piece by piece, the heart of the Nameless Isle). An 'Unknown:' line in a site or apex entry is an ordinary mystery unless marked sealed or listed here: nobody outside it knows or tells, and play uncovers it only through campaign events. Ordinary secrets are held by named people and learnable by plausible means.
```

### What was removed or moved, and why

- GAINED text on purpose: three always-on rules moved here from entries that become keyword-triggered: "characters know only what they saw..., NPCs do not" (from Knowledge), "levels are never seen as numbers" (from Classification/Knowledge, now said once), and "never a stock fantasy name (Elara, Kael, Thorne, Millbrook)" (a short stub of Naming, because new names appear without anyone typing the word "name").
- Merged Lore + Precedence into one bullet; merged Generative locality + Topology firewall into one bullet; dropped the bullet labels.
- Mysteries: "Unknown:" sentence shortened, lists of sealed truths and locked discoveries kept in full.
- The pinned phrase "Open world: the pack lists no items, shops, prices, foes or jobs" is unchanged (a test pins it).

---

## [CORE] Classification

1468 -> 1319 chars. **Keyword-triggered**

Keywords (whole words, any case): `level`, `levels`, `rank`, `ranks`, `ranked`, `guild`, `grade`, `Ecological Grade`, `EG`, `how strong`, `how powerful`, `stronger than`, `weaker than`, `S-rank`, `A-rank`, `B-rank`, `C-rank`, `D-rank`, `E-rank`, `F-rank`, `veteran`, `champion`, `adventurer`, `adventurers`

### New text

```text
Three scales that never convert into one another:
- Level (1-99): raw supernatural capacity, invisible; estimated from feats, bearing, gear, scars. A trained Listener senses a strong soul as a heavy frequency, never a number. The great apexes stand above it.
- Guild Rank (F to S; SS unheld, SSS was Veyr the Unbound's alone): the Guild's certification of record and competence, not power. It can lag, be forged or go unrecognized abroad.
- Ecological Grade (EG, always with a scope: individual, pack, nest, migration or outbreak): the danger a monster scope poses.
Every soul awakens to Level 1 by adolescence; the Hollow-born never do. Physical Affinity (body reinforcement) is common, Mana Affinity (projected magic) rarer. Most adults plateau at levels 5-25.
Typical level by role (to generate people, never a conversion): townsfolk, laborers, clerks 5; militia, watch, ordinary hunters 5-15; soldiers, mercenaries, working adventurers (E-D) 10-29; sergeants, knights, Guild veterans (C), journeyman mages 30-39; order champions, elite adventurers (B-A), masters of a tradition 40-59; kingdom champions, grandmasters, S-rank legends 60-69; level 70 and above, a handful alive, named in lore.
Strength gathers where danger is: frontiers, Auvoth and Wildzone edges hold more level 25-35 people than the safe interior.
```

### What was removed or moved, and why

- "Level is invisible" said once here (it was also in Knowledge); "A trained Listener senses..." folded into the Level bullet.
- Removed "Age, scars, gear and bearing hint at level" (said by the Level bullet) and "never {{user}}'s" (now in Causality). Role list shortened (laborers, clerks; servants/carters/sergeants merged away); the pinned phrases (E-D 10-29, C 30-39, masters of a tradition 40-59, level 70 and above) are kept as tests require.
- Triggered by level/rank/guild words. Ranks matter only when the topic is up; the typical-level table is for generating people, so a scene with a new NPC and none of the keywords will not carry it (see questions).

---

## [CORE] Knowledge and Reputation

1028 -> 679 chars. **Keyword-triggered**

Keywords (whole words, any case): `lore`, `history`, `legend`, `legends`, `rumor`, `rumors`, `rumour`, `rumours`, `secret`, `secrets`, `what do you know`, `know about`, `tell me about`, `heard`, `recognize`, `recognized`, `famous`, `fame`, `reputation`, `witness`, `witnesses`, `otherworlder`, `otherworlders`, `Inquest`

### New text

```text
- Deeds need witnesses; what happens in the wilderness with no one alive to tell it stays unknown. A famous face is recognized only where it has been seen or well described; elsewhere a legend drinks unrecognized.
- Guild records stay in their branch; another branch learns of a member only by letter, at news speed.
- Fame brings contracts and favors, and also rivals, debt collectors, recruiters, slavers and the Inquest.
- An NPC knows a secret only if lore names them as knowing it or they learned it in play.
- Otherworlders are suspected from signs, never known at sight: wrong language, mana sickness, odd habits, ignorance of common things, growth too fast to be natural.
```

### What was removed or moved, and why

- Removed the opening line (moved to Authority, constant) and "Level is invisible" (already in Classification and Authority).
- Removed "No one knows a sealed truth" (Authority: Mysteries says it).
- Triggered by lore/history/rumor/secret/fame/recognize/witness/otherworlder/"what do you know" words.

---

## [CORE] Naming

1272 -> 1176 chars. **Keyword-triggered**

Keywords (whole words, any case): `name`, `names`, `named`, `naming`, `rename`, `called`, `surname`, `introduce`, `introduces`, `who are you`, `who is`, `your name`, `my name`

### New text

```text
Every new name is built from a pattern, never recalled from habit. It carries people, region and class.
- Build person and place names from the local tongue in Names: Human Cultures and Names: Other Peoples. Their examples show the sound only; never give a new person an example name.
- Never use stock fantasy names. People: Elara, Lyra, Kael, Kaelen, Aria, Seraphina, Thorne, Rowan, Finn, Elias, Silas, Marcus, Mira, Kira, Zara, Lysandra, Cedric, Garrick, Gareth, Bram, Eldrin, Sylas, Vex, Nyx, Liora, Isolde, Tobias, Jareth. Places: Millbrook, Riverbend, Oakhaven, Willowbrook, Thornwick, Ravenwood, Stonebrook, Shadowfen, Greenhollow.
- New places never reuse the map's stock roots (Bell, Mere, Thorn, Iron, Wolf, Ash, Grey, Black, Red, Frost, Stone, Glass, Deep, Crown) or endings (-watch, -gate, -ford, -rest, -hold, -mere); name them for a founder, local feature, event or trade, in the local tongue.
- People in one scene get different first letters and lengths; commoners often carry a by-name, trade or parent's name. A new name never repeats or near-copies one in the scene or World State; a district belongs to its parent city and its name is not reused elsewhere.
```

### What was removed or moved, and why

- Opening sentence tightened; commoner by-name and different-first-letter bullets merged; the "check the scene and World State" and "district belongs to its parent city" bullets merged into one.
- Both stock-name lists and the stock roots/endings list are kept in full: they are the rule.
- Triggered by name/names/named/naming/called/introduce/"who are you"/"your name" words, with a short always-on stub in Authority for the worst offenders.

---

## [CORE] Currency

735 -> 525 chars. **Keyword-triggered**

Keywords (whole words, any case): `coin`, `coins`, `copper`, `bronze`, `silver`, `gold`, `price`, `prices`, `cost`, `costs`, `pay`, `paid`, `buy`, `bought`, `sell`, `sold`, `wage`, `wages`, `haggle`, `haggling`, `fee`, `fees`, `toll`, `tax`, `purse`, `afford`, `cheap`, `expensive`, `shop`, `market`, `merchant`, `ransom`, `bribe`, `reward`, `bounty`, `rent`, `healer`, `slave`, `slaves`, `slavery`, `livestock`

### New text

```text
An unskilled laborer earns 16-30 copper a day, a town guard 3-6 silver. Coin is physical and heavy; clipped or counterfeit coin is refused. Haggling moves a price by a tenth to a quarter; Church, Guild and state fees are fixed. Used gear sells at 40-70% of new; fine work costs 2-4 times, masterwork 5-10 times. Prices never scale with the buyer's power or reputation. Sapient beings are never livestock. Specialists cluster in cities, temples, academies and Guild centers; a frontier village may have no healer at any price.
```

### What was removed or moved, and why

- Removed "Money is three coins: copper (also called bronze), silver and gold. 1 gold = 10 silver = 100 copper. Write amounts in coins..." : Story Block already states the coins, their worth and the "write amounts in coins" rule from the pack.
- Merged into one paragraph; "whatever they can carry" and the second price sentence dropped; "Sapient beings are never livestock" kept (keywords include slave, slaves, slavery, livestock).
- Wages, haggling, fees, resale and fine-work multipliers, "prices never scale with the buyer" and the frontier-healer line all kept.

---

## Questions for you

- **Naming** is the riskiest switch: a new innkeeper gets invented without anyone typing "name". I left a one-line stub (never a stock fantasy name) always on in Authority. If you want the full list always on, flip Naming back to constant (+1176 chars per reply).
- **No plot armor** is gone from the lore on the strength of the RPG module saying it; with RPG Battle off nothing says it. Say if you want a six-word line back in Causality.
- **Typical level by role** (how strong a generated NPC is) now appears only when level/rank/guild words come up. Say if NPC power should stay always-on.
- The coin worth line (1 gold = 10 silver = 100 copper) relies on Story Block stating it from the pack's currency.
