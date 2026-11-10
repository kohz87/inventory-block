# Story Block 2.7.0: inline editing and custom blocks (build spec)

Base: Story Block main d5fdb46 (2.6.1). Branch: `stage14/edit-blocks`. Version: 2.7.0 (manifest, package, runtime, validate).
Approved mockup: `vm-jobs/146-mockup/` (`index.html` and `shots/`; notes in `NOTES.md`). Where this spec and a picture
disagree on behaviour, the spec wins; on looks and placement, the picture wins.
Built in two layers on the same branch. Layer 1 (P1 + P2) must be complete and green on its own before layer 2 starts,
so it can ship alone if layer 2 stalls.

## 0. Ground rules (both layers)
- Reuse what is there. No new evaluation engine, no second change-line parser, no new storage outside the chat (except
  templates, §3.7). Edits are ordinary commands on the latest reply; replay, swipe, delete, Re-read, rebuild and reload
  behave exactly as for existing reader commands (REPLAY.md). Live = rebuild = reload in every test.
- Reader text (names, notes, field values, prompt text) reaches the DOM through `textContent` / escaped template output
  only. It reaches the prompt through `oneLine` and is cut to its limit by code points.
- No hardcoded colours: theme tokens (`src/v2/view/theme.js`) only. Every new control has a 44 px tap target on phones
  (`size.css` rules), works under the `--ss-zoom` scale, and is reachable by keyboard (Enter saves, Escape cancels).
- All words in `src/v2/strings.js`. Plain, short wording, as in the mockup.
- Docs updated in the same layer: `docs/v2/SPEC.md`, `DATA_MODULES.md`, `REPLAY.md`, `GUIDE.md`, `CHANGELOG.md`.
- `npm run check`, the full suite, `git diff --check`, the strict matrix (`scripts/matrix.mjs` with Story Director and
  NPC State Delta, 0 FAIL), the 60-seed replay and data-module fuzz, and the capture benchmark (no slowdown beyond
  noise) all pass at the end of each layer.

## 1. Layer 1, part A: small fixes (P1)
| Fix | Where | Done when |
|---|---|---|
| Doubled coin icon in the purse tile of "Changed this reply" | `src/v2/screens/changes-card.js` ~line 46–48 (two `fa-coins` icons) | one icon; test asserts one |
| Phone Story panel sheet is see-through, small text hard to read | `src/v2/view/mounts.css` (sheet background), `src/v2/view/theme.js` (an opaque sheet token for each panel style) | sheet background opaque in all three panel styles (Glass / Solid / SillyTavern); contrast ≥ 4.5:1 for body text; test reads the computed background |
| Authored `<mark role="button">` and similar `[role=button]` can stay under 44 px on phones | `src/v2/view/size.css` | zero-specificity `:where` rule gives any `[role=button]` / `[data-command]` inside screens a 44 px minimum on phones; test |
| 3-second capture timing tests fail on slow machines | `tests/v2/break/b1r2-capture*.test.js` | measure a baseline in the same run (e.g. a plain capture of the same size) and assert a ratio instead of a wall-clock 3 s; still catches a 3× slowdown |

## 2. Layer 1, part B: inline editing (P2)
A pencil on every value the reader can sensibly set. Tap → inline form in place → Save / Cancel. The edit is a command
on the latest reply (the host already puts reader commands there), so a swipe or delete of that reply takes it back,
and it shows in that reply's "Changed this reply" card under "You set". Edits are only offered where the state shown
is the head (render-screen already makes older cards read-only).

### 2.1 The editable widget
New `src/v2/view/widgets/editable.js`, registered in `widgets/index.js` as `ss.editable`, usable from templates and
layouts (`render-screen.js`). Props: `value`, `kind` (`text` | `number` | `choice` | `list`), `min`/`max`/`maxLength`,
`options` (choice), `label` (accessible name), `command` + `payload` (the value is put in at `valueKey`).
- Pencil: the app's `ss-iconbutton`, 28 px drawn, 44 px hit area on phones, quiet until hover/focus (mockup 01a).
- Form: one `ss-input` / `ss-select` sized to the value, Save (`ss-button-primary`) and Cancel; focus moves into the input;
  on refusal the command's message is shown under the input and the form stays open; on success the form closes and
  focus returns to the pencil.
