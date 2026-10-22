# Beta fuzz cell — report

Four fuzzers on the testkit: (1) replay at scale, (2) capture/grammar, (3) Features toggles, (4) storage/save paths.
Full write-ups land here per pass, newest first.

## Pass 1 — Features toggle fuzz (agent 3)

Verified by the lead: all 4 tests fail on Story_block e0fd33b.

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


## Pass 1 — Capture and grammar fuzz (agent 2)

Heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79. Verified by the lead: all
21 test cases in the 6 files fail on these heads. (The agent could not write .md files; this write-up is the lead's from its report.)

Kinds on v2 with all four modules: SB coin, item, place, present · RB check, encounter, join, leave, market, rest, skill,
use, wound · SD agenda, beat, clock, event, faction, hook, landmark, quest, route, secret, time, world · NSD npc.
No capture kind yet for equip/cond/wear/repair, crafting, timed effects, party ranks or digest. Covered instead: quest ranks
(F104), NSD changeCap/stages, notable story item, `! use`, same-reply checks.

Runs: ~23,700 hostile replies (seeds 1000–1599 × 25 = 15,000 in 580 s; seeds 5000–5299 × 25 = 7,500 with valid calendar
times and a Re-read check on 12% of replies; ~1,200 smoke). Signatures: COIN over budget on quest turn-in 49 → C2-1;
bare block after Continue 115 → C2-2; reasoning sentinel read 40 → C2-3; Re-read ≠ live 19 (harness slug ids, or C2-2/C2-6
symptoms; seed 5186 reply 18 not minimized); time > 4×maxJump 3 → C2-5; "atlas route must be a whole number" 251 (clean
refusal known since r1); TOO_MANY (harness false positive); lone surrogates kept in state ~15k (low, not filed).

### C2-1 [severity: high] Fetch quests of story-minted items pay past the per-reply budget, any number per reply
Repo Story_director, src/v2/quests/index.js:336 (`storyMoney = !target && !byPack`), :199 wordRule, :144 (`vouched`).
Repro (level 1, budget 50): one reply `+ item Rope | qty: 18` plus six `- quest Fetch X — turned in` (goal "Bring 3 Rope")
pays 300; with `rank: S` each pays 230 (six → 1380); one fetch quest + `+ coin 50` pays 280. A story-vouched errand of the
same rank pays 50. The reader only has to accept the job. Invariant 3. Fix: a fetch quest whose items are story-made in the
same reply goes down the vouched path (one turn-in per reply, rank held to the party's, paid as `story: true`).
Test results/tests/Story_director/c2-fetch-quest-story-items.test.js (2). Owner SD-ranks / quests.

### C2-2 [severity: medium] A <Changes> block split across a Continue loses the continuation's lines and leaves raw markup visible
Repo Story_block, src/v2/capture.js:221 laterBlocks (`block.start >= from`), turn.js:614-633. `…<Changes>\n+ coin 5\n` then
Continue `+ item Rope | qty: 2\n</Changes>`: no Rope and `-->+ item Rope…</Changes>` shown. `<Chan` + Continue `ges>…`:
whole block unread, bare, no Problem. Cut at `+ item Ro`: item "Ro" made, or (stopped) the line lost with the half line
visible. Invariants 3/4. Fix: on Continue, re-scan from the start of the last open block across the join, and hold a
trailing partial line until the reply ends. Test results/tests/Story_block/c2-continue-split-block.test.js (3). Owner main.

### C2-3 [severity: medium] A reply cut off mid-reasoning applies the draft block inside the unclosed <think>
Repo Story_block, src/v2/capture.js:201-213 (only closed pairs masked). After a Continue closes `</think>`, the draft stays
applied (20 coin + 3 Torch on top of the real Rope); Re-read then differs from live. A stray mismatched close (`</think>`
inside `<reasoning>`) ends reasoning early. Invariants 1/3. Fix: an unclosed opening tag masks to the end of the text;
close only on the matching tag name. Test results/tests/Story_block/c2-cut-mid-reasoning.test.js (2). Owner main.

### C2-6 [severity: medium] Hiding a block writes the blanked text back into the message
Repo Story_block, src/v2/capture.js:286 hideBlock (bodies taken from the reasoning-blanked text). Reasoning inside or
overlapping a block is erased from the saved message for good (replaced by spaces); a mid-line mention ("Story with a
`<Changes>` word in it.") opens a block and moves the rest of the story into the hidden comment. Invariant 4/7 (reader text
lost). Fix: take offsets from the masked text but splice bodies from the original; only open a block at line start.
Test results/tests/Story_block/c2-hide-masked-body.test.js (2). Owner main / SB-storage.

### C2-4 [severity: low] `+ coin` turns other minus signs and fractions into whole positive amounts
Repo Story_block, src/v2/domains/money.js:54-59 parseAmount (sign check only `-−–—`). `‐30 ‑30 ‒30 ⁻30 ₋30 ﹣30 －30` each pay
30; `.5`/`٫5` pay 5; `2⁵` pays 2; `½5`; RLO+`03` (shown as "30") pays 3. Within the per-reply budget. Invariant 3. Fix: NFKC
the amount and refuse anything but `[0-9]+` after an optional ASCII/known minus. Test
results/tests/Story_block/c2-coin-amount-forms.test.js (11). Owner SB-inv.

### C2-5 [severity: low] maxJump is held per time line, not per reply
Repo Story_director, src/v2/tracker/time.js:138-158. 150 × `! time +30d` in one reply moves the clock 4,500 days.
Invariant 3. Fix: keep the reply's total jump under the carrier sid and cap the sum. Test
results/tests/Story_director/c2-time-jump-per-reply.test.js. Owner SD-digest.

### Held up
No exception/console.error reached the reader, no reply left without a turn, none over 3 s. Store rebuild == live after
every reply; fresh full replay == live on every seed. Static prompt byte-identical; tail in budget. Caps held without quest
turn-ins: coin ≤ budget, ≤ 20 of one item per reply, goods-worth and notable-item limits, ≤ 10 new definitions, no XP gain,
NSD meters ≤ 15 per reply (homoglyph/fullwidth/zero-width name variants included), ≤ +1 actor per reply. Prototype-key
names/labels safe in every module. `extra.reasoning` ignored; closed and mismatched think/thinking/reasoning pairs masked.
Duplicate quest turn-ins claimed once. 150-line cap holds. `qty` parser strict (only "0020" of 50 odd forms accepted).
Not filed: `<details>`, `<thought>`, fullwidth "think" not treated as reasoning; `<think\n>` not recognised; NSD accepts loose
meter numbers (`5.`, `20,5`, `1 000`), clamped to 15.

## Pass 2 — re-check on new heads (lead)
Heads: Story_block cb2d70e (+#99 crafting data/meter presets/money scale, #101 extractor reasoning, #102, #103),
Story_director a8d428f (+#90 day digest, feature story-director.digest; #91 RX-E-1), rpg_battle 924b9a3, npc_state_delta 5243d79.
- C2-1 FIXED by Story_director #91: both tests pass on a8d428f.
- C2-2..C2-6 and C3-1..C3-5 still fail on the new heads.

## Pass 2 — Features toggle fuzz (agent 3)
See results/work/a3/REPORT.md "Pass 2". Summary:
### C3-5 [severity: low] A module definition changed after register makes the features calls throw
Story_block src/v2/registry.js:368-381: `featureDecl` re-reads the module's live `def.features` on each call (incl.
`label.trim()`). After register, `def.features[0].label = 7`, a pushed feature, or `features = null` makes `sdk.features()`,
`sdk.feature()`, `features.list()`, `features.set()` throw TypeError; the settings Features list (host-ui.js:226) throws
too and that kind's lines are lost. Invariant 4. Fix: freeze a copy of each feature at registration and read only that.
Test results/tests/Story_block/c3-features-def-changed.test.js. Owner SB-features.
C3-6 was a duplicate of agent 1's C1-1 (record spans out of step; pending agent 1's report). Not filed: register() raw throw
(only via async sdk.registerModule; all three modules catch it — RB shows the raw message in a toast).
Fuzz pass 2: 250 seeds × 400 steps = 100,000 steps, 28,499 toggles, 4,827 off-kind lines, 604 day digests, with edits,
5 corruption kinds + reload, rewind, branch, Re-read, toggles mid-generation and during a gated command save: only known
signatures. Real feature story-director.digest: 0 digest commits while off, 604 on; replay == live across toggles/deletes.
