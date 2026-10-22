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