- Number: integer only, clamped to min/max in the input, refuses empty. Text: cut to `maxLength`. List: chips with ×,
  plus an add input (§2.5).

### 2.2 Inventory (`src/v2/domains/inventory.js`, `src/v2/screens/inventory.js`)
New reader commands. Each refuses unless `ctx.cause === 'ui'` and `ctx.caller === null`, and returns
`data.edit = true` plus a one-line `summary` used by the "You set" line.
- `inventory.edit { stack, name?, qty?, note? }`
  - name (1–60, existing name rules): renames this stack. If its def is shared by another stack or comes from a pack,
    make a new custom def for this stack only; otherwise rename the def. A name that `resolveDef` matches to another
    existing def merges into that def only if the stack could merge (same rules as `inventory.merge`), else refuses.
  - qty: integer ≥ 1. Unstackables keep the 50-per-line cap. 0 is not allowed here (Remove does that).
  - note: up to the existing note limit; empty clears it.
- `inventory.add { name, qty = 1, note?, owner = 'party' }`
  - The reader's own explicit "I have this". It is not `inventory.grant`, which stays refused from buttons.
  - Uses the same def lookup as story `+ item` lines (`defineByName`), same caps.
- Remove: the existing `inventory.drop` with the whole stack (no new command). It must also set `data.edit = true`
  when the cause is `ui`.
- UI (mockup 01a–01c): a pencil beside the name, count and note on each row. "+ Add item" goes in the Inventory header
  after the purse, opening a name / count / note form. A Remove action sits beside the name (the existing side actions).

### 2.3 Purse (`src/v2/domains/inventory.js` wallet commands, `src/v2/screens/home.js`, `screens/inventory.js`)
- `wallet.set { owner = 'party', amount }`: reader only, integer ≥ 0 in the smallest unit.
  - The input takes mixed coins when the currency has coins ("3 silver 5 copper"), parsed with `money.js`.
  - Recorded as the difference; `data = { edit: true, from, to }`.
- Pencil on the purse on Home and in the Inventory header (mockup 02a/02b).

### 2.4 Scene (`src/v2/domains/scene.js`, `screens/home.js`, `screens/scene.js`)
- Place, weather and who's present already accept `ui` commands (`scene.place`, `scene.weather`, `scene.present`).
  Add `data.edit = true` when the cause is `ui`, and add pencils (mockup 02a, 03b).
  - Place: a select of known places plus free text.
  - Weather: free text.
  - Present: chips with × and an add input.
- Story time stays Story Director's (outside Story Block). Show no pencil on time.

