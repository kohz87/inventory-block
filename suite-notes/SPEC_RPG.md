# Lean RPG on custom blocks (build spec, 31 Oct)

Base: Story Block main c438975 (2.7.2). Target: Story Block 2.8.0. Branch: `stage16/lean-rpg`.
The detailed mechanics and replay table come from the earlier design, `scratchpad/spec-rpg/SPEC.md`, copied as
`suite-notes/SPEC_RPG_v1.md`. That file is the reference for the formula, the odds, the pacing and stop rules, the cue
text, the marker and history stripping, and the replay table (§3, §4.5.3–4.5.6, §5, §6). This spec says what changed
because of 2.7 (custom blocks, inline edit, text labels, prompt text) and splits the work for parallel agents.

## 0. Decisions (USER)
- **31 Oct revision (mockup v2, https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R) overrides the lines below where they differ:**
  - **Rolls are automatic.** The AI pre-call (A5) is the default and only planner, so there is no Roll button and no Roll form (B2 dropped). Settings → Lean RPG → "Rolls: automatic / off".
  - **Health / Mana / Stamina are stage bars** (`ss.meter` with `segments` = stages, `text` = the word, tone by stage: good near full, warn in the middle, bad near empty), in one aligned row on the stats screen and on the Home card.
  - **One Party tab, one card per character** (you and each companion): name and role, Soul Class, XP bar, the three stage bars, the seven stats in a row, skills with ranks; "Spend points" (when points are unspent) or "Stats" opens the B3 distribution view for that character; "Skills" opens the list. This replaces the per-character Stats tab in B3. Each card is drawn from that character's Character block.
  - **Soul Class and skill ranks rise automatically** through block Rules: at XP 100, class +1 and XP back to 0; at practice 100, rank +1. They show as lines in "Changed this reply" (a `replyCard` line from the module), with no confirm cards. The only card left is "The story ends here" (death).
- **A: optional module.** It lives in Story Block as `src/v2/modules/lean-rpg/`, off by default, and is switched on in
  Settings → Features → "Lean RPG". When it is off, nothing of it is imported (dynamic `import()`), and prompts, saves
  and RNG draws are byte-identical to 2.7.2.
- **B: short battle-log lines.** One line per action, e.g. `Wessel → Sluice Rat A: SUCCESS (26 vs 16)`, with the
  breakdown on tap. The narrator tells the story in prose.
- **Roll trigger: a Roll button** (default). The reader sets up the action in a small Roll form, and the dice are
  rolled for the next reply. The AI pre-call is an option (Settings → Lean RPG → "Plan rolls for me"), off by default.
- **Keep the original visual stat distribution:** RB's Stats step, with steppers under a point budget, the points-left
  pill and the stat radar.
- Whatever custom blocks can do ships as **block templates**: the Character sheet, Skills, Foes and the combat rules
  text.
- Keep from the earlier design:
  - Health/Mana/Stamina are words; stats are 1–20 (pack-defined);
  - Soul Class I–IX, with XP 0/100 tracked by the AI and added up and capped by code;
  - the opposed d20: PC d20 + stat/2 + 2×class + skill rank vs foe d20 + 5 + 2×class;
  - gear as edge;
  - companions act on their own;
  - several exchanges per reply with stop points (cap 5); a swipe rerolls;
  - Down, then death only if already Down at the start of the reply; death ends the story (undo by swipe);
  - foe slots 4–5, where a group is one slot; the Megumin combat prompt is always on;
  - battle-log display D, inline at the narrator's `[battle]` marker, with a fallback card.

## 1. What 2.7 already gives (no new code)
| Need | 2.7 piece |
|---|---|
| Sheet fields (words as choice fields, stats as numbers, XP 0–100, Soul Class 1–9) | custom block fields + `dm.set` pencils |
| The AI updating them | generated `set-<field>` story lines |
| Rest, Steady breath, "Gain XP" buttons | Button functions |
| "XP ≥ 100 → flag ready to class up" | Rule functions |
| Skills as a list | list field (up to 12 entries, "Iron Breath: Adept") |
| The combat prompt in the static prompt | block "What it is for", with the cap raised (§2 C1) |
| Reader fixes of any value; the "You set" lines | inline edit (2.7) |
| Undo by swipe or delete; rebuild = reload | data-module replay (2.7) |

## 2. New code, split for parallel work
Every piece names its files. Pieces never share a file except where noted, and the integration owner (the lead) merges
the shared files.

