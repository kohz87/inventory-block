# GEN22-COMMON — Story Block 2.22.0 set, built in parallel (USER 4 Nov: "run them in parallel")

**Rules:** everything in CARD-COMMON.md applies (secrets, user data, PID files, no playwright install, the denied-command rule, the exact trailer, no model names, no merge/PR/force/tag, never weaken tests).

**Base and branches:**
- Base: Story_block origin/main 2ee6318 (2.20.0); Story_studio origin/main ec65db3 (0.8.0).
- Story Block 2.21.0 (`stage65/card-offer`) is being finished in parallel and touches lean-rpg (skills.js, practice, fight, open), data-modules/part.js (the practice rule), packs/card*, st-adapter.js, ui-host.js and the FAQ. Avoid unneeded edits there. When 2.21.0 reaches main, the lead asks you to `git merge origin/main` (a merge commit, no rebase) and to resolve conflicts keeping both sides.
- Do NOT bump versions; the lead integrates into 2.22.0. Add a CHANGELOG draft under "## Unreleased".
- Each agent has its own clone ($S/g22-<name>/) and its own branch (`stage66/<name>`).

**Approved mockups** (binding, with their "Lead's recommendations/answers" boxes):
- STARTGEAR https://claude.ai/artifact/446mCVxe8Fnq1ZJbqYSTxj ($S/startgear/mockup.html)
- BLOCKS https://claude.ai/artifact/EefsnTBrbvSeW5wL3QALFJ ($S/blocksui/mockup.html)
- BLOCKEDIT https://claude.ai/artifact/6niZ3NLbACPKCbqc2yJoi4 ($S/blockedit/mockup.html)
- CASTSKILL https://claude.ai/artifact/419szch9A3JouKFwFvMuJn ($S/castskill/mockup.html)

The matching briefs are in this folder: STARTGEAR-UI.md (with its addendum), BLOCKS-UI.md, BLOCKEDIT-UI.md and CASTSKILL-UI.md.

**Shared contracts** (agents building on both sides must match exactly):
- **List of entries (BLOCKEDIT builds the type; BLOCKS renders it):**
  - A block field may have `type: "entries"`, `of: { <subKey>: <field def of type text|number|choice> }` (at most 8 sub-fields), and `max` (default 30, at most 50).
  - Stored value: an array of objects keyed by the sub-keys, in order.
  - Story lines: `+ dm <block> — why | kind: add-<field> | <sub>: value …` adds an entry; `~ … | kind: set-<field> | at: <n or title> | <sub>: value` changes one; `- … | kind: drop-<field> | at: …` removes one. Validated like today's fields.
  - Block keys: `layout: "cards"|"bars"|"fields"`, `roles: { field, title, status, step }` (the sub-keys of that entries field), `tones: { <statusValue>: "active"|"done"|"failed"|"neutral" }`, and `show.into: <existing tab id>`.
  - Absent keys mean today's plain rows.
- **Screen tab merge (BLOCKS):** a pack screen and a block may carry `tab: "<id>"` and `tabTitle`. Screens with the same `tab` are drawn as sections of one tab, in order. A block's `show.into` uses the same mechanism.
- **Cast skills (CASTSKILL; Story Block side and Studio side):**
  - `cast[].skills: [{ name (1–40), about (1–120), stat (STR|AGI|DEX|VIT|INT|WIS|CHA, the Story Block seven), uses: "stamina"|"mana" (default stamina), rank: "novice"|"adept"|"expert"|"master" (default novice) }]`, 1–5 entries (8 once extra slots land).
  - Names unique per person; unknown keys refused.
  - When the member joins, the skills fill free slots as written and are marked signature: practisable, never renamed or replaced by the story (that learn line is refused with a Problems line); the reader's pencil stays (name and description only).
  - Leave and rejoin keep rank and practice.

**Before every push:** the full suite, `npm run check` and `git diff --check origin/main HEAD` must be clean.
**Real-ST checks** on your own ports (given in your brief), with data built by copying into a new empty folder.
**Report briefly:** the head, what was built, the tests, pinned changes, byte changes for prompts, and anything not done.

## Addendum (USER question 4 Nov): cast skills in running chats
Seeding happens only on the join event. Members who already joined keep their skills untouched after a pack update. A rejoin after the update fills only free slots with names they do not already hold. Not-yet-joined members get their signature skills on joining. Replay follows the join receipt (what was seeded), not the current pack.