### 2.5 Data-module fields (`src/v2/data-modules/part.js`, `interpreter.js`, `check.js`, `schema.js`, `grammar.js`)
- New reader command `dm.set { module, who?, field, key?, value }`.
  - `field` is a top-level state field. `key` is a map key when the field is a `map`.
  - Validated with `scalarHolds` against the field's schema; text is cut to the field's max.
  - Runs the module's rules after the set (`evaluation.rules()`), so a set that crosses a rule threshold fires it.
  - Recorded with `guard(...)` as kind `dm.set` (add it to `dataModuleGuard`'s list). It reads only its own instance and
    the pin generation.
  - Not reply-bound beyond the normal reply ownership; claims nothing; counts toward the reply budgets.
  - `data.edit = true`.
- A module can turn this off per field: optional `"edit": false` on a state field schema (default true). `check.js`
  accepts the key. Setup's "What it does" lists fields that can't be edited.
- **Free-text labels:** add `text` to `DM_DESCRIPTORS.labels`: `{ type: 'text', max }` with 1 ≤ max ≤ `DM_LIMITS.text` (240).
  - A `set` effect may take `{ arg: <text label> }` into a `text` field whose max ≥ the label's max.
  - Literal text stays allowed.
  - `parseLabels` cleans the value with `oneLine`, cuts it to max, and refuses empty.
  - `grammar.js` writes the value spec as `text`, e.g. `| note: text`.
  - Free text never reaches a condition except `eq`/`ne` against a literal.
- Pencils on every editable field in data-module screens (mockup 04a/04b). The generic data-module view adds them;
  authored templates get them where they use `ss.editable`.

### 2.6 "You set" in the reply card (`src/v2/screens/changes-card.js`, `src/v2/reply-cards.js`, `src/v2/ui-host.js`)
- The host puts `edits: [{ text }]` in the card's scope, the same way it puts `refused`.
  - Source: that reply's blocks whose receipt has `data.edit === true`, in order, text = the receipt summary.
  - Example: "You set Torch to 3", "You set the purse to 5 silver", "You set Standing (Adventurer Guild) 2 → 5".
- The card shows them as "You set" lines (mockup 05) and counts them in the header line.
- On the latest reply only, a one-line hint: "Your edits ride on this reply: swipe or delete it and they go too."
- A pressed data-module button or a fired rule shows as a line too (mockup 09/13): a `ui` `dm.act` is an edit; a rule
  that fired is reported through the module's existing `replyCard` lines.

### 2.7 Layer 1 tests (new files under `tests/v2/edit/`)
- Every command:
  - live = rebuild = reload;
  - swipe of the reply removes it, delete of the reply removes it;
  - Re-read keeps it when it still applies, else it stays off with a Problem;
  - refuses from `story` / `system` / a caller;
  - refuses bad values with a plain sentence.
- Inventory: rename a shared def and a pack def; merge-on-rename; qty caps; add caps; note clear.
- Purse: a mixed-coin input; 0; a huge number refused at the integer limit.
- `dm.set`: bounds; enum; map key; `edit: false` refused; a rule firing after a set.
- Free-text labels: grammar line; cut; empty refused; condition limits; a 2.6.1 chat loads unchanged.
- Widget DOM tests: keyboard, focus return, refusal message, 44 px on phone, zoom.
- Card: the "You set" lines and the hint; none on older replies.
- Docs: SPEC (reader edits), DATA_MODULES (`dm.set`, `edit`, text labels), REPLAY (edits are reply commands),
  GUIDE (how to edit), CHANGELOG.

## 3. Layer 2: custom blocks made in the chat (P3)
A custom block is a data module (interpreter 1) authored in the chat by the reader, with no pack. Its definition is
pinned in the chat exactly like an enabled pack module. Everything after the pin (values, story lines, buttons, rules,
timers, replay, budgets) is the existing data-module machinery.

### 3.1 Identity and storage
- Id: `pack.chat/<slug>`. Pack id `chat` becomes reserved: `packs/validate.js` refuses a pack whose id is `chat`
  (BAD_ID, plain message), and the library ignores one already installed.
- Pin: the existing `draft.pins[hash] = { definition, packId: 'chat', packVersion: '0', packHash: null, interpreter: 1 }`
  and `active[id]`. The `origin` shown in Setup is "Made in this chat".
- Limits: DM_LIMITS as they are — 8 active modules per chat counting pack modules and blocks together, 32 fields,
  static text ≤ 2000 characters per module, tail ≤ 100 tokens per module.

### 3.2 Commands (reader only, `ui` cause, no caller; in `part.js`)
All three below:
- are recorded through `guard(...)` with `bound: true` (reply-bound, like `dm.pin`), so a swipe or delete of the reply
  that made the change takes it back;
- run through the existing validator `validateDataModules(..., { packId: 'chat' })`;
- return `data.edit = true`.

The commands:
- `dm.define { definition }`: pins a new chat block. Refuses a slug already active, and refuses past the limits.
- `dm.redefine { module, definition }`: a new generation of a chat block (fields, prompt text, functions, Show as).
  Values carry over by field name when the type matches and the value still holds (`scalarHolds`); otherwise the new
  default. Removed fields drop their values. Refuses for a pack module (packs migrate through `dm.migrate`).
- `dm.remove { module }`: unpins a chat block (and its instance). Pack modules: refuse (out of scope).

### 3.3 What the block editor writes (the definition)
The editor writes an ordinary definition. Nothing in the runtime knows it came from the editor.
- `slug` from the name (lowercased, dashes, made unique), `name`, `schema: 1`, `stateVersion: 1`, `scope: 'chat'`.
- Fields:
  - text → `{type:'text', max}` (max 1–240, default 120);
  - number → `{type:'int', min, max, default}`;
  - choice → `{type:'enum', values, default}` (2–32 values);
  - list → `{type:'text', max: 240}` with `"list": true`. A list is up to 12 entries joined with "; "; the UI shows
    chips, the AI sets the whole list. `check.js` accepts `list: true` only on text fields.
- **"What it is for"** → new optional definition key `prompt`: plain text up to 600 characters, placed in the static
  part before the module's grammar lines. The prompt and grammar together stay within `staticCharacters` (2000); the
  editor shows the count. Pack modules may use `prompt` too.
- Story lines: one kind per field, so the AI can update it:
  - `set-<field>` (`~` op, label `to` of the field's type; text/list use a text label, max = the field's max);
  - for numbers also `change-<field>` (`~` op, label `by`: int −max..max, effect `add` with the field's bounds).
- Functions:
  - **Button** → a kind with `ui: true` and effects `set`/`add` on the block's own fields (the editor offers field,
    "set to" / "add", value).
  - **Rule** → a `rules[]` entry. When `<field> <is / is not / below / above / at most / at least> <value>`, then
    set/add effects. Built as an expression tree in the existing expression language.
  - **Timer** → a `timers[]` entry (every N minutes of story time, set/add effects). Needs Story Director's clock (the
    existing `director.time` import); the editor says so and greys it out when Story Director is off.
  - At most 8 functions per block in the editor (within DM limits).
