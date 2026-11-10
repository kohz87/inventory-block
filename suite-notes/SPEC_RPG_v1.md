# Lean RPG on Story Block data modules: design spec

Status: design only, 28 Oct. No code, no repo changes. Built on the user's decisions of 28 Oct (V2_LOG.md, the last
entries) and the approved combat display (mockup D). Base: Story Block (SB) main `8a2fd12`, Story Director (SD) main
`6cebe98`. Source facts with file references: [NOTES-sources.md](NOTES-sources.md). Reading time about 25 minutes.

---

## 1. Summary (one screen)

**What you get.** A light RPG that lives in three pack data modules (Character, Skills, Combat) and replaces RPG
Battle for your chats:

- **Character**: Health, Mana and Stamina are words (Unhurt … Down; Fresh … Empty). The narrator changes them. Stats are
  numbers (1–20), used only for dice. Soul Class (I–IX) goes up through XP: the narrator awards XP, code adds it up and
  caps it, and at 100 a "Class up?" card asks you to confirm.
- **Skills**: you add your own skills from the screen. The narrator only updates skills that exist (practice, rank
  progress). Novice → Adept → Expert → Master, with a "Rank up?" card at the top of the bar.
- **Combat**: up to 5 foe slots (a group counts as one, for example "Sluice Rats ×6"). Before each reply a small extra AI
  call reads what you wrote and picks the stat, skill, target and edge for you and your companions. Code then rolls the
  dice. The narrator has to tell those results. A swipe rolls again.
- **The battle log** is the black panel from mockup D. It sits inside the AI message where the narrator writes
  `[battle]` and can fold to one line.
- **Every value can be tapped and changed.** You fix a missed line yourself; your fix shows in "Changed this reply".

**Honest size.** Not only a data pack. About half of it is pack JSON on today's data-module machinery: fields, word
ladders, XP, the narrator lines, screens, Setup, replay. The other half is **new but small code in Story Block**:
reader-added rows, tap-to-edit, confirm cards, prompt text in modules, the pre-call with its dice, the battle-log panel
and Studio forms. Story Director gets one small switch for story-only quests. No fight engine: no HP numbers, no damage
formula, no status effects, no initiative maths.

**Plan.** Three releases, lowest risk first:

| Release | What you can play after it | Agent build | Review rounds | Elapsed (with mockups) |
|---|---|---|---|---|
| R1 Sheet & words | Character, Skills, foe slots, XP/rank cards, death end state, tap-to-edit. Ersveil as an open world without RPG Battle. SD story-only quests. **No dice yet**: fights are narrated with words. | 7–9 h | 5–6 | ~2 days |
| R2 Dice & battle log | The pre-call, opposed rolls, several exchanges per reply with stop points, the inline battle log, one-line rolls for checks outside fights | 9–12 h | 6–8 | ~2.5–3 days |
| R3 Gear, knobs, Studio | Equipped-gear bonuses, Setup prompt override, Story Studio forms and simulator for all of the above | 6–8 h | 3–5 | ~1.5 days |

That totals about 6–6.5 working days. It is more than the rough "≈ 3.5–4 days" said earlier, because the review rounds
are counted at the observed rate (§7).

---

## 2. Ground rules and non-goals

- **Pack data first.** Rules, words, numbers, prompt texts and the formula are fields of the frozen data-module
  definitions. New code is generic: any pack can use it, and nothing in it is Ersveil-only.
- **Code owns the dice and the sums.** The AI owns the story: the pre-call picks the actions and the narrator tells the
  story and sets the words. The AI never writes a number that becomes a roll result.
- **Same replay contract** (REPLAY.md): guards only ask the prefix, `recorded`, declared replay queries and
  `story.evidence`. Delete, swipe, Re-read, rebuild and reload all give the same state as live play. Nothing is rolled
  on replay, and only a new generation (a swipe) rolls again.
- **Unused means byte-identical.** A chat without these pins gets the same prompt, the same saves and the same RNG draws
  as today.
- **Out of scope:** HP or damage numbers, status effects, initiative maths, loot tables, rest/recovery timers (rests are
  narrator lines), narrator-created rows, migration of existing chats, and the custom tracker builder (roadmap, §10).

---

## 3. How a turn plays (R2 complete)

1. You write *"I hit the lead rat with Iron Breath, Ren covers me with Spark."*
2. **Pre-call** (one small, cheap call before the reply). It sees your message, the party (stats, class, words, skills),
   the foe slots and a short excerpt of the last reply. It answers in a few fixed lines:
   ```text
   pace: normal
   act Wessel | skill: Iron Breath | stat: STR | target: Sluice Rat A | edge: +2 ambush from the drain lip
   act Ren | skill: Spark | stat: INT | target: Sluice Rat B
   foe Sluice Rat A | target: Wessel | defend: AGI
   foe Sluice Rats | hold
   ```
3. **Code resolves.** It checks every name against the sheet. A skill whose resource is **Empty** is refused, and that
   actor acts without the skill. Code then rolls opposed d20s for each action, round by round, up to the pacing limit
   (§4.5). The results go into the prompt as a `[Rolls]` cue under [Happened], the same way Assist's pre-roll does today.
4. **The narrator** tells the rounds in order. It writes `[battle]` on its own line where the fight goes and stops at the
   first stop point. Its change lines record what happened: words, foe changes, how many rounds it told, XP and practice.
5. **The display** draws the battle log at `[battle]` from the recorded rolls. Without a marker, the same panel appears as
   a card under the reply. "Changed this reply" lists every change, and edits you made are marked "(you)".
6. If something is wrong, you tap the value and fix it, or you swipe. A swipe means a new pre-call and new dice.

---

## 4. Architecture

### 4.1 Pack data vs new code at a glance

