# Ersveil rules pack: drafting prompt (for Gemini), then review

## How to use it

1. Open a new chat with Gemini and attach these files:
   - From this folder: `rules-v2.schema.json`, `example-rules-pack.json` and `ersveil-pack-current.json`.
   - From your Ersveil zip: `Ersveil_World_Lore_v1_24.json`, `Ersveil_Map_Lore_v1_16.json`, `Ersveil_Routes.json` and
     `Ersveil_PC_Wessel_Persona_and_Kit.txt`.
2. Paste the **Master prompt** below.
3. Then paste each **Step** prompt, one per message, in order. Save every JSON answer as its own file:
   `step1-classes.json`, `step2-skills.json`, and so on. Steps 3 and 4 are long, so do them one class at a time,
   as the step says.
4. Send the files back to the lead (a Sonnet reviewer joins them and runs Story Block's checker on the result). Don't
   hand-fix numbers: the checker's errors say exactly what to change.

---

## Master prompt (paste first)

```
You are converting the Ersveil setting into an RPG Battle "rules pack" (schema 2) for Story Block. The attached
rules-v2.schema.json is the exact, closed format: every object has only the listed fields, every field listed as
required must be present, and nothing else is allowed. example-rules-pack.json shows a tiny valid pack (its names
are placeholders — never copy them). ersveil-pack-current.json is the existing Ersveil pack: its items, places,
creatures, shops, recipes, quests and ranks are already written; KEEP their slugs and names exactly and build on them.
The lorebooks (World Lore, Map Lore, Routes) and Wessel's kit are the source of truth for names, classes, skills,
places, factions, monsters and prices. Use the lore's own names and terms; invent only what the lore leaves open, and
keep it consistent with the lore's tone.

Hard rules (the checker refuses anything else):
- Output ONLY a JSON code block per answer, no comments inside the JSON, no trailing commas.
- Slugs: lowercase letters, digits and single hyphens (e.g. "river-warden"), at most 64 characters; a skill's slug at
  most 52 characters. Names 1–80 characters. Notes at most 240 characters. No "<" or ">" anywhere.
- References between records use the referenced record's slug (e.g. a class lists its skills by skill slug).
- Place and NPC references are full ids, not bare slugs: a place is "pack.ersveil-bluewatch/<place slug>" using the
  place slugs of ersveil-pack-current.json (e.g. "pack.ersveil-bluewatch/bluewatch"); an NPC giver is
  "npc/<lowercase-hyphenated-name>" (e.g. "npc/marta-vell"). Quest objective ids are "<quest slug>/<short-id>".
- Stats are STR, VIT, AGI, DEX, INT, LUK, CHA. Stat values 1–99.
- Classes: tiers 0–3. Tier 0 classes have parent null; every other class's parent is a class exactly one tier lower.
  Every class has exactly 3 skills, and each skill belongs to exactly one class. Every chain ends at tier 3.
- Skill "base" form: type is one of physical, magic, heal, buff, debuff. cost is {mp, sp, cooldown}: a physical skill
  uses sp > 0 and mp 0; every other type uses mp > 0 and sp 0; cooldown 0–10. 1 to 4 effects. unit is null unless
  the skill summons (then {kind, class, statShare, poolShare, rounds}).
- Effects:
  damage {op:"damage", target:"one"|"all", power 1–1000, element, damageType:"physical"|"magic"};
  heal/shield {op:"heal"|"shield", target:"self"|"ally"|"allies", power, element, damageType:null};
  condition {op:"condition", target, kind, chance 1–100, rounds 1–6} — poison/burn/bleed/stun/daze/slow/weaken target
  "one"|"all" (foes), regen/guard target "self"|"ally"|"allies";
  stat {op:"stat", target, stat, amount −10..10 not 0, rounds 1–6} — positive amounts target friends, negative foes.
  element is one of none, fire, ice, lightning, poison, holy.
- POWER BUDGET (the checker computes this; stay at or under it):
  score of one effect: damage/heal/shield = ceil(power/10); condition = ceil(chance/25) × rounds;
  stat = 2 × |amount| × rounds; then × 3 if the target is "all" or "allies" (× 1 otherwise). Add the effects, plus 12
  if unit is not null.
  Budget for a skill's base form: tier 0 → 12, tier 1 → 24, tier 2 → 36, tier 3 → 48.
  Each path step adds 12: a tier-3 step-1 form → 60, a step-2 form → 72.
  Example: a tier-0 single-target physical strike with power 100 scores 10 (fits 12); the same against "all" scores 30
  (too high for tier 0 — needs tier 2).
- Money is copper (1), silver (10), gold (100). Follow the pack's existing prices and ranks.
```

---

## Step 1: the class tree

```
Step 1. From the lore's classification / Soul Class / magic tradition entries and Wessel's kit, design the class
tree. Output {"classes":[...]} where each class is {"slug","name","tier","parent","skills":[3 skill slugs],"note"}.
Requirements: 3 to 5 tier-0 classes (the starting classes the lore supports), each branching to 1–3 tier-1 classes,
and so on to tier 3; at most 40 classes in total and at most 27 at tier 3. Every class has exactly 3 skill slugs (the
skills come in step 2). Put a one-line lore note on each class. Also output, after the classes, a short plain list
(outside the JSON) of which lore entries each tier-0 class comes from.
```

## Step 2: the skills (base forms)

```
Step 2. For every skill slug named in step 1, write the skill: {"slug","name","note","base":{"type","stat","cost",
"effects","unit"}}. Output {"skills":[...]} — do it in batches of up to 30 skills per answer, in class order, and
say "continue" until all are done. Each skill's base form must fit the budget of its class's tier (tier 0 → 12,
1 → 24, 2 → 36, 3 → 48). Show, after each skill (outside the JSON, as a plain line), its computed score, e.g.
"river-cut: damage 100 one → 10 / 12". Use the lore's names for techniques and spells where they exist.
```

## Step 3: tier-3 skill paths (one tier-3 class per answer)

```
Step 3. Only tier-3 skills have paths. For the tier-3 class I name, write its branches. For each of its 3 skills:
step 1 has exactly two written branches from the base form (choices "a" and "b"; "g" is generated by the engine —
never write it); then for EACH of the three step-1 forms (a, b and the generated g) exactly two written step-2
branches (choices "a" and "b"). That is 8 written branches per skill and 24 per class.
Each branch: {"slug","skill","fromForm","step","choice","name","note","transforms":[...]}.
- Form ids: the base form is "<skill>-base"; a step-1 form appends "-a", "-b" or "-g"; a step-2 form appends another
  letter to its parent. So "fromForm" for step 1 is "<skill>-base", for step 2 it is "<skill>-base-a",
  "<skill>-base-b" or "<skill>-base-g". The branch slug must equal the form id it creates (e.g. "river-cut-base-a",
  "river-cut-base-g-b").
- A branch copies its parent form and applies transforms in order: set-target, set-element, set-power,
  replace-effect, and the other ops in the schema's $defs.transform; "at" is the effect index 0–3.
- Budget: a step-1 form ≤ 60, a step-2 form ≤ 72 (the parent's score plus your changes). Show each branch's score
  outside the JSON.
- The two choices should feel like different directions (e.g. a: wider and weaker, b: focused and elemental).
Output {"branches":[...]} for this one class. I will then name the next tier-3 class.
```

## Step 4: item rules (every item in the pack)

```
Step 4. For every item in ersveil-pack-current.json's content.items (all of them, same order), write one item rule:
{"def":"<item slug>","allowedSlots":[...],"hands":0|1|2,"requires":{},"weight":<integer grams-ish, 0–10000>}.
Slots are weapon, offhand, head, body, legs, feet, accessory-1, accessory-2. Rules: a weapon is hands 1 or 2 with
allowedSlots ["weapon"] (a two-hander is hands 2); a shield or off-hand item hands 1 ["offhand"]; armour hands 0 in its
one body slot; a ring/amulet/charm hands 0 ["accessory-1","accessory-2"]; anything not worn (food, potions, materials,
loot, coins) hands 0 and allowedSlots []. "requires" lists only real minimum stats (e.g. {"STR":8} for a heavy axe),
otherwise {}. Output {"itemRules":[...]}. List any item whose slot you're unsure of, outside the JSON.
```

## Step 5: foes

```
Step 5. Rewrite ersveil-pack-current.json's creatures as schema-2 foes and add the lore's other common monsters
(dungeon and wilderness ones the Map/World lore names), up to about 40 foes in total. Each foe:
{"slug","name","tier":0–9,"level":1–99,"stats":{all 7 stats},"skills":[1–3 skill slugs from step 2],"loot":[{"def":
"<item slug>","chance":0–100,"qty"}],"loreTags":[...]}. Keep existing creature slugs. Loot uses item slugs from the
pack (add a short list, outside the JSON, of any NEW loot items you need, with name, value in copper and a one-line
description — they'll be added as items). Match level and stats to the lore's danger ranks.
Output {"creatures":[...]}.
```

## Step 6: quests

```
Step 6. Rewrite the pack's quests as schema-2 quest templates and add guild and story quests from the lore, up to
about 30, spread over the ranks. Each quest: {"slug","name","category":"main"|"side"|"bounty","giver":null or an NPC
id,"turnInPlace":null or a place id,"requirements":[...],"objectives":[1–8 of kill/collect/visit/story],"reward":
{"coin","xp","items"},"durationMinutes":null or minutes,"repeat":null or as the schema says,"chain":...}.
Objective ids are "<quest slug>/<short-id>". Rewards follow the ranks' reward ranges in the pack. Use foe slugs from
step 5, item slugs from the pack, place ids as in the master prompt. Output {"quests":[...]}.
```

## Step 7: trainers, shops, recipes

```
Step 7. (a) Trainers: one per place the lore says teaches (guild halls, academies, temples), each
{"slug","name","place":<place id>,"skills":[skill slugs they teach],"fee":copper,"minutes":60,"eventTemplates":[]}.
(b) Rewrite the pack's shops and recipes in the schema-2 shapes (shop: slug, name, place, kind, stock of
{item, qty, price}; recipe: slug, name, craft, makes, qty, materials, fee, minutes, dc 5–40, stat like "DEX" or
"STR+DEX"), keeping slugs, and add shops the lore names. Prices are the item value or a markup up to ~3×, never less.
Output {"trainers":[...],"shops":[...],"recipes":[...]}.
```

---

## Review (the lead's side, not for Gemini)

A Sonnet agent joins the step files into `content.rules[0]` (`slug: "rules"`, `schema: 2`, `name`, `statLabels`,
`memory: "deja-vu"`, classes, skills, branches, itemRules, trainers) plus `content.creatures/quests/shops/recipes`,
adds `rb-rules-v2` to `requires.capabilities`, then runs Story Block's `validatePack` and fixes what the checker
reports (budgets, references, branch graph). It also checks the pack's money against `docs/v2/PACKS.md` "Rules for a
pack's own numbers". Lore files stay with you; only the finished pack goes into a repo.