- Show as → `layouts`/`screens` are not hand-authored. A block's definition gets a small `show` key:
  `{ tab: bool, card: bool, tabName ≤ 24, icon }`, with `icon` from the app's icon set. `check.js` accepts it.

### 3.4 How a block is drawn (`src/v2/screens/blocks.js`, `ui-host.js`, `view/tab-order.js`, `view/mounts/`)
- One built-in screen, `story-block/block`, draws any chat block from its definition and instance: a title, each field
  with `ss.editable`, list chips, buttons for Button functions, and a `⋯` menu (Edit fields, Save as template,
  Export as pack, Remove). Mockups 08, 08b, 10a.
- Show as tab: the host registers one tab per block that has `show.tab`, through the same path as pack/data-module
  screens. `pinnedPresentation` / `dataModules.presentation` returns them with `pack: 'chat'`.
  - The tab uses `tabName` and `icon`; tab order is kept in `tab-order.js`.
  - On a phone the tabs go under More (mockup 10b).
- Show as card: the block appears as a card in the Game view's Blocks tab and on Home's card row where data-module
  cards go.
- **Fix the P1 follow-up here:** standalone Studio layouts (not from a pack or data module) must also become host tabs
  (`ui-host.js` ~line 237 only registers pack and data-module screens). Test it.

### 3.5 Blocks tab and editor (`src/v2/screens/blocks.js`, `src/v2/view/form/`, `strings.js`)
- A "Blocks" tab in the Game view: 8th item on desktop, under More on a phone (mockup 06).
  - It lists the chat's blocks as cards.
  - Empty state: one line plus "New block".
- New block opens a chooser (mockup 12b): "Empty block" or one of the saved templates (name + "N fields, N buttons…").
- The editor (mockups 07, 11) is built from the existing form engine (`view/form/fields.js`):
  - name;
  - fields (add, rename, type, bounds, default, reorder, remove);
  - "What it is for" with a live character count;
  - Show as (three chips: Own tab / Card / Both; tab name; icon row);
  - Functions (Button / Rule / Timer cards with plain selects).