| Part | Pack data (no new code) | Needs new code |
|---|---|---|
| Health/Mana/Stamina words, foe health | enum fields, narrator kinds, screens | — |
| Stats, Soul Class, XP, per-reply XP cap, "Class up" action | int/map fields, `xp` kind with bounded amount + `oncePerReply`, `classup` ui kind | the confirm **card** under the reply; display names (I–IX) |
| Skills list | — | **reader rows** (new field type, row labels, matching, Add/Remove/Rename) |
| Tap-to-edit any value | — | **generic inline edit** command + layout editor |
| Foe slots (×5, groups with counts) | map fields keyed `s1…s5`, kinds `foe`, `foe-health`, `count`, `clear` | **text labels** (a foe's name comes from a line) |
| Combat prompt (always on), XP guidance | — | a **prompt text** section in a definition (today only the generated grammar is static) |
| Skills in the prompt only during a fight | the `fight` flag kept by a rule | a **conditional tail** part and a larger tail budget per module |
| Down → death only for someone already Down at the start of the reply | `downSettled` latch field, `death` kind with a `when` | **reply-end rules** (a system step like timers) |
| Death = "story ends here" | `alive` field, end card text | the card socket (same as confirm cards) |
| Pre-call + dice + several exchanges | the formula, DC table, edge limits, round cap and stop margin as data | **pre-call helper**, **`dm.resolve` prelude**, turn.js prelude generalised |
| Battle log inside the message | bar shares, marker text, labels | **renderer + marker handling** |
| Gear bonus | cap per item | **inventory projection adapter** |
| Setup knobs | difficulty and exchange cap = editable Combat fields | prompt override text box |
| Story-only quests | — | SD switch |
| Studio authoring | — | forms + simulator for the new parts |

### 4.2 Pack data sketches

The sketches are abridged (one example per repeated block). Field and kind names are proposals. Definitions using any
new part declare `"schema": 2` and require capability `data-modules-v2` (§4.4). Narrator lines use the existing `dm`
envelope (open question Q1).

**Character** (character scope: one instance per attached SD actor)

```json
{
  "slug": "character", "name": "Character", "schema": 2, "stateVersion": 1, "scope": "character",
  "imports": { "actors": { "query": "checks.policy", "mode": "prefix", "projection": ["actors.id", "actors.name"] } },
  "state": {
    "health":  { "type": "enum", "values": ["unhurt","grazed","hurt","wounded","badly wounded","down"], "default": "unhurt", "edit": true },
    "mana":    { "type": "enum", "values": ["fresh","steady","tired","spent","empty"], "default": "fresh", "edit": true },
    "stamina": { "type": "enum", "values": ["fresh","steady","tired","spent","empty"], "default": "fresh", "edit": true },
    "uses-mana": { "type": "bool", "default": true, "edit": true },
    "stats":   { "type": "map", "keys": ["STR","AGI","INT","VIT","WIL"],
                 "values": { "type": "int", "min": 1, "max": 20, "default": 10 }, "edit": true },
    "tier":    { "type": "int", "min": 1, "max": 9, "default": 1, "edit": true,
                 "names": ["I","II","III","IV","V","VI","VII","VIII","IX"] },
    "xp":      { "type": "int", "min": 0, "max": 100, "default": 0, "edit": true },
    "alive":   { "type": "enum", "values": ["alive","dead"], "default": "alive" },
    "down-settled": { "type": "bool", "default": false, "prompt": false }
  },
  "kinds": {
    "health":  { "op": "~", "labels": { "to": { "type": "enum", "values": ["unhurt","grazed","hurt","wounded","badly wounded","down"] } },
                 "effects": [{ "op": "set", "path": ["health"], "value": ["arg","to"] }] },
    "mana":    { "op": "~", "labels": { "to": { "type": "enum", "values": ["fresh","steady","tired","spent","empty"] } },
                 "effects": [{ "op": "set", "path": ["mana"], "value": ["arg","to"] }] },
    "xp":      { "op": "+", "oncePerReply": [], "labels": { "amount": { "type": "int", "min": 1, "max": 25 } },
                 "effects": [{ "op": "add", "path": ["xp"], "value": ["arg","amount"], "bounds": "clamp" }] },
    "classup": { "op": "~", "ui": true, "labels": {},
                 "when": ["and", ["ge", ["get",["xp"]], 100], ["lt", ["get",["tier"]], 9]],
                 "refusal": "Class up needs 100 XP and a class below IX.",
                 "effects": [{ "op": "add", "path": ["tier"], "value": 1 }, { "op": "set", "path": ["xp"], "value": 0 }] },
    "death":   { "op": "!", "labels": {},
                 "when": ["and", ["eq", ["get",["health"]], "down"], ["get",["down-settled"]]],
                 "refusal": "Only someone already Down when this reply began can die.",
                 "effects": [{ "op": "set", "path": ["alive"], "value": "dead" }] }
  },
  "rules": [{ "id": "up-again", "when": ["ne", ["get",["health"]], "down"],
              "then": [{ "op": "set", "path": ["down-settled"], "value": false }] }],
  "replyEnd": [{ "id": "settle-down", "when": ["and", ["eq", ["get",["health"]], "down"], ["not", ["get",["down-settled"]]]],
                 "then": [{ "op": "set", "path": ["down-settled"], "value": true }] }],
  "cards": [
    { "id": "class-up", "when": ["and", ["ge", ["get",["xp"]], 100], ["lt", ["get",["tier"]], 9]], "tone": "accent",
      "title": "Class up?", "text": "{name} has 100 XP.", "action": { "label": "Class up", "kind": "classup" }, "later": true },
    { "id": "dead", "when": ["eq", ["get",["alive"]], "dead"], "tone": "bad",
      "title": "The story ends here", "text": "{name} died. Swipe or delete this reply to undo it." }
  ],
  "prompt": {
    "static": "XP: write + dm character … | kind: xp | amount: N after a fight or a hard-won deed. A small fight 5–10, a dangerous one 15–25, never more than 25 in one reply. Soul Class rises only when the reader confirms.",
    "tail": "always"
  },
  "exports": { "sheet": { "fields": ["health","mana","stamina","uses-mana","stats","tier","alive"] } },
  "screens": [ { "id": "character", "title": "Character", "icon": "fa-user-shield", "mounts": ["tab"], "layout": "…list of attached characters, words + bars, stats grid, class + XP meter; every value tap-to-edit…" } ]
}
```

Narrator lines it accepts (already the v1 grammar):
`~ dm character — the blade bites deep | kind: health | who: Ren | to: wounded`,
`+ dm character — held the quay | kind: xp | who: Wessel | amount: 15`.

**Skills** (character scope, reader rows)

```json
{
  "slug": "skills", "name": "Skills", "schema": 2, "stateVersion": 1, "scope": "character",
  "imports": { "fight": { "query": "dataModules.public", "mode": "prefix",
                          "args": { "module": "pack.lean-rpg/combat", "export": "fight" }, "projection": ["fight"] } },
  "state": {
    "skills": { "type": "rows", "max": 32, "name": { "max": 40 }, "edit": true, "columns": {
      "rank":     { "type": "int", "min": 0, "max": 3, "default": 0, "names": ["Novice","Adept","Expert","Master"] },
      "progress": { "type": "int", "min": 0, "max": 20, "default": 0 },
      "uses":     { "type": "enum", "values": ["none","mana","stamina"], "default": "none" },
      "note":     { "type": "text", "max": 80, "default": "" } } }
  },
  "kinds": {
    "practice": { "op": "~", "oncePerReply": ["skill"],
                  "labels": { "skill": { "type": "row", "rows": "skills" }, "amount": { "type": "int", "min": 1, "max": 5 } },
                  "effects": [{ "op": "add", "path": ["skills", ["arg","skill"], "progress"], "value": ["arg","amount"], "bounds": "clamp" }] },
    "rankup":   { "op": "~", "ui": true, "labels": { "skill": { "type": "row", "rows": "skills" } },
                  "when": ["and", ["ge", ["get", ["skills", ["arg","skill"], "progress"]], 20],
                                  ["lt", ["get", ["skills", ["arg","skill"], "rank"]], 3]],
                  "effects": [{ "op": "add", "path": ["skills", ["arg","skill"], "rank"], "value": 1 },
                              { "op": "set", "path": ["skills", ["arg","skill"], "progress"], "value": 0 }] }
  },
  "cards": [{ "id": "rank-up", "each": "skills",
              "when": ["and", ["ge", ["get", ["skills", "$row", "progress"]], 20], ["lt", ["get", ["skills", "$row", "rank"]], 3]],
              "title": "Rank up {row}?", "text": "{name}: {row} is ready for the next rank.",
              "action": { "label": "Rank up", "kind": "rankup", "labels": { "skill": "$row" } }, "later": true }],
  "prompt": { "tail": { "when": ["input", "fight", "fight"], "show": ["skills"] } },
  "exports": { "rows": { "fields": ["skills"] } },
  "screens": [ { "id": "skills", "title": "Skills", "icon": "fa-wand-sparkles", "mounts": ["tab"], "layout": "…one card per character: rows with name, rank, progress bar, uses; Add skill; tap to edit/rename/remove…" } ]
}
```

Line: `~ dm skills — drilled the breath forms | kind: practice | who: Wessel | skill: iron-breath drill | amount: 2`.
This matches the row "Iron Breath" (§4.5.1).

**Combat** (chat scope: foe slots, fight state, knobs, and the resolve config)

```json
{
  "slug": "combat", "name": "Combat", "schema": 2, "stateVersion": 1, "scope": "chat",
  "state": {
    "foe-name":   { "type": "map", "keys": ["s1","s2","s3","s4","s5"], "values": { "type": "text", "max": 40, "default": "" } },
    "foe-count":  { "type": "map", "keys": ["s1","s2","s3","s4","s5"], "values": { "type": "int", "min": 0, "max": 99, "default": 0 } },
    "foe-tier":   { "type": "map", "keys": ["s1","s2","s3","s4","s5"], "values": { "type": "int", "min": 1, "max": 9, "default": 1 } },
    "foe-health": { "type": "map", "keys": ["s1","s2","s3","s4","s5"],
                    "values": { "type": "enum", "values": ["unhurt","grazed","hurt","wounded","badly wounded","down"], "default": "unhurt" } },
    "fight":      { "type": "bool", "default": false },
    "round":      { "type": "int", "min": 0, "max": 999, "default": 0 },
    "result":     { "type": "enum", "values": ["none","victory","defeat","fled","truce"], "default": "none" },
    "difficulty": { "type": "enum", "values": ["easy","normal","hard","deadly"], "default": "normal", "edit": true },
    "cap":        { "type": "int", "min": 1, "max": 8, "default": 5, "edit": true }
  },
  "kinds": {
    "foe":        { "op": "+", "labels": { "slot": { "type": "enum", "values": ["s1","s2","s3","s4","s5"] },
                    "name": { "type": "text", "max": 40 }, "count": { "type": "int", "min": 1, "max": 99 },
                    "tier": { "type": "int", "min": 1, "max": 9 } },
                    "when": ["eq", ["get", ["foe-count", ["arg","slot"]]], 0], "refusal": "That slot is taken; clear it first.",
                    "effects": [{ "op": "set", "path": ["foe-name", ["arg","slot"]], "value": ["arg","name"] },
                                { "op": "set", "path": ["foe-count", ["arg","slot"]], "value": ["arg","count"] },
                                { "op": "set", "path": ["foe-tier", ["arg","slot"]], "value": ["arg","tier"] },
                                { "op": "set", "path": ["foe-health", ["arg","slot"]], "value": "unhurt" },
                                { "op": "set", "path": ["result"], "value": "none" }] },
    "foe-health": { "op": "~", "labels": { "slot": { "…": "s1…s5" }, "to": { "…": "health words" } }, "effects": ["…"] },
    "count":      { "op": "~", "labels": { "slot": { "…": "s1…s5" }, "count": { "type": "int", "min": 1, "max": 99 } }, "effects": ["…"] },
    "clear":      { "op": "-", "labels": { "slot": { "…": "s1…s5" }, "why": { "type": "enum", "values": ["down","fled","yielded","captured","gone"] } },
                    "effects": [{ "op": "set", "path": ["foe-count", ["arg","slot"]], "value": 0 }, "…name to \"\"…"] },
    "told":       { "op": "!", "oncePerReply": [], "labels": { "rounds": { "type": "int", "min": 1, "max": 8 } },
                    "effects": [{ "op": "add", "path": ["round"], "value": ["arg","rounds"], "bounds": "clamp" }] },
    "end":        { "op": "!", "labels": { "result": { "type": "enum", "values": ["victory","defeat","fled","truce"] } },
                    "effects": [{ "op": "set", "path": ["result"], "value": ["arg","result"] }, { "op": "set", "path": ["round"], "value": 0 }] }
  },
  "rules": [{ "id": "fight-flag", "when": true, "then": [{ "op": "set", "path": ["fight"],
              "value": ["or", ["or", ["gt", ["get",["foe-count","s1"]], 0], ["gt", ["get",["foe-count","s2"]], 0]],
                              ["or", ["gt", ["get",["foe-count","s3"]], 0], ["or", ["gt", ["get",["foe-count","s4"]], 0], ["gt", ["get",["foe-count","s5"]], 0]]]] }] }],
  "exports": { "fight": { "fields": ["fight"] } },
  "prompt": { "static": "[COMBAT SYSTEM]\nNo Plot Armor: … (the user's full text, 865 characters) …", "tail": "fight-only" },
  "resolve": { "…": "below" }
}
```

**The pack-level combat config.** It lives in the Combat definition's `resolve` block. It is not a top-level pack key,
because only what is inside a definition is frozen into the chat's pin and hashed. Replay never reads installed packs.

```json
"resolve": {
  "sheet":  { "module": "character", "export": "sheet" },
  "skills": { "module": "skills", "export": "rows", "rank": "rank", "uses": "uses" },
  "stats":  ["STR","AGI","INT","VIT","WIL"],
  "modifier":   ["add", ["floorDiv", ["arg","stat"], 2],
                 ["add", ["mul", 2, ["arg","tier"]], ["add", ["arg","rank"], ["add", ["arg","edge"], ["arg","gear"]]]]],
  "opposition": ["add", ["arg","base"], ["mul", 2, ["arg","foeTier"]]],
  "base":   { "field": "difficulty", "table": { "easy": 3, "normal": 5, "hard": 7, "deadly": 9 } },
  "dc":     { "easy": 10, "normal": 15, "hard": 20, "very hard": 25 },
  "costMargin": 2,
  "edge":   { "min": -4, "max": 4 },
  "gear":   { "cap": 3 },
  "rounds": { "capField": "cap", "careful": 1, "max": 8, "actionsPerRound": 8 },
  "stop":   { "decisiveMargin": 8 },
  "empty":  { "mana": "empty", "stamina": "empty" },
  "words":  { "tier": "Soul Class", "success": "Success", "cost": "Success at a cost", "fail": "Fail" },
  "marker": "[battle]",
  "bars":   { "health": [100,83,67,50,25,0], "mana": [100,75,50,25,0], "stamina": [100,75,50,25,0] }
}
```

The formula is an ordinary data-module expression (depth ≤ 6, ints, bounded). Its `arg`s are supplied by trusted code:
`stat` 1–20, `tier` 1–9, `rank` 0–3, `edge` −4..4, `gear` 0..cap, `base` from the table, `foeTier` 1–9. The checker
proves the result's bounds at import. Code adds the d20 itself: authors never write a die.

A generic pack (`lean-rpg`, the tier called "Tier") and Ersveil (the same modules, named "Soul Class", lore-flavoured
words) both ship these three definitions.

### 4.3 New code, piece by piece

Sizes: **S** ≈ under 1 agent hour of build with tests, **M** ≈ 1–3 h, **L** ≈ 3 h or more. Review time is not included
here (see §7).

| # | Piece | Where | Why today's machinery can't do it | Size | Rel. |
|---|---|---|---|---|---|
| 1 | **Reader rows**: field type `rows` (cap 32, name ≤ 40, typed columns), `row` label type, 3-segment row paths, `dm.row` add/rename/remove (reader only), name matching (§4.5.1), "Unknown skill: … [Add] [Ignore]" note | SB `data-modules/{schema,check,expressions,interpreter,part}.js`, new `rows.js` | v1 has only fixed fields/map keys ("no growing authored maps"); labels are int/bool/enum; paths are 1–2 segments | M | R1 |
| 2 | **Generic inline edit**: `edit: true` on a field/column, `dm.edit {module, who?, path, value}` (cause ui), a tap editor in layouts (enum → pick, int → stepper, text → input, Save/Cancel) | SB `data-modules/part.js`, `layout/{render,schema}.js`, `view/form` | `dm.act` runs only authored kinds; there is no generic "set this field" action and no editable layout node | M | R1 |
| 3 | **Text labels**: a bounded, cleaned text label that may only be *set* into a text field (never read by an expression) | SB `check.js`, `interpreter.js` | labels are int/bool/enum; text fields are display-only | S | R1 |
| 4 | **Display names and hidden fields**: `names` for int fields (I–IX, Novice…Master) used by screens, cards and the tail; `"prompt": false` hides internal fields from the tail | SB `part.js` (summaryOf), screens | the tail prints raw values; there is no per-field display name | S | R1 |
| 5 | **dm lines in "Changed this reply"**: a `replyCard` hook listing this reply's dm changes ("Ren: Health Hurt → Wounded"), reader edits marked "(you)", refusals as today | SB `part.js`, `screens/changes-card.js` scope | the dm part has no `replyCard` hook; only refused lines show today | S | R1 |
| 6 | **Cards from definitions**: `cards: [{id, each?, when, tone, title, text, action?, later?}]`, drawn on the head reply through the existing reply-cards socket; an action runs `dm.act` of a `ui` kind | SB `part.js` + `reply-cards.js` (socket exists) | definitions cannot declare cards | S | R1 |
| 7 | **Prompt parts**: `prompt.static` (pack text, counted with the grammar in the 2000-character static limit), a conditional tail (`always`, `fight-only` or a `when` expression), and a tail room per module of up to 300 tokens (today it is fixed at 100) | SB `part.js` context, `schema.js` limits | static = generated grammar only; the tail is unconditional and limited to 100 tokens | S | R1 |
| 8 | **Reply-end rules**: `replyEnd` rules planned like timers (afterCapture + beforeGenerate, `replan`, NO_LONGER_DONE when settled) | SB `part.js` (`due`, a `dm.settle` sibling of `dm.tick`) | rules run only inside an action; nothing marks "this reply has ended" (needed for the Down → death rule) | S | R1 |
| 9 | **Prelude generalised**: turn.js treats the Assist `PRECHECK` type as special (preview with seed → commit on the generated reply before story lines → Re-read replans from payload + seed). Turn that into a list of registered prelude commands so `dm.resolve` uses the same path | SB `turn.js` (runCues, captureLines, Re-read) | the path is hard-wired to one command type | M | R2 |
| 10 | **Pre-call helper**: builds the prompt from the pins (party, rows, foes, excerpt), calls through Assist's connection profile and queue, parses the fixed answer lines, and caches per generation (a swipe calls again, a Continue never does) | SB `assist/precall.js` (sibling of `classifier.js`), Assist settings section | the classifier only proposes one `? check` with a DC; it reuses its answer on swipe; it knows nothing of rows or foes | M | R2 |
| 11 | **`dm.resolve`**: validates the plan against the prefix, refuses skills at Empty, applies the formula, rolls opposed d20s or a d20 vs a DC from the seed, sets the round count by pace / cap / decisive stop / cue budget (§4.5.3), uses SD's outcome rule, records everything, writes the `[Rolls]` cue, guards with witnesses | SB new `data-modules/resolve.js` + `part.js` guard dispatch | the interpreter has no dice; SD `checks.roll` is one d20 against a fixed DC with SD's own modifiers and refuses supplied ones (§4.4) | M–L | R2 |
| 12 | **Battle-log renderer**: finds the marker in the shown message, draws panel D from the reply's resolve record, its told count and the before/after state; foldable; falls back to a card (variant C) without a marker; one-line roll for checks; keeps the marker out of prompt history | SB new `view/battle-log.js` (+ css), `ui-host.js` mount, `turn.js` history strip | cards mount only *under* replies; nothing draws inside `.mes_text`; history strips only hidden change blocks | M–L | R2 |
| 13 | **Gear adapter**: a pure public projection `inventory.equipped` (def, name, slot, stats of equipped party items) for the pre-call and the resolver; bonus = item stat, capped | SB `data-modules/adapters.js`, inventory queries | no adapter reads inventory; without RPG Battle, items belong to `party`, so nothing links an item to a character | S–M | R3 |
| 14 | **Setup knobs**: difficulty and exchange cap are editable Combat fields (no code). Prompt override is a per-chat text box in the Data modules Setup card that replaces the module's `prompt.static` for this chat (chat metadata, not game state) | SB `data-modules/setup.js` | Setup can pin and attach only | S | R3 |
| 15 | **Story-only quests switch** (SD): new quests are logged with notes, done and failed states, no pay, no templates, no reward in the tail. The flag is frozen on each quest when it is taken | SD `tracker/{writers,capture,note,quest-shape}.js`, settings | quests always price and pay rewards | S–M | R1 |
| 16 | **Checker, limits, fuzz, unused differential** for every new definition part; interpreter 2 | SB `schema.js`, `check.js`, `tests/v2/data-modules/` | new language parts need closed descriptors and replay fuzz | M (split R1/R2) | R1–R2 |
| 17 | **Studio**: forms for rows, edit flags, text labels, names, cards, prompt, replyEnd, resolve; the simulator runs resolve with a fixed sample plan and seed | Story Studio (vendored SB via `sync-sb`) | Studio knows schema 1 only | M–L | R3 |
| 18 | **Packs and docs**: generic `lean-rpg` example; Ersveil without `rules` / `rb-rules-v2`, plus the three modules; GUIDE and ERSVEIL pages | SB `examples/packs/`, `docs/v2/` | content | M | R1 (+R2 resolve) |

**What we do not need.** The specced-but-unbuilt **v1.1 "SD checks inside a dm root"** adapter is not needed (see §4.4).
That adapter was the design's top risk, because it joins SD's roll, practice and module fields under one root guard.

### 4.4 The honest answer to "isn't it only a data module pack?"

- **Pure pack data on today's code:** word ladders, stats, XP with its cap, the class-up action, foe kinds (apart from
  the foe's name), told/end kinds, the fight flag, screens (minus tap-to-edit), Setup pin/attach, replay of all story
  lines. That is roughly half of the feature.
- **New generic code that packs then use:** items 1–8 and 13–14 (and 16). Each one is small. Together they form a
  "data-modules v2" language step: schema 2, capability `data-modules-v2`. Schema 1 pins keep interpreter 1's frozen
  semantics, and interpreter 2 is a superset.
- **New RPG-specific code:** items 9–12 (pre-call, prelude, resolve, battle log). This is the "engine", and it is kept
  small on purpose: one formula, two kinds of roll (opposed, or vs a DC), round repetition and stop rules. There is no
  damage, no HP and no initiative.
- **Why SB rolls and not SD.** SD's `checks.roll` is built to refuse a caller-supplied modifier. It rolls one d20 against
  a fixed DC, with modifiers from SD's own actor bonuses. An opposed roll with the pack's formula would need SD to accept
  SB's modifiers and a second die, joined under one root guard. That is the costly v1.1 composition. Instead, `dm.resolve`
  rolls in SB from the receipt seed and uses **SD's outcome rule and words** unchanged: natural 20 succeeds, natural 1
  fails, ≥ opposition succeeds, within `costMargin` (default 2, SD's default) is Success at a cost, otherwise Fail. SD
  stays untouched apart from the quests switch.

### 4.5 Mechanics in detail

#### 4.5.1 Reader rows and name matching

- **Created, renamed and removed only by `dm.row`**, a reader action from the Skills screen (cause `ui`, never
  narration, never another module). The cap is 32 rows per subject. Names are 1–40 characters, cleaned like item names
  (NFC, no invisible characters, single spaces). A name is unique per subject after folding.
- **Row id** = `rw_` + 8 base36 characters, from a hash of the block identity (sid, swipeKey, block id), so it is the same
  live and on replay. It is never taken from a message index.
- **Fold** = lower case, with every run of spaces and hyphens removed ("Iron-Breath" = "iron breath" = "ironbreath").
- **Match** (one helper, used by narrator `row` labels and by the pre-call's `skill:`): a row matches when its folded name
  occurs inside the folded phrase. Extra words before or after are allowed ("iron breath drill" → Iron Breath). The
  longest matching name wins. If two different rows of the same longest length match, the phrase is ambiguous and nothing
  matches. "Fire" and "Fireball" in "fireball" → Fireball wins.
- **No match**: the line is refused (nothing applied), and the card shows **"Unknown skill: iron breth — [Add] [Ignore]"**.
  Add opens the Add-skill editor pre-filled with the phrase; it runs `dm.row add` and is the only way a suggestion becomes
  a row. Ignore folds the note (viewer state, like the card "Later"). Neither one re-applies the refused line. The line
  stays refused unless you Re-read the reply after adding the row (the note says so).
- **Narrator cannot create rows** and is told so in the generated grammar ("skill: one of the listed skills").

#### 4.5.2 Inline edit

- Any field or row column with `edit: true` shows as tappable on module screens. Tap → editor (enum: pick from the words;
  int: stepper within bounds; text: input within max; row name: rename; row: Remove with a confirm) → **Save** runs
  `dm.edit`, Cancel writes nothing.
- `dm.edit` is an **absolute set** that ignores the old value. Its guard witnesses only the pin and generation, the
  attached subject, the row's existence (for a cell) and the frozen `edit` flag. It does not witness the old value, so
  after a Re-read of that reply your fix still applies after the new story lines (your value wins).
- It rides on the latest reply like Drop does. It shows as "Ren: Health Hurt → Wounded (you)" in that reply's "Changed this
  reply" card. A swipe or delete of that reply loses it (decided; no carry-over).
- It takes effect for the next prompt and the next pre-call ("changes apply from the next reply").

#### 4.5.3 Pre-call, resolve and pacing

**When the pre-call runs.** Before a normal send, a regenerate or a swipe, when the Combat module is pinned and the
reader's message is not empty. It never runs on a Continue, impersonate, quiet or background prompt, or a dry run.
A setting "Rolls" offers *fights and checks* (default), *fights only* (skipped while no foe slot is filled) or *off*.
When the Combat module is pinned, Assist's old pre-roll classifier steps aside in that chat, so there is never a second call.

**The answer** (fixed lines; anything unreadable is dropped line by line):

| Line | Meaning |
|---|---|
| `pace: careful \| normal \| all` | careful = 1 round; normal = the chat's cap (default 5); all = up to `rounds.max` (8). The pre-call reads the player's words ("carefully", "fight it out"). |
| `act <who> \| skill: <phrase>? \| stat: <STAT> \| target: <foe> \| edge: ±n <reason>?` | a party member's action (the player and companions; companions act on their own) |
| `foe <foe> \| target: <who> \| defend: <STAT>` or `foe <foe> \| hold` | what a foe slot does; the defender rolls with `defend` |
| `check <who> \| skill: <phrase>? \| stat: <STAT> \| dc: easy\|normal\|hard\|very hard` or `\| vs: <name> \| tier: n` | a non-combat check (sneak, persuade, climb) |
| `new <name> \| tier: n \| count: n` | a foe that is not in a slot yet (the fight starts this reply); recorded in the roll only. The narrator fills the slot with a `+ … kind: foe` line |
| `none` | nothing uncertain: no rolls |

**Resolve** (`dm.resolve`, the prelude command, payload = the parsed plan):

1. Validate each name against the prefix: `who` must be attached, `target` must be a filled slot or a `new` foe, `stat`
   must be in `resolve.stats`, and `edge` is clamped to its bounds. The skill goes through the row matcher; with no
   match, the actor acts without a skill (rank 0) and the card shows the Unknown-skill note.
2. **Resource refusal**: if the matched skill `uses` mana or stamina and that word is `empty`, the skill is refused.
   The action is rolled without it and the cue says "Ren cannot use Spark (Mana Empty)". Nothing else spends resources:
   the narrator moves the words afterwards. A light spell barely moves them; the AI decides.
3. **Rolls**: player side = d20 + `modifier`. Foe side = d20 + `opposition`. A check uses d20 + `modifier` vs a DC, or vs
   an opposed NPC (d20 + base + 2×tier). The outcome uses SD's rule (§4.4). Turn order = the order of the plan's lines.
4. **Rounds** = the smallest of: the pace value, the chat's `cap`, `rounds.max`, the **decisive stop**, and what fits the
   cue budget (600 tokens). The decisive stop is the end of the first round that holds a natural 1 or 20, or a margin of
   at least `stop.decisiveMargin` either way. Each round repeats the same actions with new dice: the plan stays the same
   for the whole reply, and a stop point hands the next decision back to the player.
5. **Cue** under [Happened], for example:
   ```text
   [Rolls] Code rolled these. Tell them in this order and as given; write [battle] on its own line where the fight is told.
   Round 1: Sluice Rat A attacks Wessel: FAIL for Wessel (12 vs 15).
   Round 1: Wessel uses Iron Breath on Sluice Rat A: SUCCESS (26 vs 16).
   Round 1: Ren casts Spark on Sluice Rat B: SUCCESS AT A COST (17 vs 18).
   … Round 3 is decisive: stop there at the latest. Stop earlier at the first stop point (a foe falls, flees or yields;
   anyone on your side is Down or Badly wounded; new foes arrive). Then write: ! dm combat — | kind: told | rounds: N
   ```
6. **Stop points stay narrative.** The narrator decides where the story stops within the rolled rounds and reports it
   with `told`. Rounds after that are void: they are never shown and never counted, and the next reply rolls anew.
   No `told` line → the panel shows all rolled rounds with a small note.
7. Pre-call failure (timeout, unreadable, no connection): no rolls. The tail says "No rolls this reply: keep the fight
   undecided, one exchange, nobody goes Down." The card says "Rolls skipped: swipe to try again."

**Odds** (the 28 Oct figures for the agreed formula). A Class II hero with STR 14 and an Adept skill has +12. Against a
Class I foe (+7) about 70 % success, Class II about 62 %, Class IV about 43 %, Class VI about 26 %, Class VIII about 14 %.
On top of that, about 4 % land 1–2 short and become Success at a cost.

#### 4.5.4 The battle log and the marker

- The renderer runs at display time (ST's message-rendered events) for every reply that has a `dm.resolve` record. It
  finds the first line in the shown message that equals the marker (case-folded, trimmed) and draws panel D there. Its
  inputs are the recorded rolls, the reply's `told` count, and the reply's state compared with the state before it.
  Extra markers are hidden. With no marker, the panel becomes the card under the reply (variant C), placed above
  "Changed this reply".
- Content (mockup D): a header "Combat · Exchange n" (a Font Awesome icon, not the ⚔ glyph) that folds; "Turn order:";
  "Round n" blocks; one line per action with the coloured result word and "(26 vs 16)", with the breakdown on tap
  ("d20 14 + STR 7 + Class II 4 + Adept 1 = 26 vs d20 9 + 5 + Class I 2 = 16"). The consequence arrow
  ("→ Sluice Rat A Wounded") comes from the narrator's word changes in that reply and sits on the last told action aimed
  at that target. Then "[Combat ended: Victory]" when the reply holds an `end` line, a Status grid with aligned solid bars
  (shares from `resolve.bars`), and a Foes line ("Fled"/"Down" from `clear` lines).
- A check shows as **one line in the message** ("Wessel — Stealth (DEX): 19 vs 15 — Success", breakdown on tap), at the
  marker if there is one, otherwise above the prose (a mockup will confirm the placement).
- **Out of the prompt.** When building prompt history, marker lines are removed from AI messages, the same way hidden
  change blocks are removed today. The narrator never sees its own old markers, and no panel text is ever in the chat
  text.
- The fold state is the viewer's (localStorage per chat and reply), not game state.

#### 4.5.5 Prompt parts

- **Static** (byte-identical reply to reply; it changes only when a pin changes): the [COMBAT SYSTEM] text (always on),
  the XP guidance, the generated grammar of all three modules, and one line on rolls ("When [Rolls] is given, narrate
  those results; never invent a roll; write no `? check` lines").
- **Tail** (changes with state): the party's words, class and XP (always); foes and the skills list (only while
  `fight` is true); the `[Rolls]` cue (on a reply that has rolls).

#### 4.5.6 Down, death and the end state

- `~ … kind: health … to: down` → that character is Down. During that reply, a `death` line for them is **refused** (the
  `down-settled` latch is still false). The reply-end rule sets the latch at the end of the reply, so in the next reply a
  death line counts. Any health word other than down clears the latch (a rule). The same applies to companions. Foes
  simply have their slot cleared with `why: down`.
- Death sets `alive: dead`. The card "The story ends here — Wessel died. Swipe or delete this reply to undo it." sits on
  the head reply while it is true, and the tail tells the narrator the story has ended (epilogue only). Nothing blocks
  SillyTavern (Q6).

#### 4.5.7 Story-only quests (SD)

Setting **Quests → Story-only quests** (off by default; recommended on for these chats). New quests taken while it is on
carry `storyOnly: true`. They have no template, no reward and no pay, and turn-in simply closes them (done / failed),
keeping their notes. The tail and the Quests row show no reward. The flag is frozen on the quest when it is taken (guards
never read settings), so switching it later changes only new quests.

#### 4.5.8 Ersveil

Ersveil 2.0.0 (a major version: incompatible) drops `content.rules` and the `rb-rules-v2` capability. Races, talents,
ranks and creatures stay as lore and as pack data that SB and SD already read without RPG Battle, or move to the lorebook
where only RPG Battle used them (checked item by item during the build). It adds the three modules with "Soul Class"
naming. Your chats restart from scratch, so there is no migration.

---

## 5. Replay behaviour of every new piece

Rule of thumb: story lines behave like any dm line. Reader actions behave like Drop. The pre-call result and the dice
behave like Assist's pre-roll: recorded at capture, never rolled again on Re-read, rolled anew only by a new generation.

| Piece | Stored as | Swipe (new generation) | Delete of that reply | Re-read of that reply | Rebuild / reload |
|---|---|---|---|---|---|
| Rows `dm.row` | a click block on the head reply; guard witnesses pin/gen, subject, the folded names set and the row count (cap), and the row id for rename/remove | lost (decided) | lost; later lines that used the row go inactive (`REPLAY_PREREQUISITE`) | kept (clicks are kept), re-asked in its new position | stored ops |
| Narrator `row` label | dm.act; `recorded` holds the matched row id; the guard witnesses that row and the hash of the subject's folded names | gone with the reply | gone | the line is captured again and matched again on the prefix | stored ops |
| `dm.edit` | click block; absolute set; witnesses pin/gen, subject, row existence and the frozen `edit` flag (not the old value) | lost (decided) | lost | kept and applied after the new lines (your value wins) | stored ops |
| Cards | not stored: derived from the head state at each draw; their actions are ordinary `dm.act` clicks | follow the head | follow the head | follow the head | — |
| Reply-end rules (`dm.settle`) | a system step, `replan: true`, NO_LONGER_DONE when nothing to settle | gone; reconcile re-plans | gone; reconcile re-plans later ones | planned again on the new lines | stored ops |
| Pre-call answer | not state: it becomes the `dm.resolve` payload | **new pre-call**; the in-memory cache keys on the generation, never the message | — | **not called again** (payload saved) | — |
| `dm.resolve` | prelude block on the generated reply, before its story lines: claim `dm:resolve:<sid/swipeKey>`, `recorded` = plan, modifier inputs, gear, seed; the result (rolls, rounds, refusals) in `data.v2.result` (survives trimming); `replan: true`; no field writes | **new seed, new dice** | gone with the reply | **same payload + same seed → same dice**; re-planned on the prefix as it stands | stored ops; the record keeps the numbers |
| `told`, `end`, foe and health lines | ordinary dm.act | gone | gone | captured again | stored ops |
| Battle log, roll line | not stored: drawn from the record + state; the marker is stripped from prompt history | redrawn for the new swipe | gone | redrawn (marker moved by an edit → panel follows) | redrawn |
| Prompt override | chat metadata, not game state | — | — | — | not replayed (prompts aren't) |
| Gear bonus | recorded in `dm.resolve`; witnesses the equipped item's def and stats on the prefix | new roll | — | re-planned with the same seed | stored |
| Story-only flag (SD) | a field on the quest at creation; in `recorded` of the turn-in | ordinary | ordinary | ordinary | stored |

**One subtlety (accepted, same as Assist today).** `dm.resolve` is a re-planned step. If an *earlier* reply is deleted
or swiped and that changes a modifier (a stat edit, a rank, the gear), the reconcile re-plans the later roll with the
same dice and the new modifiers. Its outcome can then differ from what that reply's prose told. The card says "re-planned
after an earlier change: Success → Fail". Edits ride on the latest reply, so this needs a deliberate delete of history.
Alternative in Q7.

**Tests that prove it.** The data-module fuzz (`scripts/fuzz-data-modules.mjs`) is extended with row add/rename/remove,
edits, card clicks, settles, resolves with fixed plans, swipes, deletes, Re-reads and reloads. After every step,
incremental and cold replay must agree. Guards must never query outside their declarations or roll. The "unused" byte
differential is re-run with an installed but unpinned lean-rpg pack. A Re-read must keep the dice (seed equality), and a
swipe must change the seed.

---

## 6. Prompt budget

| Part | When | Size |
|---|---|---|
| [COMBAT SYSTEM] | always (static, cache-friendly) | 865 chars ≈ 215 tokens |
| XP guidance + roll rule line | always (static) | ≈ 100 tokens |
| Generated grammar (≈ 14 kinds over three modules) | always (static) | ≈ 1,400 chars ≈ 350 tokens |
| **Static total** | | **≈ 650–700 tokens**, sent every reply, unchanged reply to reply |
| Party words + class/XP (tail) | always | ≈ 20 tokens per character (≈ 60 for 3) |
| Foes (tail) | in a fight | ≈ 40 tokens |
| Skills list (tail) | in a fight | ≈ 8 tokens per skill (≈ 130 for 2 characters × 8 skills; up to 300 per module allowed) |
| `[Rolls]` cue | replies with rolls | ≈ 20 tokens per action-round + 60 header; capped at 600 (rounds are cut to fit) |
| **Tail outside a fight / in a fight** | | **≈ 60–80 / ≈ 300–700 tokens** |
| **Pre-call** | one extra call per reply (as above) | input ≈ 700–1,000 tokens (≈ 300 fixed head, cacheable; message ≤ 800 chars; party, rows and foes ≈ 250; last-reply excerpt ≤ 600 chars), answer ≤ 250 tokens; timeout 20 s on Assist's connection profile (a cheaper model can be chosen there) |

The pre-call is skipped on Continue, impersonate, quiet/background prompts and dry runs, with an empty message, when the
Combat module isn't pinned, when "Rolls" is *off*, and under *fights only* while no slot is filled. A `none` answer still
costs the call. Setting "fights only" saves most calls outside combat, but non-combat checks then have no dice.

---

## 7. Release plan

**Calibration.** A UI-only release here took about 1 h of build plus 3–4 review rounds of 30–60 minutes each. RPG
Battle's generative-offers release, which had new state, replay guards and a model-facing grammar, took about 2 days with
7 review rounds. A review round below = one Codex review (on the VM) plus its fixes and a re-test, about 1–1.5 h elapsed.
Mockup rounds add about 1–2 h each, including your approval.

### R1: Sheet & words (SB 2.6.0, SD 2.2.0, Ersveil 2.0.0)

- **Scope:** new code pieces 1–8, 15, 16 (R1 part), 18 (without `resolve`). Packs: Character, Skills, Combat (slots,
  words, told/end; no dice). Ersveil without RPG Battle. Fights are narrated with words and the combat prompt.
- **Mockups to approve first:** (1) Character screen: words with bars, stats, class + XP meter, tap-to-edit editor for
  enum/int/text; (2) Skills screen: one card per character, rows, Add skill, rename/remove; (3) "Changed this reply" with
  dm lines and "(you)"; (4) Unknown-skill note with Add/Ignore; (5) Class up / Rank up / The story ends here cards;
  (6) the SD Story-only quests switch and a reward-less quest row; (7) the Combat screen with foe slots.
- **Tests:** checker vectors for every new part (±1 limits, closed keys, text-label safety, row caps); unit tests for
  the matcher (fold, prefix/suffix, longest wins, ambiguity), edit, cards, conditional tail, reply-end settle and the
  death rule (refused in the Down reply, accepted next reply); replay fuzz + cold/incremental equality; unused byte
  differential; SD tests for story-only quests (no pay, flag frozen, swipe/delete/Re-read). **Live smoke** in the test
  SillyTavern (`/home/user/st-smoke`, port 8150, `suite-notes/smoke/setup.sh`): pin the three modules in Ersveil,
  attach Wessel and Ren, add skills, run a narrated fight to Down → death next reply → swipe undo, class up at 100 XP,
  edit a word then swipe (lost) and Re-read (kept), reload, phone layout (tap targets ≥ 44 px).
- **Codex review:** max level on SB + SD + packs; regression-only final pass.
- **Estimate:** build 7–9 agent hours (rows 2–3 h, edit 1.5–2 h, the small pieces 2 h, tests/fuzz 1.5 h, packs/docs 1 h,
  SD 1 h); 5–6 review rounds; mockups 2 rounds. **About 2 working days elapsed.**

### R2: Dice & battle log (SB 2.7.0)

- **Scope:** pieces 9–12, the R2 part of 16, the `resolve` block in both packs, the "Rolls" setting, Assist's pre-roll
  stepping aside.
- **Mockups:** panel D is approved; still needed: (1) the one-line check roll in a message (placement); (2) "Rolls
  skipped" and "re-planned" notes; (3) the fallback card state when no `told` line came; (4) the Assist settings line for
  "Rolls" (fights and checks / fights only / off).
- **Tests:** parser vectors for the pre-call answer (garbage, extra lines, unknown names, edge clamp); resolve: formula
  bounds, opposed and DC outcomes incl. nat 1/20 and cost margin, the Empty refusal, round count (pace / cap / decisive /
  budget), cue text; prelude: preview seed = committed seed, Re-read keeps the dice with no model call, a swipe gets a new
  call and new dice, Continue makes no call; replay fuzz with resolves; unused differential (no pin → no call, no cue).
  **Live smoke:** a real fight in Ersveil with the test model. Check: narration follows the rolls, the marker is placed,
  the panel draws inline and folds, the fallback card works without a marker, the swipe re-roll shows new numbers,
  Re-read and reload keep them, delete removes them, and the prompt history holds no markers. Check phone and desktop.
  Measure pre-call latency and tokens.
- **Codex review:** max level, with focus on the turn.js prelude path (the core flow) and guard purity.
- **Estimate:** build 9–12 agent hours (prelude 2 h, pre-call 2–3 h, resolve 3 h, renderer 2–3 h, tests 1–2 h);
  6–8 review rounds; mockups 1–2 rounds. **About 2.5–3 working days elapsed.** It is comparable to the generative-offers
  release.

### R3: Gear, knobs, Studio (SB 2.7.x, Story Studio)

- **Scope:** pieces 13, 14, 17; docs.
- **Mockups:** (1) Setup prompt-override box; (2) the gear part of the roll breakdown; (3) the Studio forms for rows,
  cards, prompt and resolve.
- **Tests:** adapter purity (the guard witnesses the equipped item; removing the gear earlier re-plans it); override
  text only changes the static part of that chat; Studio parity (same diagnostics as SB), simulator replay trace, browser
  tests offline.
- **Codex review:** max level, Studio included.
- **Estimate:** build 6–8 agent hours (Studio is most of it); 3–5 review rounds; 1 mockup round. **About 1.5 working days
  elapsed.**

**Total:** about 22–29 agent build hours, 14–19 review rounds, and 6–6.5 working days elapsed, if mockups are approved
quickly. Where this could be cut: drop "Story-only quests" from R1 (it is independent), or move Studio after you have
played R2 for a while.

---

## 8. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Scope creep into an engine** (RB's history) | medium / high | the non-goals in §2 are a review checklist; one formula; no new effect types beyond rows; every new knob is pack data |
| **turn.js prelude change** breaks Assist's pre-roll or the core send path | medium / high | generalise without changing behaviour first (Assist's tests must pass unchanged), then add `dm.resolve`; the Codex review focuses on it |
| **Narrator ignores the rolls** or tells a different outcome | medium / medium | strong cue wording; the panel always shows the true rolls; tap-to-fix and swipe; prose cannot be checked by code (by design) |
| **Narrator stops early** to dodge a bad round | low–medium / low | the decisive stop is code's: rolls after it are never given; the panel shows told rounds |
| **Marker missing, doubled or inside other text** | medium / low | first exact marker line wins, extras hidden, card fallback, marker stripped from history |
| **Pre-call latency/cost** on every reply | high / low–medium | cheap profile, 20 s timeout, "fights only" setting, cacheable fixed head, skipped on Continue |
| **Pre-call picks nonsense** (unknown names, impossible edge) | medium / low | per-line validation, clamping, unknown skill → untrained + note; swipe |
| **Re-planned outcome after earlier deletion** differs from the told prose | low / low | card note (§5); alternative Q7 |
| **Row name drift** (narrator writes "breath of iron") | medium / low | refused + Unknown-skill note; the grammar lists exact names during fights; tap-to-fix |
| **Two check systems** (SD `? check` vs resolve) | medium / low | static rule "write no ? check lines"; Assist pre-roll steps aside; SD `? check` still works if written (uses SD bonuses), the panel won't show it |
| **Prompt growth in big parties** | low / medium | tail caps per module (300), cue cap 600, skills only in fights |
| **Display re-render quirks** in SillyTavern (edits, swipes, lazy loading) | medium / low | draw on render events from the record; idempotent; live smoke on phone + desktop |

---

## 9. Open questions (not settled by the decisions)

**Q1. Narrator line shape.** The decision notes write `~ health Ren | wounded` and `~ xp +15`. Data modules use one wire
kind: `~ dm character — … | kind: health | who: Ren | to: wounded` (≈ 20 tokens instead of ≈ 7).
*Options:* (a) keep the `dm` envelope (approved data-module decision 1, no parser change); (b) per-pin short aliases (a
pinned module claims a kind word like `health` when no module owns it) for a new parser path and a change to the approved
decision. **Recommend (a)** for R1–R2. Measure in the live smoke how often lines are refused, and revisit (b) only if
drift is real.

**Q2. Who decides where a reply stops.** *Options:* (a) code only, from the dice (decisive stop + cap); (b) the narrator
only (`told`); (c) both: code sets the maximum, and the narrator stops earlier at a narrative stop point and reports
`told`. **Recommend (c)**, as specced. It keeps your stop points narrative and keeps a decisive roll from being skipped.

**Q3. How a fight starts.** If you attack something not yet in a slot, does the first reply get dice? *Options:* (a)
the pre-call's `new` line rolls against an unslotted foe, and the narrator then fills the slot; (b) no dice until a slot
is filled (the first reply of every fight is dice-less); (c) the prelude fills the slot itself. **Recommend (a)**: dice
from the first exchange, and the pre-call never writes state.

**Q4. Gear without RPG Battle.** Items are owned by `party`, so nothing says who wields the sword. *Options:* (a) the
pre-call names which character uses an equipped party item in this reply (code checks that it is equipped; bonus = the
item's stat, capped at +3); (b) a reader-set "gear bonus" field per character (tap-to-edit, no adapter); (c) per-character
inventory owners (an SB inventory change). **Recommend (a)** in R3, with (b) as the zero-code stopgap available from R1.

**Q5. Where the one-line check roll goes without a marker.** *Options:* above the prose / below the prose / as a card.
**Recommend above the prose**: the roll happens on your action, before what follows. The mockup decides.

**Q6. Death: block further play?** *Options:* (a) end card + tail line "the story has ended", no blocking; (b) refuse
new dm actions for a dead player character; (c) block generation. **Recommend (a)**: SB never blocks SillyTavern; you
undo by swipe/delete or play an epilogue.

**Q7. Re-planning a roll after an earlier change.** *Options:* (a) re-plan with the same dice (Assist's behaviour; the
outcome may flip, and the card notes it); (b) never re-plan: the roll stays as recorded and goes inactive if its inputs
changed. **Recommend (a)**: one behaviour across the suite, and it is rare.

**Q8. Companions joining mid-story.** Character scope needs an SD actor attached in Setup. *Options:* (a) an "Add to
party" button on the Character screen that creates or picks the SD actor and attaches it (two reader actions in one
dialog); (b) Setup only. **Recommend (a)** as an R1 mockup item if it stays S-sized, otherwise (b) first.

**Q9. Mana for non-casters.** Mockup D leaves Ren's Mana blank. Specced: a reader-edited `uses-mana` flag hides Mana for
that character. Alternative: an extra word "—" in the ladder. **Recommend the flag**, so the ladder stays the decided five
words.

---

## 10. Roadmap line

After R3: **custom tracker builder.** A reader-facing editor that writes an ordinary data-module definition (same
checker; additive changes after play, like pack migration), built on the rows, edit and card pieces above.
