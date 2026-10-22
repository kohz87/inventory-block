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

## Pass 1 — Storage and save paths (agent 4)
Heads Story_block e0fd33b (re-run on 5ef7ead and by the lead on cb2d70e: all 5 tests fail), rpg_battle 924b9a3,
Story_director f001974, npc_state_delta 5243d79. The storage-tuning PR has not appeared (open SB PRs #100 beta.1 prep,
#104 inventory wear/repair, #105 widgets). Write-up by the lead from the agent's report (it could not write .md files).

Harness: testkit host, all four modules; saves through the real chat-file.js to a fake server with modes ok, throw, sync
throw, 500, integrity, hang (written on arrival, answered late), hangfail (late 500), reorder; SillyTavern's own save
modelled after each generation, delete and swipe. Checks after every step: fresh store over the live chat == live head (#1);
clean store with nothing in flight has the live head on disk (#7); file == live after recovery; reload/rename/card edit keep
the head. Runs: 200 × 100 mixed (0 on #1/#7; 4 "still dirty after a good flush" = stale-index rescue, C4-4 class);
40 × 150 checkpoint-heavy (0; chats of 145–200 messages, 110 checkpoints); 20 × 80 with SillyTavern's own saves failing too
(5, all SillyTavern's own loss). All 5 findings came from directed probes, not the fuzz.

### C4-1 [severity: medium] A save the server never answers blocks everything after it
Story_block src/v2/chat-file.js write() has no timeout. While one save is unanswered, later saves, the reader's command and
the next generation wait forever (the interceptor's before-reply flush never returns; no prompt is built; nothing told).
Invariants 4, 7. Fix: AbortController timeout on write/read, treated as a failed save (told, retried).
Test results/tests/Story_block/c4-save-hang.test.js. Owner SB-storage.

### C4-3 [severity: medium] An unsaved change is dropped when the same chat takes over ~10 s to be read again
SillyTavern reloadCurrentChat with the chat array empty: after 50 waits of 200 ms persist.js sets `saved = goal` without
writing; the change disappears from page and file, untold (a 3 s load keeps it). Invariant 7. Fix: when the waits run out,
keep the change dirty/orphaned, never mark it clean. Test results/tests/Story_block/c4-slow-reread.test.js. Owner SB-storage.

### C4-5 [severity: medium] The r3-1 fix (#95 markUsed) does not cover rescued saves
New greeting-only chat; the first reader action's save is refused; the reader opens another chat; the rescue writes the
record with the file's untainted header. After reopening, a card edit or rename regenerates the greeting and the state is
lost (page and file). Same with a bus command still in the 400 ms window. Invariant 7. Fix: `markUsed(header.chat_metadata,
messages)` in storeSaving.rescue before file.write. Test results/tests/Story_block/c4-rescue-pristine.test.js. Owner SB-storage.

### C4-2 [severity: low] A save that reaches the server after a rename lands under the old name
Request sent before the rename, arriving after: the server writes `<old name>.jsonl` (ghost chat), the renamed chat (page and
file) lacks the change; store clean, nothing told. Invariant 7. Fix: in store.renamed(), mark a save in flight to the old
name dirty again with the new name as target. Test results/tests/Story_block/c4-rename-midsave.test.js. Owner SB-storage.

### C4-4 [severity: low] Rescue finds the changed message by its old index
A save is refused, the reader deletes an earlier message (SillyTavern saves the chat with records), then opens another chat:
the rescue fails 3 times and reports "…no longer holds message 6" though the file holds the change. Risk (not reproduced):
send_date is per minute, so a stale index could match another reply and write the wrong record. Fix: match by sid/swipe mark;
count it saved when the file copy already holds the same sid and rev. Test results/tests/Story_block/c4-rescue-shifted.test.js.
Owner SB-storage.

### Held up
r3-1 fixed for plain cases (b2 test passes): card edit after a plain/refused/late save, a 400 ms-window bus command (record
carried onto the new greeting), reload. Failed/retried saves in all modes across several replies and commands keep every
reply and command once the server recovers (UI command during a reply's save, two commands in one tick, late/failing saves
during swipe/swipeTo/swipe delete/deletes, same-chat fast reload with a refused change, rename with CHAT_RENAMED in window,
retrying and plain). Checkpoint rules (20 carriers / 32 KB, covers) held under deleting the checkpoint carrier, middle
deletes, deleting old swipes, regenerate/continue on top. Not filed: rename without CHAT_RENAMED (known r2-2); losses when
SillyTavern's own save fails; a fake-server reorder artefact; UX: any first Story Block save taints a new chat so SillyTavern
stops refreshing its greeting from an edited card (only after a reader action).

## Pass 3 — Features fuzz agent on pack data (agent 3)
Heads SB cb2d70e, SD a8d428f, RB 924b9a3, NSD 5243d79. No new findings; C3-1..5 still fail.
- Hostile pack data (#99 crafting, meter presets, money scale; #103 rank budget): 800 seeded Ersveil mutations (JSON text and
  object), 202 accepted, 51 installed. Validation never throws, no prototype pollution, accepted packs within documented
  limits, packs queries / inventory.economy never throw, scale held to 0.001–1000, `+ coin 999999999999` held to budget.
  22 directed meter/craft/economy cases: 20 refused with a plain sentence (markup in describe, band words, craft notes,
  economy note), 2 accepted by design.
- Design question (not filed, for SB-packs2 / SB-inv): a pack rank reward may be up to MAX_SAFE_INTEGER (validate.js:864);
  since #103, with no quest module, it becomes the per-reply story coin budget, so a shared pack lets one model line pay 9e14
  (results/work/a3/scripts/rankprobe.mjs). Spec says pack numbers stay as written; a ceiling would close it.
- Not filed: recipe cycles / value-positive recipes cannot mint yet (nothing reads pack recipes; a future craft command must
  compare output value and refuse cycles).
- Toggle fuzz re-run on new heads: 100 × 200 = 20,000 steps, 5,787 toggles, 134 digests, 0 violations. RB and NSD still
  declare no features.

## Pass 1 — Replay fuzz at scale (agent 1)
Heads SB e0fd33b, RB 924b9a3, SD f001974, NSD 5243d79; all 4 tests re-verified failing by the lead on SB ff96802.
Write-up by the lead from the agent's report (subagents could not write .md files). Counts in runs.md.

### C1-2 [severity: medium] Deleting an earlier swipe makes the next save "fail" verification; store.flush() and sdk.rewind() throw
Story_block src/v2/store.js:129-141 (`verify.after` reads `swipe_info[token.swipe]`), store.js:718-727 (rebuild re-stamps
shifted records via persist.restamp, persist.js:166-173, which skips write(), so `lastWrite` keeps the old swipe index),
rewind.js:77 (`await store.flush()` outside any try). Repro: a reply with swipes 0 and 1, swipe 1 captured last and saved;
go to swipe 0 and delete it as SillyTavern's deleteSwipe does (splice swipes and swipe_info, show old swipe 1 as 0, emit
MESSAGE_SWIPE_DELETED); store re-stamps, is dirty; `store.flush()`. Actual: chat written, then verification throws "The story
was saved, but message 4 no longer holds its latest changes (change none instead of 2); the story stays marked unsaved" —
a false save error; `sdk.rewind()` throws instead of `{ok:false}` (RB's return-in-time shows the raw error). Fuzz seed 120.
Invariants 7, 4. Fix: route restamp writes through write() (or update lastWrite); verify the shown swipe by sid not index;
wrap rewind.js:77 and return fail('FAILED'). Test results/tests/Story_block/c1-swipe-delete-save-verify.test.js (2). SB-storage.

### C1-3 [severity: medium] After a middle delete, rewinding the head reply is refused although the chat replays fine
Story_block src/v2/store.js:682 truncate: `step(base, ops)` applies kept ops strictly in one go, without `{ replayed: true }`
(no gone-key remove pass-over, no rule c) and not block by block; rewind.js:73's dry run refuses. Repro (all four modules,
tests/v2/break/helpers/suite.js): PC + 11 replies each with `+ coin`; regenerate the last (a second checks.prepare lands on
the reply before), delete it; RB checks.prepare prunes the oldest dice entry (MAX_PREPARED 8) with `remove
/domains/checks/prepared/revN`; delete the middle reply that added that entry and its user message. Chat replays with no
Problem; `sdk.rewind({ index: head, beforeRev: <last checks.prepare rev> })` → `{ok:false, FAILED, 'The changes could not be
taken back… "/domains/checks/prepared/rev7" does not exist'}`. Fuzz: 6/200 seeds (148, 158, 180, 207, 246 checks/prepared;
239 /domains/director/threads/<id>/rev). Invariant 2. Fix: truncate replays each kept chunk as replay does
(`step(state, chunk, { replayed: true })`, skip+report failing chunks) or reuse replayRecord on the cut record.
Test results/tests/Story_block/c1-rewind-after-middle-delete.test.js. SB-storage (store/rewind); RB's prune is correct.

### C1-1 [severity: low] A change written onto a reply whose record is damaged is kept live but lost on reload
Story_block src/v2/store.js:531 append (`spans: [...(spansOf(record) ?? []), { n: added.length, … }]`), :385-392 spansOf
(null when story spans don't add up), :395-408 blocksOf (all ops one block when spans don't fit); Continue path the same.
Repro: a reply with `+ item Rope` and `+ coin 5 | from: Kael`; hand-edit the file so one op no longer applies (`replace
/domains/nope/x`, spans one short); loadChat (record skipped, Problem listed — correct); reader runs `scene.present
{add:'Ann'}` landing on that reply (a cue or Continue does the same). Live has Ann; cold rebuild `present: []` (new ops
appended with spans [{n:2}] against 5 ops → one failing block; two receipts with the same rev). Invariants 1, 7.
Fix: when spansOf is null keep old ops as their own block `[{ n: record.ops.length, story: true }, { n: added.length, … }]`
(also Continue / Re-read), or give the carrier a fresh record and keep the damaged one aside. Also store.js:529 spreads a
string `ops` into one-character "ops" (agent 3). Test results/tests/Story_block/c1-damaged-spans-append.test.js. SB-storage.

### Held up
Cold-rebuild head (runtime validate + scratch) == live after every step; fresh.at(i) == live.at(i) every 10th step; recorded
points restored exactly — over 60,000 steps apart from C1-1/C1-3. Ops: swipe left/right/new, swipe delete, regenerate,
Continue, delete last/many/middle, edits of replies and user messages, branch, reload from saved JSON, return-in-time after a
death, group (two carriers in a row), save failures, save/generation races. Crafting (commission/time/collect), trade
buy/sell, quest take/decline, rank/difficulty lines, `~ npc` meters (±999, NaN), `! use`, `? check`, wounds/conditions,
join/leave/skill offers, markets, all SD kinds: replay == live. Hostile numbers in every kind refused/clamped with no
divergence. 19 corruption kinds skipped and reported with no throw, replay == live (until a new change lands on the damaged
reply: C1-1).