- Save validates first and shows the validator's first message in plain words next to the bad control.
  Then it sends `dm.define` / `dm.redefine`.
- The editor says once, under Save: "Saved with the latest reply."

### 3.6 Prompt and tail
- Static part: per active module, `prompt` (if any) then its grammar lines. Unchanged otherwise (`grammarFor`).
- Tail: the existing per-module summary (`summaryOf`), within 100 tokens. List fields print as "a; b; c".
- The AI writes block lines with the existing `dm` change lines: `~ dm notes — reason | kind: set-mood | to: wary`.

### 3.7 Templates and export (`src/v2/packs/index.js`, `src/v2/view/settings/tabs-packs.js`)
- **Save as template:** stores the block's definition (no values) in Story Block's extension settings under
  `blockTemplates`.
  - At most 16 templates, each ≤ the definition byte limit. The same name replaces the old one after a confirm.
  - Templates are per user, not per chat. They are listed and deleted in Settings → Tabs & Packs → Block templates.
- **Export as pack:** builds a pack (`id` = the slug, `name`, `version: '1.0.0'`, `content.dataModules: [definition with
  its id rewritten to pack.<slug>/<slug>]`), runs `packs/validate.js` on it, and saves it as `<slug>.pack.json` through
  the existing file-save helper.
  - Once imported, it is an ordinary pack module.

### 3.8 Layer 2 tests (new files under `tests/v2/blocks/`)
- Define / redefine / remove:
  - live = rebuild = reload; swipe and delete of the defining reply take it back;
  - a redefine carries values over by name and type;
  - limits (the 9th module, the 33rd field, an over-long prompt or static text);
  - the reserved `chat` pack id;
  - a pack module can't be redefined or removed.
- Story lines:
  - every generated kind parses;
  - text and list cut;
  - the grammar and the prompt land in the static part;
  - the tail stays within budget.
- Functions:
  - a button press from the tab and from the card;
  - a rule fires on a story change and on a reader `dm.set`;
  - a timer with Story Director, and the greyed-out timer without it.
- Drawing:
  - a tab appears and disappears with the pin, including after a swipe;
  - phone More;
  - a standalone Studio layout becomes a tab;
  - icon and tab name.
- Templates: save, list, replace, delete, start a new block from one.
- Export: the exported pack validates, imports, and enables as a normal module with the same fields.
- Matrix: Story Director and NPC State Delta unaffected.
- Docs:
  - DATA_MODULES (`prompt`, `show`, `list`, `pack.chat`, `dm.define/redefine/remove`);
  - GUIDE (making a block);
  - SPEC; REPLAY (definitions are reply-bound); CHANGELOG.

## 4. Out of scope
- Story Director's clock editing (SD).
- Pack modules' removal.
- Free-form HTML in chat blocks.
- Combat / lean RPG (P5).
- Any redesign (P6).
- NPC State Delta prompts (never touched).

## 5. Lead decisions after build 146 (29 Oct; they override §1–2 where they differ)
Layer 1 is on `stage14/edit-blocks` at c37df69. These finish it; they are done first in build 147.
1. **Count of a thing that does not stack:** keep the domain rule (each piece is its own one-piece stack).
   - The count pencil on such a row sets the number of one-piece stacks of that def for that owner, adding copies or
     removing them, newest unequipped first.
   - It refuses to remove equipped pieces and stays within the 50 cap.
   - One edit, one receipt ("You set Torch to 3").
2. **`dm.set` for modules with rules and imports:** do not refuse them.
   - Record the guard the way `dm.act` does: `reads` from the evaluation, `imports: prefixImports(definition)`, and the
     decision's inputs.
   - Replay then rechecks those inputs exactly as for a button press.
3. **"You set" lines past the 200-carrier receipt window:** keep the retention invariant. Cards older than the window do
   not list edits; document it in REPLAY.md.
4. **Fields absent from authored layouts, or layouts at their node limit:** Setup's data-module card lists every
   editable field under "Fields" with an `ss.editable` pencil.
   - Chat scope: one row. Character scope: one row per attached character.
   - Authored layouts are left as they are.