### C. Block engine additions: Agent **C** (Sonnet)
Files: `src/v2/data-modules/{schema,check,interpreter,part,grammar,block-builder,block-screen}.js`,
`src/v2/screens/blocks-editor.js`, `src/v2/strings.js` (block section only).
- **C1. Longer prompt text** for blocks: "What it is for" goes up to 1200 characters, still within the 2000-character
  static limit together with the grammar. The editor's count updates.
- **C2. Display names** for number fields: optional `names` (e.g. 1–9 → I–IX, 0–3 → Novice…Master). They are used by
  the card, the tail and the "You set" lines; stored values stay numbers.
- **C3. Card functions:**
  - New function type "Card": `{ when, tone, title, text, button? }`, drawn on the head reply through the existing
    reply-cards socket. The button runs one of the block's own Button functions.
  - Used for "Class up?", "Rank up?" and "The story ends here".
  - Cards are not stored; they are derived from the head state.
- **C4. Reply-end rules:** new function type "At the end of each reply". Rules are planned like timers (a system step
  `dm.settle`, `replan`, NO_LONGER_DONE when there is nothing to settle). This gives the Down → death latch: the earlier
  design's item 8.
- **C5. Hidden fields:** `prompt: false` keeps internal fields such as the latch out of the tail.
- Tests: live = rebuild = reload; swipe and delete; the limits; the unused byte differential.

### A. Rolls (the module core): Agent **A** (Sonnet)
Files: new `src/v2/modules/lean-rpg/{index,plan,resolve,cue,precall}.js`, `src/v2/turn.js` (prelude list only, shared
with nobody else), `src/v2/assist/` (only for the optional pre-call).
- **A1. Generalise the prelude:** turn.js's hard-wired Assist PRECHECK becomes a list of registered prelude commands
  (the earlier design's item 9).
- **A2. The plan**, a frozen shape that the Roll form (B2) and the pre-call both produce:
  `{ pace, acts: [{ who, skill?, stat, target, edge? }], foes: [{ slot, target, defend } | { slot, hold }], checks: [...] }`.
  It is stored as a pending plan for the next generation, in chat metadata, not in game state, and cleared when used.
- **A3. `rpg.resolve`**, the prelude:
  - validates the plan against the head state: blocks, skills list, foe slots;
  - refuses skills whose resource word is Empty;
  - rolls opposed d20s from the generation seed, for rounds = min(pace, cap, decisive stop, cue budget);
  - writes the `[Rolls]` cue;
  - records everything; it is guarded and replay-safe, per the earlier design's §4.5.3 and §5;
  - a swipe brings a new seed and new dice; Re-read keeps the same dice.
- **A4. Stat and skill reading:** stats, class and Soul Class come from the Character blocks. A character is the block
  whose name is theirs; each Character block has a `who` text field. The skill rank is parsed from a list entry
  ("Iron Breath: Adept" → rank 1), and the foe's class from its Foes slot.
- **A5. Optional pre-call:** fills the plan from the reader's message (the earlier design's item 10). It is off by
  default.
- Tests:
  - the formula and the odds table;
  - seeds: Re-read keeps, swipe changes;
  - refusals; round and stop rules; the cue budget;
  - the replay fuzz extended with plans.

