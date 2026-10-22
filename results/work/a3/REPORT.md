# a3 — Features toggle fuzz (SPEC §6 Features, MODULES §F100), pass 1

Heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79.
No module on v2 declares features yet (grep `features:` / `feature:` in rpg_battle, Story_director,
npc_state_delta src: none), so the fuzz registers all four modules plus two test modules (scripts/lib.mjs):
`fz` (features owning a capture kind + static/tail part, a command, a query, the beforeGenerate /
canGenerate / afterReply hooks, a tab, `prompt: true`, a tail-only part, state in domains fzk / fzc) and
`fy` (a whole-context feature whose static sits in a part, an onBlocked and an item.define hook under a
feature, a command that ctx.calls fz's command and queries fz's query).

### C3-1 [severity: medium] A whole-context feature (`context.feature`) whose static text is in `context.parts` changes the static prompt part but is not marked `prompt`
- Repo: Story_block, src/v2/features.js:117-123 (`affectsStatic`), used by registry.js:380 (`featureDecl.prompt`) and features.js:156 (the `feature` event's `prompt`).
- Repro: module `{ features: [{ id: 'wy.all', label: 'Y all' }], context: { feature: 'wy.all', parts: [{ static: () => 'WY static part text.' }] } }`; send a reply, `features.set('wy.all', false)`, send another: the static part loses the text, yet `registry.feature('wy.all').prompt === false` and the `feature` event says `prompt: false`.
- Expected: prompt true (the hint "Changes the fixed prompt once" shows; listeners know the static changes). Actual: false. `affectsStatic` checks `context.static` for a whole-context feature but not the parts it also turns off (nor parts with their own feature under it).
- Invariant 5 (static part changes only by a feature marked as changing it; SPEC §5/§6 "A feature that owns ... static text is marked so"). Fuzz: 1640 hits of `static-differs-same-prompt-features`, all from fy.all toggles (0 with them left out).
- Fix: in `affectsStatic`, when `featureOf(def.context) === id`, return true if `context.static` is a function OR any entry of `context.parts` has a `static` function (whatever its own feature), since turning the whole context off drops them all.
- Test: results/tests/Story_block/c3-features-whole-context-static.test.js
- Owner area: SB-features

### C3-2 [severity: low] An `onBlocked` hook under a feature that is off is still called
- Repo: Story_block, src/v2/turn.js:302 (`block()` reads `registry.module(moduleId)?.hooks?.onBlocked` directly).
- Repro: module with `features: [{ id: 'gate.notes', label: 'Notes', default: false }]`, `hooks: { canGenerate: () => ({ ok: false, reason: 'Wait.' }), onBlocked: Object.assign(fn, { feature: 'gate.notes' }) }`; `host.send(...)` is held back and `fn` runs although gate.notes is off.
- Expected: hooks of an off feature are not called (SPEC §6 "Its hooks are not called"). Actual: called. Fuzz: 606 hits.
- Fix: take the hook through the off-aware list: `registry.hookEntries('onBlocked').find(entry => entry.moduleId === moduleId)?.fn` (or check `featureOf` + `featureOn`) instead of the raw definition.
- Test: results/tests/Story_block/c3-features-onblocked-off.test.js
- Owner area: SB-features

### C3-3 [severity: medium] A preview taken while a feature is on commits after the reader turned the feature off
- Repo: Story_block, src/v2/commands.js:463-474 (`commit` checks only the head fingerprint; a toggle never moves the head).
- Repro: feature command `pk.poke` (on); `p = await sdk.preview('pk.poke', {})`; `features.set('pk.cmd', false)`; `sdk.command('pk.poke')` → FEATURE_OFF, but `sdk.commit(p.token)` → ok and the ops are stored (pokes 0 → 1).
- Expected: FEATURE_OFF, nothing stored (off means fully off; commands refused at the top). Actual: committed. Fuzz: 82 hits.
- Invariant: SPEC §6 Features (a feature's state is not touched while off).
- Fix: keep the command type in the preview entry and, in `commit`, refuse with FEATURE_OFF when `registry.commandFeature(type)` is set and off (same check `resolve()` makes); a ctx.call'd feature command inside the previewed handler could also be recorded on the tx and re-checked.
- Test: results/tests/Story_block/c3-features-commit-after-off.test.js
- Owner area: SB-features

### C3-4 [severity: medium] Re-read while a kind's feature is off wipes what that kind's lines made on the reply; turning the feature back on does not bring it back
- Repo: Story_block, src/v2/turn.js:537-566 (`reread` → `captureEach` skips off lines at :472, then `store.replaceStory` replaces all the reply's story receipts).
- Repro: reply with `~ tick Alpha | n: 4` (kind `tick` under `tk.kind`) → ticks {Alpha:4}; `features.set('tk.kind', false)`; `sdk.reread(index)` → ok, ticks {}; `features.set('tk.kind', true)` → still {} (until another Re-read).
- Expected: per SPEC §6 "Its state is never touched: turning the feature on again brings everything back as it was". Actual: the feature's changes from that reply are gone. (A live reply captured while off, then the feature turned on, gives the same state live and on replay: its lines were never used, ops are replayed as stored — that is consistent and not a finding; this one is the Re-read path rewriting stored ops while off.) Fuzz: 47 hits.
- Fix: in Re-read, keep the reply's stored story blocks whose receipt type is `capture.<kind>` of a kind that is off now (pass them through to replaceStory unchanged, in order), and only re-run lines of kinds that are on; or refuse Re-read with a plain sentence while a kind with stored receipts on that reply is off.
- Test: results/tests/Story_block/c3-features-reread-off.test.js
- Owner area: SB-features

## Held up
- Toggle fuzz, 250 seeds x 100 steps (25,000 steps, ~5,500 toggles over all 10 features incl. story-block.hud/cards/preroll/extractor, ~2,000 change lines of an off kind), mixed with sends, swipes (new + back), regenerates, continues, deletes (last + middle), reloads, commands, Re-reads: with the four ops above left out (`--known`), 0 violations.
  - live head == a fresh store rebuilt from the chat after every step (replay == live with toggles in the timeline), incl. replies captured while off then the feature turned on (stored ops replayed as is; the choice is the reader's, so replay never re-reads lines).
  - a toggle never changes the head; reload keeps the head.
  - static part byte-identical for the same on-set of prompt-marked features (fz.kind with kind + static part, fz.flag prompt:true); grammar line present iff the kind's feature is on; tail part lines present iff on.
  - lines of an off kind: quiet FEATURE_OFF problems, not in refusedFrom (card), reply ops never touch the feature's domain; aliases / upper-case kind word too.
  - commands refused FEATURE_OFF at the top (rev unchanged) and via ctx.call (caught, nothing ran); queries null via sdk.query and ctx.query; beforeGenerate / canGenerate / afterReply / item.define hooks never called while off; tab hidden iff off.
- Declarations (scripts/declprobe.mjs): dup id, wrong prefix / no dot / sub-dot / upper case, label > 60 / blank / non-text, describe > 240 / null, default / prompt non-boolean, feature naming another module's feature (command, kind, context, widget, screen), feature value null / object: all refused with a plain sentence, the other module's features kept; unknown field warned and ignored; 5,000 features register in 10 ms.
- Not filed (notes): a getter that throws on a feature entry / a Proxy `features` throws the raw error out of register() instead of the "cannot be registered" refusal (developer-only hostile input, same as other definition keys); a label padded with spaces to 62 chars is refused though the trimmed label is 60; feature ids have no length cap (a 100k-char name registers).

# Pass 2

Heads: Story_block 5ef7ead (fetched: +#101 extractor, +#99 packs), Story_director affde13 (fetched: #90 day digest,
the first real module feature `story-director.digest`), rpg_battle 924b9a3 and npc_state_delta 5243d79 (no new
merges; still no `features`). C3-1..4 still fail on 5ef7ead.

### C3-5 [severity: low] A module that changes its definition after registering makes the features calls throw
- Repo: Story_block, src/v2/registry.js:368-381 (`featureDecl` reads the live `def.features` and calls `feature.label.trim()` on every featureOn / features() call; register keeps the module's own object, defs.set(id, def)).
- Repro: register a module with `features: [{ id: 'tk.kind', label: 'Ticks' }]` and a kind under it; afterwards `def.features[0].label = 7` (or `def.features.push({ id: 'tk.late', label: 'Late' })`, or `def.features = null`). Then `sdk.features()`, `sdk.feature('tk.kind')`, `features.list()` and `features.set()` throw (TypeError), and so does renderSettingsHost's Features list (host-ui.js:226 calls `features.list()` unguarded). A `~ tick` line is lost in the same state (ticks stay {}).
- Expected: nothing throws to the reader (invariant 4); what was checked at registration stays. Actual: TypeErrors out of the sdk and the settings overlay.
- Fix: at register, snapshot each feature into a frozen decl (id, label trimmed, describe, default, prompt computed once) in a Map, and have featureDecl / features() read only that; also guard `features.list()` in host-ui.
- Test: results/tests/Story_block/c3-features-def-changed.test.js
- Owner area: SB-features

### C3-6 [severity: medium] DUPLICATE of C1-1 (results/tests/Story_block/c1-damaged-spans-append.test.js): an action taken on a reply whose record spans no longer add up is shown live but lost on any rebuild
- Repo: Story_block, src/v2/store.js:531 (append writes `spans: [...(spansOf(record) ?? []), { n: added.length, ... }]`; with spansOf null, a record holding story receipts whose spans do not add up, the new span alone still does not add up, so the whole record stays one block). Also :529 spreads `record.ops` as is, so a record whose `ops` is a string gets one op per character.
- Repro: reply with `+ item Rope`; hand-edit its record to carry one op more than its spans count (`record.ops.push({ op: 'replace', path: '/domains/scene/nope/x', value: 1 })`, in extra and swipe_info), reload; `sdk.command('scene.present', { add: 'Fenna' })` → ok, head present ['Fenna']; a fresh store over the chat, or a reload, gives [] (the block with the bad op and the reader's action is skipped as one).
- Expected: the old ops stay one (skipped) block and each later append its own block, so the new action replays (invariants 1, 7). Actual: replay != live; the action vanishes on reload / swipe / delete. Fuzz (pass 2, corrupted-record op): every replay!=live / reload-changed-head hit traced to this (a damaged record that later gets appended to).
- Fix: in append (and the other writers that extend spans), when spansOf(record) is null, start the spans with one block for the ops already there (`{ n: record.ops.length, story: true }`) before adding the new span; and treat a non-array `ops` as damaged (start a clean list next to it or refuse to append) rather than spreading it.
- Test: none of mine (C1-1's covers it). Extra angle for the fix: a record whose `ops` is a string gets it spread into one-character "ops" by append (store.js:529).
- Owner area: SB-storage

## Pass 2 notes and held up
- (1) Raw throw from register(): reachable only through `sdk.registerModule` (async). Every module's load path catches it (rpg_battle index.js boot: console.error + a toastr with the raw message; Story_director index.js; npc_state_delta storysuite-v2.js:614 warns and keeps working standalone). Registration validates before it writes anything, so the host and the other modules' features are unchanged. Not filed; at most the toastr shows "boom" instead of the plain sentence.
- (2) Fuzz 250 seeds x 400 steps with --known plus pass-2 ops: edits (text or a new <Changes> block), corrupted records (ops junk, spans wrong, a bad op with spans fixed, bad checkpoint, receipts null) then reload, rewind (sdk.rewind on a random receipt rev), branch (ctx.branchChat), Re-read, toggles DURING a pending generation (at prompt-ready, between interceptor and MESSAGE_RECEIVED, 30% of sends/swipes/regenerates) and DURING a pending command save (saveChat held on a gate, toggle, release). 100,000 steps, 28,499 toggles, 4,827 off-kind lines, 604 day digests: 1 bad seed (seed 5), C3-6 again (my corruption op had spread a junk-string ops into chars, then spans did not add up). Otherwise:
  - replay == live, static/tail per the request-time features (a mid-generation toggle never breaks the request it came in, and the next request is byte-identical for the same features), lines captured after a mid-generation toggle follow the feature as it is at capture (quiet FEATURE_OFF when turned off mid-way, used when turned on mid-way), commands with a pending save then a toggle: result well-formed, state as committed;
  - edits never re-capture; rewind/branch keep features (reader's, not the chat's) and replay matches.
- (3) Real feature `story-director.digest` (SD #90): digest command tagged, Days screen tagged, hook skips it via `view.feature`; fuzzed with clock-setting and day-jump lines: 0 `chronicle.digest` commits while off (604 while on), replay == live through digest-off/on and deletes; turning it back on writes the missed days on the next reply from the receipts (catch-up), as SD's header says.
- Not filed: Story_director's `chronicle.days` / `chronicle.day` queries are not tagged with the feature (they answer while the digest is off; the spec leaves that to the module).

# Pass 3

Heads: Story_block cb2d70e (+#103 pack rank ladder budget, #102 docs), Story_director a8d428f (#91), rpg_battle 924b9a3,
npc_state_delta 5243d79. No new findings filed. All six C3 tests still fail on cb2d70e.

## Pack data: crafting, meterPresets, economy (SB #99), ranks budget (#103)
- scripts/packfuzz.mjs: seeded mutation of the Ersveil pack, sent both as JSON text (with a literal `"__proto__"` key sometimes) and as an object. Mutations cover recipe qty/fee/minutes/dc/craft/station/stat/known/teaches/makes, material qty/item, recipe cycles (A from B and B from A, or makes == its own material), up to 5,000 recipes, crafts fields and duplicates, meter fields/stages/needs/bands/drift, 0-100 meters, economy scale/note, rank rewards, prototype keys (`__proto__`, constructor, prototype, toString, hasOwnProperty, valueOf), unicode/RTL/NUL/5,000-char/markup strings.
- Checks: validatePack never throws; Object.prototype is never polluted; accepted packs stay inside the documented limits (recipe and material qty safe integers of 1 or more, dc 5-40, fee and minutes 0 or more, scale 0.001-1000, meter min<max with start inside). contentOf, craftsOf and economyOf never throw. For installed packs: the packs.crafts / packs.economy / inventory.economy / packs.content queries never throw, inventory.economy stays in range, and a `+ coin 999999999999` line is held to the budget.
- Runs: 1-200 (up to 6 mutations, host every 5th) and 1-600 (SOFT=1, 1-2 mutations, host every 2nd). 800 packs in all, 202 accepted, 51 installed in a host. No throws, no pollution, no out-of-limit numbers, no coin over budget. The only signatures were notes:
  - **recipe-makes-own-material / recipe cycles are accepted.** Nothing consumes pack recipes yet (rpg_battle crafting is its own commission plan in trade/core.js), so "a recipe that outputs more value than its inputs" cannot mint anything today. Whatever adds a craft command later should check the output value against the inputs and refuse cycles.
  - **Recipe records keep any extra key**, including `hasOwnProperty` and `valueOf` set to objects. This is by design: recipes are "open records" that keep extra plain data. It is harmless today, because no code calls `record.hasOwnProperty(...)`; the code uses Object.hasOwn.
- scripts/meterprobe.mjs, directed cases. Each of these is refused with a plain sentence:
  - a stage naming an unknown meter, or a needs value out of range;
  - duplicate meter ids, unsorted bands, a band outside the meter's range;
  - drift too large, or drifting toward a value outside the range;
  - a reserved or `__proto__` meter id, start outside the range, min == max;
  - markup in describe, a band word, a craft note or the economy note;
  - duplicate craft stats, a bad station;
  - an economy scale that is negative or text.

  Accepted as designed: a pack craft with a default's id replaces that default, and recipe `stat` takes any uppercase names (packs may define their own stats).
- Invariant 6: none of the new fields (craft title/note/teaches, meter describe/bands, economy note) is drawn by Story Block's UI yet (the panel only counts them). Markup in them is refused at validation (UNSAFE_HTML, or "may not hold < >").
- **Observation (not filed; design question for SB-packs2 / SB-inv):** a pack's rank reward may go up to Number.MAX_SAFE_INTEGER (validate.js:864). Since #103, without a quest module, the first enabled pack's level-1 rank top is the per-reply story coin budget. So Ersveil with `ranks[0].reward = [0, 9007199254740991]` lets one `+ coin 900000000000000` line pay 9e14 (scripts/rankprobe.mjs). The spec says pack-written numbers stay as written, so this follows the rules as written. Still, a pack shared online sets an unbounded mint for model text. A sane ceiling on pack rank rewards, item values and start coin (for example 1e9) would close it.

## Watching for real features
- Fetched all four repos twice in this pass: still no `features:` in rpg_battle or npc_state_delta. Story_director's only feature is story-director.digest.
- Regression on the new heads: fuzz.mjs 1-100 x 200 `--known --p2`, 20,000 steps, 5,787 toggles, 134 digests: 0 violations.

# Pass 4

Heads: Story_block ff96802 (Wave B #104), rpg_battle ee927b0 (party wave C #92), Story_director a8d428f, npc_state_delta
e56e356. Still no module `features:` beyond story-director.digest and Story Block's own (now also story-block.loot,
story-block.encumbrance, which the toggle fuzz picks up automatically).

### C3-7 [severity: medium] Equip on… pushes the main character past their own carry limit with the piece it puts away
- Repo: Story_block, src/v2/domains/inventory.js equipOn (~:476 `readerCarry(ctx, [{ defId: def.id, qty: stack.qty }], actor, true)` checks only the new piece; ~:503 `for (const other of off) other.owner = actor;` moves the replaced pieces with no check).
- Repro (real host with RPG Battle, scripts/equipprobe.mjs): the main character (STR 9, capacity 56) carries 46 of their own and wears Old Mail from the shared bag (owner 'party'). `inventory.equipOn { stack: New Mail (in the bag), actor: pc }` → ok. New Mail (10) fits (56), then Old Mail (10) comes back into the pc's own carry: 66 of 56, and inventory.encumbrance now lists the pc at 66/56. Minimal test with a stub carry rule: results/tests/Story_block/c3-equipon-carry.test.js (Ren 10/20 → 30/20).
- Expected: the reader's own hand-overs past the limit are refused (SPEC §7 Encumbered: "The reader's own takes, buys and hand-overs past the limit are still refused"). So either refuse, or check the new piece plus every replaced piece that changes owner (the shared bag's pieces move from 'party' to the member). Actual: accepted, member over capacity. Invariant 3 (rules set the numbers; the carry rule is bypassed by a click).
- Fix: in equipOn, build the carry check from the new piece (when `from !== actor`) plus each `off` piece whose owner is not `actor` yet (`other.owner === 'party'`), as one `items.carry({ owner: actor, add, move: true })` before changing anything; or leave the shared bag's replaced pieces in the bag (owner stays 'party', just unequipped).
- Test: results/tests/Story_block/c3-equipon-carry.test.js (fails on ff96802 at the load assertion)
- Owner area: SB-inv

## Pass 4 held up / notes
- **Loot** (scripts/lootprobe.mjs, real host):
  - `pick: [0, 0, 1, '1']` takes each thing once;
  - a second take is REFUSED (claim);
  - a regenerate gives a fresh take that holds once per timeline;
  - after a drop the take is still REFUSED (one take per offer);
  - Re-read keeps the claim;
  - deleting the loot reply is consistent;
  - replay == live at every step.

  The offer is counted into the reply's story tally when it is read (storyItems), so loot plus `+ item` lines in one reply cannot double the budget.
- **RB wave C** (scripts/rbprobe.mjs):
  - Unknown ranks (`SS`, `S+`, `ZZZ`, `__proto__`, 9 letters, `-1`) are INVALID problems; `f` reads as F; fullwidth `Ｓ` is held to the highest rank that is not deadly (E).
  - `+ join` levels 999999999, -3 and 1e3 are held to pc+2 / pc±1; the role `__proto__` or markup is cleaned to words; companion stats follow the formula (total 55 + 5×level).
  - `party.spend` with -5, 1.5, 1e9, "1", 0 or `__proto__` is refused with a sentence and changes nothing. Spends serialize on the head (preview + commit after another command → STALE).
  - Not reachable today: companionWeights accepts a preset object with arbitrary points (only from a caller, internal); a weight of Infinity would make the stats NaN (spreadByWeights divides Infinity by Infinity). No current caller passes one (offers keep only a preset id).
- **Tolerant names** (scripts/namesprobe.mjs). As the spec defines it, the following all land on the existing def: plural, article, zero-width space, case, `Potion of Healing` / `Key Iron` (word order), `a coil of Rope`, `Ropes (frayed)`. These are noted as spec questions, not filed:
  - **Parenthetical qualifiers are dropped.** `+ item Healing Potion (Greater)` adds to the Healing Potion stack, and `inventory.find('Healing Potion (Greater)')` finds the common Healing Potion. So a fetch quest for a "(Greater)" item written that way is satisfied by the lesser one. The spec says "a part in parentheses" is a portion word. Suggest dropping a parenthetical only when it holds a portion word ("(piece)", "(bundle)"), not any qualifier ("(Greater)", "(cursed)", "(empty)").
  - **Homoglyphs make look-alike stacks.** `Healing Pоtion` with a Cyrillic о is a separate def and stack that looks identical to Healing Potion. Loot's "already carried" check and `- item` treat them as different things. cleanName folds format characters and NFC but not confusables (NFKC would fold the fullwidth forms; a confusable-skeleton key would fold Cyrillic/Greek look-alikes). Low: display confusion, not a mint, since each def keeps its own value.
  - Diacritics (`Héaling`) are a different name, which is fine.