5. **Tests the spec changes (authorised by the lead; not a loosening):**
   - The 3-second capture timing assertions become a ratio against a baseline measured in the same run.
     - It must still fail on a 3× slowdown (prove it with an injected delay in a test helper).
     - Keep a generous absolute backstop of 10 s.
   - The existing **Drop** label stays (no "Remove" relabel); the Drop side action is the reader's remove.
6. **Weather pencil:** hidden when the weather feature is off (read the feature setting, not the value).
7. **Pushing:** if `git push` cannot reach GitHub, commit locally and say so in the report; the VM coordinator pushes.

## 6. Lead decisions after build 147c (29 Oct; override §3 where they differ). Branch head 164d3fd.
1. **Module count:** keep the existing limits; no existing test changes.
   - Active modules per chat stay at `DM_LIMITS.pins` (16), counting pack modules and chat blocks together.
   - Chat blocks are at most 8 per chat (`DM_LIMITS.definitions`).
   - Remove the "8 active modules in all" rule from 147c, along with the "a pack cannot be the ninth" refusal.
2. **Story lines per block:** keep the 16-kind limit.
   - A block generates one `set-<field>` kind per field, numbers included; the separate `change-<field>` kind for
     numbers goes. A number field's `to` label takes the field's bounds.
   - Fields plus Button functions ≤ 16 per block. The editor shows what is left ("12 of 16 used: each field and each
     button uses one") and refuses past it in plain words.
   - Rules and timers don't count toward this.
   - The 32-field limit stays as the data-module ceiling but a block can't reach it.
3. **Timers:** keep the existing contract (no `set` from a timer). A Timer function may only add to number fields; the
   editor offers only number fields there.
4. **Tail tokens:** the host's existing estimate is enough.
5. **Scene causes:** `scene.place` / `scene.weather` keep their existing story/system uses. §2.7's refusal applies only to
   the new reader commands.
6. **Release shape:** one release, 2.7.0, with both layers; no separate layer-1 head. The lead does the browser checks
   (computed styles, 44 px targets, zoom, mockup match).

## 7. Lead decisions after review 148r (29 Oct). Head 9b0036a.
1. **148r blocker 1 (an edit survives deletion of the leading reply that carries it) is not a blocker.**
   - Deleting the oldest remaining replies carries their state forward. That is the documented leading-history carry
     (REPLAY.md), and it already applies to every story change in those replies; main does it for scene UI commands too.
   - Reader edits follow the same rule as the story changes of their reply:
     - deleting or swiping a reply that is not the oldest remaining one takes its edits back (tested);
     - deleting the oldest remaining replies keeps what they did, edits included.
   - Fix the docs, not the store: SPEC "reader edits", REPLAY "Leading history", the card hint's help text and GUIDE
     say this plainly. No `replyBound` change for edits.
2. **148r blocker 2 is real.** Inventory add and edit guards must witness the inputs that chose a merge or a destination:
   - the name resolution, the destination stack, and the compatibility inputs (note, equipped, condition, key, owner);
   - if they changed, the edit stays off with `REPLAY_PREREQUISITE` (a Problem), as other changed prerequisites do;
   - add the reviewer's two Re-read repros as tests (live, rebuild and reload).
3. **148r blocker 3 is real.** A block exported as a pack and imported keeps its presentation and buttons:
   - the shared block renderer draws any pinned definition that has a `show` key (tab, card or both, with Button
     functions as `dm.act` buttons);
   - chat-only actions (Edit fields, Remove, Save as template) appear only for `pack.chat/*`;
   - test the imported tab, the Home card and a button press after import.
4. **Non-blocking notes from 148r are to be fixed in the same pass:**
   - the editor's error goes beside the bad effect Value control;
   - REPLAY.md's guard list includes `dm.set`, the block predicates and the inventory edit guard dispatch;
   - DATA_MODULES.md's command table includes `dm.define`, `dm.redefine` and `dm.remove`.