### B. Screens: Agent **B** (Sonnet)
Files: new `src/v2/modules/lean-rpg/view/{battle-log,roll-form,stats-screen}.js` and `.css`, `src/v2/ui-host.js` (one
mount line, merged by the lead), the history strip in `src/v2/turn.js` (merged by the lead after A1).
- **B1. Battle log D:**
  - drawn at the narrator's `[battle]` marker inside the message, with a fallback card under the reply;
  - short lines, aligned solid bars, the fold, the breakdown on tap;
  - the marker is stripped from prompt history.

  This follows the approved mockup D (https://claude.ai/artifact/Hs3sTqDMLPPedhREoopGLb) and the earlier design's
  §4.5.4.
- **B2. Roll form:**
  - A "Roll" button sits beside the message box (Story Block's bar).
  - It opens a small form: who (each Character block), skill (from their list), stat, target (filled foe slots or "a
    check" with Easy/Normal/Hard/Very hard), edge (−3…+3 with a reason), and pace (Careful / Normal / All).
  - Several actions can be queued, one per party member. Save stores the plan (A2) for the next reply; a chip shows
    "2 rolls set for the next reply".
- **B3. Stat distribution screen,** RB's Stats step reborn:
  - `ss.stepper` per stat under a points budget, from a `points` field;
  - the points-left pill and `ss.radar`.
  - Save writes all the stats and the points through `dm.set` as one edit set on the latest reply.
  - It is a block tab ("Stats") that Character blocks open.
- Mockups are needed before building: B2 (roll form) and B3 (stats screen, from RB's creation Stats step). B1 is
  already approved.

### H. Templates and docs: Agent **H** (Haiku)
Files: new `examples/blocks/lean-rpg/*.json` (block templates), `docs/v2/LEAN_RPG.md`, `docs/v2/GUIDE.md` (one
section), test fixtures under `tests/v2/lean-rpg/fixtures/`.
- **Character** (one block per character): who; Health / Mana / Stamina words; STR, VIT, AGI, DEX, INT, LUK, CHA 1–20;
  points; Soul Class 1–9 (names I–IX); XP 0–100; Down latch (hidden); alive.
  - Functions: Rest; "XP ≥ 100 → Class up?" card; Down → death reply-end rule; death card.
- **Skills:** a list "Name: Rank"; a "Rank up?" card.
- **Foes:** five slots (name, count, class 1–9, health word).
- **Combat rules:** the Megumin [COMBAT SYSTEM] text as "What it is for", plus the XP guidance.
- Templates load through the existing chooser (Blocks → New block → from a template). Studio's export makes them packs.
- Writes only JSON and Markdown. It depends on C's new keys (`names`, Card, reply-end, `prompt:false`), whose shapes
  are fixed here in §3.

## 2R. As briefed (31 Oct, after mockup v3 approval)
The agent briefs in `suite-notes/rpg-briefs/` (COMMON, C, A, B, H) replace §2's file lists where they differ:
- The code lives in `src/v2/lean-rpg/` as a part of Story Block's core module behind the feature
  `story-block.lean-rpg` (default off; off means fully off), not `src/v2/modules/lean-rpg/`. Views load by dynamic
  `import()` only when it is on.
- B2 (Roll form) is dropped; A's pre-call is the only planner, with Settings → Lean RPG → "Rolls: automatic / off".
- B3 becomes the Party tab (one card per Character block) plus the Spend points / Stats sheet.
- Health, Mana and Stamina are stage indexes (0 = empty) with `names`, drawn as stage bars.
- A new definition key `role` (character / skills / foes / rules) tells the RPG which blocks to read (C0).
- Skills are five slots (name, rank 0–3, practice 0–100), not a list; Foes are four slots (name, count, class,
  hurt stage). The templates are hand-authored definitions in `src/v2/lean-rpg/templates.js`.
- Class and rank rises are plain rules (they already run after each line); cards are used only for death.

### Lead
- Spec, interface checks, merging A, B, C and H, the module toggle and lazy import, the browser check, the fixes, the
  review, the release.

## 3. Interfaces (fixed before the agents start)
- Field `names`: `{ "1": "I", …, "9": "IX" }` on an int field. Only listed values get a name.
- Card function: `{ type: "card", when: <expression>, tone: "info"|"warn"|"end", title ≤ 60, text ≤ 240, button?: <Button function name> }`.
- Reply-end function: `{ type: "reply-end", when: <expression>, effects: [set/add on own fields] }`.
- Field `prompt: false`: hidden from the tail and from the grammar (the AI cannot set it).
- Plan (A2) and the cue (earlier design §4.5.3) are as above. A `resolve` record lives in `data.v2.result` (earlier
  design §5).
- Module toggle: setting `features.leanRpg` (default false). The module registers the prelude, the Roll button, the
  battle log and the Stats tab only when it is on.

## 4. Order and estimate
1. The lead writes §3 into code stubs (the empty module with its toggle; the C key names in schema). About ½ day.
2. In parallel:
   - C (Sonnet), about 1 day;
   - A (Sonnet), about 1–1½ days;
   - B (Sonnet), about 1 day, after the B2 and B3 mockups are approved;
   - H (Haiku), about ½ day.
3. The lead integrates and runs the browser check, about 1 day. Then the review and fix rounds, about 1 day.

That is about 3 days of wall-clock time, or about 5 days one after another. If the Codex review is unavailable, a
Sonnet reviewer in a fresh session reviews instead.

## 5. Out of scope
HP or damage numbers, status effects, initiative, loot tables, NPC State Delta changes, migrating existing chats, and
the UI redesign.
