# Story Suite v2 beta — final combined breaker cell: report

## Heads tested
| repo | v2 HEAD |
|---|---|
| Story_block | 81b5da313635e3688aa96489bc8ed81b042b5c88 |
| rpg_battle | 3510b504d51b1f038dc48496b02766a87f86f8e0 |
| Story_director | f18d77c01fd778469bb722e99871b7666163b455 |
| npc_state_delta | 1156fd72164ff223854097ed59d0ebf936d5dbd9 |

Own suites on these heads: SB 1864 tests / 0 fail, RB 1389 / 0 fail, SD 898 / 0 fail, NSD `npm test` passes.
Pass 0 was blocked because running the repos' code was refused. After the session owner allowed it, pass 1 ran
with three breakers: a1 replay/saving/storage, a2 economy/combat, a3 live SillyTavern 1.19 matrix. The lead re-ran
every test file on the heads above: all 12 fail. a3-1 was also checked against the real DOMPurify 3.4.2 in
Chromium (results/scripts/lead-purify-check.cjs). With `ALLOWED_URI_REGEXP: /^(?:https:|data:image\/|#)/i`, the
output is `<input><input name="r" value="h"><input><textarea></textarea>`: type, maxlength and rows are gone.

Totals: critical 0 · high 2 · medium 6 · low 6.

## Findings (lead summary, BREAK_BRIEF format; full write-ups with exact repro and fix below)

### B-final-1 [severity: high] Live templates lose input type / maxlength / rows under SillyTavern's DOMPurify
Repo Story_block, src/v2/view/template/sanitize.js:159 (PURIFY_CONFIG.ALLOWED_URI_REGEXP), used from ui-host.js:176.
DOMPurify 3 tests ALLOWED_URI_REGEXP against the value of every allowed attribute that is not URI-safe. So
`type="checkbox"`, `type="radio"`, `maxlength` and `rows` are stripped live. The testkit has no DOMPurify, so the
existing tests can't see this. RPG Battle's race and talent pickers render as text boxes. With no pack, "Choose a
race." never clears and the story stays held (invariant 4: dead controls, stuck story). SB loot picks and
"Equipped only" are hit too, as are SD fields. Fix: drop the regex, or add ADD_URI_SAFE_ATTR for the non-URL
attributes (type, maxlength, rows, cols, min, max, step, …). Test a3-purify-drops-input-type. Screens:
results/shots/s3-race-390.jpg, s3-race-1440.jpg, s3-talents-390.jpg. Owner SB-view (template), RB-screens2.

### B-final-2 [severity: high] Re-read after a story-vouched click pays the coin budget twice
Repo Story_block, turn.js:615 (reread) with domains/inventory.js:1233-1270. A fetch quest turned in by click pays
400. The reply is then edited to add `+ coin 400` and Re-read: the wallet gains 800 against a 400 budget. A cold
rebuild gives the same total. The re-captured reply's tally starts from zero, then the replayed click adds its 400
and writes back its stored tally. If the click had created the wallet, the capture's coin is lost instead.
Invariant 3. Test a2-reread-after-vouched-click. Owner SB-inv / SB-storage.

### B-final-3..6 [severity: medium] A late timed-out save still overwrites newer state when the chat is switched, reloaded, renamed, or the page closes
Repo Story_block, persist.js:401 (startRechecks `open`), createSaver.renamed, runtime.js:204 saveOnUnload. The #115
read-back only runs while the suspect chat is open and untouched, so each of these loses a saved reply on disk:
switching chat (a1-1), reloading the same chat (a1-2), the stale request landing just before a rename (a1-3).
Separately, a keepalive unload save queues behind a hung save and is never sent (a1-4). Invariant 7. Fix: keep the
suspect's target/place and read it back whichever chat is open; move suspect.chatId on rename; send the unload save
outside the exclusive queue, listen to pagehide, and fall back when the body is over 60 KiB. Tests
a1-late-save-chat-switch, a1-late-save-reload, a1-late-save-rename, a1-unload-behind-hung-save. Owner SB-storage.

### B-final-7 [severity: medium] The boss is the foe held back
Repo rpg_battle, combat/setup.js:366 fielded(). `! encounter 4 Wolf, Rat King (boss) | tier: strong` fields four
wolves; the receipt says "1 more hangs back". Fix: field the boss first. Test a2-boss-held-back. Owner RB-balance2.

### B-final-8 [severity: medium] RB built-in prices ignore the pack money scale (F104)
Repo rpg_battle, trade/core.js:382-385, items/define.js:157. Prices come out the same at scales 0.1/1/8/10. In
Ersveil a spear is 135 at the pack's forge and 18 at any off-map smith; story items are valued at about 1/8, so
the goods budget lets about 8× the gear in. No sell-loop profit, because trade.paid caps resale. Test
a2-prices-ignore-money-scale. Owner RB-gear / SB-packs2.

### B-final-9 [severity: low] A late rescue write overwrites a newer save
persist.js:473: the #115 guard covers only the open chat's own saves. Test a1-late-rescue-write. Owner SB-storage.

### B-final-10 [severity: low] A boss with a written rank is labelled below strong
rpg_battle encounter.js:101: `Rat King (boss) | rank: F` is "even" at level 1 and "trivial" at a high level.
Test a2-ranked-boss-below-strong. Owner RB-balance2 / RB-party2.

### B-final-11 [severity: low] Map "Centre on where you are" is a dead button until a place is known
Story_director atlas/widget.js:210/605. Test a3-map-centre-me-dead.

### B-final-12 [severity: low] Non-RPG game: the Day digest feature description says "fights"
Story_director chronicle/index.js:36. In a dating sim with SB + SD only, the prompts, tabs, screens and cards had no
fight/HP/XP wording; only this Features description has it. Test a3-alone-digest-says-fights. Owner SD-digest.

### B-final-13 [severity: low] NSD console noise and hidden meters on a fresh chat (live only)
npc_state_delta index.js:4047. Every new chat logs a 404 for its per-chat file; an empty dossier side answer logs
console.error with a stack; the Cast tab hides meters set by change lines until a scan succeeds. Repro
results/scripts/a3/scen.mjs s4. Owner NSD-meters2 / NSD-prompts.

### B-final-14 [severity: low] PACKS.md money-scale example inverted
Story_block docs/v2/PACKS.md:66, :341: says 0.01 for "one coin is a copper"; the formula needs 100. Owner SB-packs2.

### Fixed during this cell
F1-1 (late timed-out save overwrites a newer one; found by reading the code in pass 0, failed on 0a6ed63) was fixed
by SB #115 (264e81c).

## What held up
- Replay fuzz (a1): 113 runs × 300 steps (106 seeds, about 15,600 replies), all four modules and the Ersveil pack,
  every beta kind listed from the registry. 58 runs used the real checkpoint rules; 55 used a stress copy that
  checkpoints every 7 records and keeps 15 receipts with data. After every step, live matched a cold rebuild, a
  replay with checkpoints stripped, and a reload; earlier swipes restored; nothing threw. 0 divergences. Caveat:
  going back to an earlier swipe and the Continue split block were only exercised heavily in the last 41 runs.
- Saves (a1): late save in a group chat, two stale saves, rename + timeout (only the known ghost copy remains),
  rescue into a renamed chat, rescue into a deleted chat (told, nothing thrown), 7 swipe/last-message delete
  variants and deletes during a save. Not filed: a stale request landing more than ~310 s after the newer save
  still wins; that limit is #115's design.
- Economy (a2): buying or holding gear, refining to +3 (including a failed +3) and selling loses money (−392 over
  the loop). Repair → resell never profits. Botched crafts and crafts from key items sell for 0. Key items stay
  unsellable through sell, commission, craft, merge, transfer, split, leave-party, qty-raise and rename. Per-reply
  budgets hold over 12 replies. A re-opened pack quest is paid once.
- Combat (a2): 1080 seeded auto fights, no stun-lock. The ±15% / one-effect-per-reply caps hold, by reading the
  code. Even/strong on-target rates were not looked at (being recalibrated).
- Live (a3), every scenario at 390 and 1440 px: SB alone; SB+SD dating sim (no fight wording beyond B-final-12, no
  stalls); SB+RB; SB+NSD; all four with 16 features off, then on. About 400 buttons clicked; no page exceptions, no
  horizontal scroll, no blank panes, no stalled generation, no other dead buttons. Live state matched the state
  after reload in every run. RB character import: 8 bad files were each refused with a one-line note. Markup
  markers in names showed as text, and the onerror flag stayed unset.

## Earlier cells' tests re-checked on these heads
| cell | repo | test | on these heads |
|---|---|---|---|
| fuzz | SB | c1-wear-after-middle-delete | FAILS |
| fuzz | SB | c2-coin-amount-forms | FAILS (11) |
| fuzz | SB | c2-cut-mid-reasoning | FAILS |
| fuzz | SB | c2-hide-masked-body | FAILS |
| fuzz | SB | c2-spoof-marker-reread | FAILS |
| fuzz | SB | c3-features-commit-after-off | FAILS |
| fuzz | SB | c3-features-onblocked-off | FAILS |
| fuzz | SB | c3-features-reread-off | FAILS |
| fuzz | SB | c3-features-whole-context-static | FAILS |
| fuzz | SB | c4-rename-midsave (old-name ghost copy) | FAILS (upstream keeps it as todo) |
| matrix | SB | c2-extractor-failed-no-note | FAILS |
| fuzz | SD | c1-time-after-middle-delete | FAILS |
| fuzz | SD | c2-time-jump-per-reply | FAILS |
| matrix | SD | c1-days-date-twice | FAILS |
| matrix | SD | c2-digest-back-on | FAILS |
| matrix | SD | c2-digest-off-queries | FAILS |
| matrix | RB | c1-fight-left-condition-grows | FAILS |
| fuzz | SB | c1-damaged-spans-append, c1-rewind-after-middle-delete, c1-swipe-delete-save-verify, c2-continue-split-block, c3-equipon-carry, c3-features-def-changed, c4-rescue-pristine, c4-rescue-shifted, c4-save-hang, c4-slow-reread | pass (fixed) |
| fuzz | SD | c2-fetch-quest-story-items | pass (fixed) |
| fuzz | RB | c1-effect-replies-after-delete | pass (was never a finding) |

## Full write-ups by breaker
### a1 — replay, saving, storage
```
a1 — REPLAY, SAVING AND STORAGE (final break cell)
Heads: Story_block 81b5da3, rpg_battle 3510b50, Story_director f18d77c, npc_state_delta 1156fd7 (clones in /home/user/cell/a1/).
Every test below was copied into /home/user/cell/a1/Story_block/tests/v2/break/ and fails there with node --test.
Each one passes its setup asserts, so it fails on the asserted invariant.

Findings 1-3 have one root: the #115 read-back (persist.js startRechecks) only runs while the suspect chat is
still the open one and untouched. Each test is a separate trigger, so the lead can merge 1-3 into one finding or
keep them apart.

------------------------------------------------------------------------------------------------------------
id a1-1
severity medium
repo Story_block
file:line src/v2/persist.js:401 (startRechecks: `const open = now && now.chatId === run.chatId && ...`)
repro  Character chat chat-1. Ann is saved. A save of Bo gets no answer and times out after 20 s, but its
  request is still in transit. A save of Cy is answered (stamped, suspect.good set). The reader opens chat-2.
  Only then does the stale Bo request reach the server and write chat-1's file. Run the timers for 400 s,
  then load chat-1 from disk.
expected  The read-back sees that the file lost Cy and writes chat-1 again (the rescue path, or a direct
  write to the suspect's own place), so chat-1 on disk holds Ann, Bo, Cy.
actual  chat-1 on disk holds Ann, Bo. The read-backs run but skip `holds` because latest.chatId is now chat-2
  (`open` is false, so holds = true). The saved reply's state (Cy) is lost on disk without a word.
invariant 7
suggested fix  Keep the suspect's own target and place (chatId, place, carrier) in `suspect` when it is made, and
  make the read-back independent of which chat is open. confirm.holds(run.target, good) reads run.place's file.
  When the stamp there is older, push run.target as an orphan, or call rescue with the records saved under
  `good`, so the rescue path writes the newer records back onto that file. As a fallback, stop the timer only
  when the suspect chat is open AND holds; while another chat is open, keep reading run.place.
owner area SB-storage
test tests/Story_block/a1-late-save-chat-switch.test.js

------------------------------------------------------------------------------------------------------------
id a1-2
severity medium
repo Story_block
file:line src/v2/persist.js:401 (`... && (typeof check !== 'function' || !check(now))`), store.js check() → { gone }
repro  The same timeout as a1-1 (Bo times out and stays in transit, Cy is saved). The reader then reloads the same
  chat (loadChat of chat-1 read back from the file; it shows Ann, Bo, Cy). The stale Bo request lands after the
  reload. Run the timers for 400 s, then load chat-1 from disk.
expected  chat-1 on disk holds Ann, Bo, Cy (the read-back finds the older stamp and writes the file again).
actual  Ann, Bo. After the reload, latest.carrier is not in the new chat array and `unsaved` is already empty for
  that chat, so check(latest) returns { gone }. `open` is false and the read-backs never ask holds(). Cy is lost on
  disk. Any later change saves the whole chat again and repairs it, so the loss is real only if the reader closes
  or leaves before the next change.
invariant 7
suggested fix  Same as a1-1. The read-back must not be gated on check(latest), which only says whether the
  in-memory change still exists. After a reload of the same chat, compare the stamp in the file with run.good and
  write the open chat (it is the same chat, read back) when the file is older. That is a plain saveNow() with
  version bumped, as the code already does when `open` is true.
owner area SB-storage
test tests/Story_block/a1-late-save-reload.test.js

------------------------------------------------------------------------------------------------------------
id a1-3
severity medium
repo Story_block
file:line src/v2/persist.js:571-584 (createSaver.renamed moves latest, orphans and sending but not `suspect.chatId`), :401
repro  The same timeout as a1-1. The stale Bo request lands right after Cy's save is answered, before the first
  read-back (10 s). The reader then renames the chat (the server moves the file to "chat-1 renamed", the chat is
  read back, CHAT_RENAMED fires). Run the timers for 400 s, then load "chat-1 renamed" from disk.
expected  The renamed file holds Ann, Bo, Cy (a read-back of the renamed file finds the stale stamp and writes again).
actual  Ann, Bo. suspect.chatId still says chat-1 while latest.chatId is "chat-1 renamed", so `open` stays false
  and the stale copy, renamed along with the file, is never repaired. (It is not the known ghost-under-old-name of
  c4-rename-midsave: here the stale bytes are IN the renamed file.)
invariant 7
suggested fix  In renamed(from, to), also move the suspect: `if (suspect?.chatId === from) suspect.chatId = to`
  (and its place, if a1-1's fix keeps one there). Together with the a1-1/a1-2 fix, the read-back follows the file.
owner area SB-storage
test tests/Story_block/a1-late-save-rename.test.js

------------------------------------------------------------------------------------------------------------
id a1-4
severity medium
repo Story_block
file:line src/v2/runtime.js:204-215 (saveOnUnload), src/v2/persist.js:450 (exclusive waits for `running`)
repro  The page has a window (EventTarget) and saves through /api/chats/save. Ann is saved. A save of Bo is sent and
  the server has not answered yet (any slow upload; here it never answers). A command adds Cy, which waits behind
  that save. The page is closed: dispatch 'beforeunload' (cancelable) and run microtasks only.
expected  Either a keepalive save holding Cy goes out before the page is gone, or the browser asks first
  (event.defaultPrevented).
actual  Nothing is sent (0 requests) and the reader is not asked. saveSoon({keepalive}) is stuck in exclusive()
  behind the running save, and failing() is false, so preventDefault is never called. Cy is lost. The same
  window exists for every ordinary save in flight (they go out without keepalive), and the browser cancels it on
  unload. Related: chat-file.js post drops keepalive silently for any body over 60 KiB, which means any real chat
  of some length, and the reader is not asked then either. Also, only 'beforeunload' is listened to:
  pagehide/visibilitychange (the events mobile browsers fire reliably) are not.
invariant 7
suggested fix  In saveOnUnload: when store.dirty() and (a save is running, or the body would exceed
  KEEPALIVE_MAX), call event.preventDefault() / returnValue = true so the browser asks. Add a saver path that does
  not queue behind `running` for the unload write (send the current chat at once with keepalive; the later stale
  answer is harmless because it is the newest bytes). Also listen to 'pagehide' and
  'visibilitychange' (hidden) for the same keepalive save.
owner area SB-storage
test tests/Story_block/a1-unload-behind-hung-save.test.js

------------------------------------------------------------------------------------------------------------
id a1-5
severity low
repo Story_block
file:line src/v2/persist.js:473 (rescueOrphans: `answered(() => rescue(orphan.target))`, no onTimeout and no stamp)
repro  chat-1. A save of Ann is refused once (500). The reader opens chat-2 before the retry, so Ann becomes an
  orphan. The first rescue reads chat-1's file and writes it, and that write hangs: it times out after 20 s but
  stays in transit. A later rescue writes Ann fine. The reader opens chat-1 again (it shows Ann) and adds Cy,
  which is saved. Only then does the stale rescue write reach the server. Run the timers for 400 s, then load
  chat-1 from disk.
expected  chat-1 on disk holds Ann, Cy.
actual  Ann only: the late rescue write replaced the newer save. #115's stamp and read-back guard covers only the
  open chat's own saves (markSuspect is passed only at :524), so a timed-out rescue write is never watched.
invariant 7
suggested fix  Give the rescue write the same guard: answered(() => rescue(target), () => markSuspect(target.chatId))
  and stamp the rescued file's chat_metadata[SAVE_SEQ_KEY] (runtime.js rescue writes header.chat_metadata, so add
  a rising stamp there and keep it as suspect.good once a later rescue or save of that chat is answered). The
  read-back then repairs the file like the open-chat case (with the a1-1 fix, also when that chat is not open).
owner area SB-storage
test tests/Story_block/a1-late-rescue-write.test.js

------------------------------------------------------------------------------------------------------------
Not filed (by design, for the lead): a late timed-out request that reaches the server more than ~310 s after the
newer save (after all five read-backs, RECHECK_MS 10+20+40+80+160 s) still overwrites it. With F1's own setup and
the stale request released after 330 s, the file loses Cy. That window is #115's bounded design. Browsers rarely
hold a cancelled upload that long, so this is only a note.

HELD UP
* Replay fuzz, all four modules plus the Ersveil pack (suite.js harness; gen.mjs b6 replies plus beta lines: ! repair,
  ! refine, + recipe, ! use, ! market, ~ npc meters, + milestone, ~ item wear/equip, story coin budget, ! time
  +14h/1d; UI commands: item.equip/unequip, trade.repair/refine/sell, item.use, inventory.drop/lootTake,
  quest.take/finish/abandon, party.rest, npc.adjust, scene.present, chronicle.digest, wallet.*). Actions mixed per
  step: send, swipe new, swipe back (swipeTo), regenerate, Continue (closing a split <Changes> block, or adding
  a new or unclosed one), middle delete, last delete, edit, Re-read, sdk.rewind of a random carrier/receipt rev,
  reload (flush plus loadChat of a copy), feature toggles (all 30+ feature ids off/on), UI commands.
  Checks: A) a cold store (host validators plus scratch) over a copy of the chat == the live head (after every
  non-send step and every 3rd send); B) a cold replay with every checkpoint after the greeting stripped == live
  (every 2nd step and after every delete/rewind/reread/feature/edit); C) head after a reload == head before;
  D) swipe back to a swipe seen as head == its snapshot; E) every 60 steps, store.at(i) == a cold store over
  chat[0..i] (8 sampled carriers); F) nothing throws.
  Real constants: 58 runs x 300 steps (56 seeds, 7,996 replies, 1-4 checkpoints per chat from the 100-record /
  128 KB rules). Stress copy of Story_block (/home/user/cell/a1/cp, CHECKPOINT_EVERY 7, RECEIPT_KEEP 15, so many
  checkpoints and many old receipts without data): 55 runs x 300 steps (50 seeds, 7,653 replies, 349 checkpoints
  left in the final chats). In all: 113 runs x 300 steps, 0 divergences on A-E, 0 throws.
  The last 41 runs (fz-a2, fz-cp2) also forced swipe back to a snapshotted swipe (about 10-15 per run, D checked)
  and the Continue split block (an unclosed <Changes> reply, then a Continue that closes it; about 13 per run).
  The earlier 72 runs reached swipe back rarely.
  (Scripts: scripts/fuzz.mjs; results: scripts/fz-a.jsonl, fz-b.jsonl, fz-a2.jsonl, fz-cp.jsonl, fz-cp2.jsonl.
  Run: node scripts/fuzz.mjs <from> <to> 300 <out.jsonl>, with SB_ROOT=<Story_block copy> for the stress run.)
* Late save in a group chat (/api/chats/group/save and get): F1-1 holds.
* Two timed-out saves (Bo and its retry both in transit), newer save, both landing late in reverse order: holds.
* Save, rename and timeout combined (rename during a hung save, then timeout; timeout, then rename; late landing
  before the rename with no newer save): the renamed file holds the change. Only the known ghost copy under the
  old name remains (c4-rename-midsave todo).
* Rescue into a chat renamed after the reader left it (CHAT_RENAMED for the orphan's chat): written to the renamed
  file, no ghost. Reopened afterwards, it shows the change.
* Rescue when the target chat file was deleted (character and group): no throw, given up after 3 tries and told
  ("its chat file is no longer on the server").
* Save verification after swipe deletes: delete the active last swipe, the earliest, the middle one, swipe back
  then delete the active one, swipe back then delete another; delete the last message; delete the last two
  messages. Each followed by a command plus flush: no false verify failure, not dirty, cold == live, disk == live.
  Also deleting swipes 0/1/2 while a save is in flight (with and without SillyTavern saving after the delete):
  flush ok, disk == live.
  (Probe scripts: scripts/swipedel.mjs, swipedel2.mjs, rescue.mjs, rename-timeout.mjs.)

```
### a2 — economy and combat
```
Breaker a2 — final break cell — ECONOMY AND COMBAT AT THE EDGES
Heads: Story_block 81b5da3, rpg_battle 3510b50, Story_director f18d77c, npc_state_delta 1156fd7 (clones in /home/user/cell/a2/).
Note: in my rpg_battle clone I re-synced the vendored Story Block testkit to SB 81b5da3 (npm run sync-testkit;
the committed vendor copy is older). The rpg_battle tests below fail on either copy (they only use rpgHost/market).

============================================================================================
id: a2-3
severity: high
repo: Story_block
file:line: src/v2/turn.js:615 (reread) with src/v2/domains/inventory.js:1233-1270 (tallyOf / keepTally / storyCoin)
title: A Re-read of a reply after a story-vouched click pays the reply's coin budget twice
repro (all four modules, Ersveil pack, as found):
  1. reply A: `+ quest Torch Run — the watch needs a torch | goal: bring 1 Torch | reward: 400 marks | giver: Fenna`
  2. clicks on A: quest.take, trade.buy a Torch (Watch Stores), quest.finish → "400 marks paid" (budget 400, left 0)
  3. edit reply A to add `+ coin 400`, press Re-read (sdk.reread(index))
  → wallet +800 from reply A (42 → 842); inventory.storyBudget says paid 400 / vouched 400; a cold rebuild agrees (842).
  Minimal (Story Block alone, test file): storyCoinPerReply 400; an earlier reply `+ coin 10` (so the wallet exists);
  reply A; a module click `wallet.receive { amount: 400, story: true }` (paid 400); edit A to add `+ coin 400`; Re-read → 810.
expected: one reply pays at most its budget (400) across its own lines and the clicks after it (SB #109, RX-E-2).
actual: the re-read capture starts the reply's tally from nothing and pays `+ coin 400` in full; the click receipt
  replayed after it re-applies its own wallet +400 and writes back the tally it stored (perReply[sid] = { coin: 400,
  vouched: 400 }), so the tally even hides the overpay. Side effect seen while minimising: when the click had created the
  wallet (no coin before), the replayed click's write is a plain set and the capture's coin is lost instead (400 total
  either way, by accident). Same mechanism should apply to the goods/worth tally (loot, `+ item`) — not separately proven.
invariant: 3 (story money beyond the per-reply budget); 1 holds only because rebuild replays the same ops.
suggested fix: a re-read must count the reply's later clicks against the re-captured tally: either re-run (not replay)
  the reply's later receipts that touched `perReply[<sid>]` after the new capture, or make the click's tally write a
  delta (counter ops on perReply.<sid>.coin / vouched) and, at re-read time, hold the capture's story coin to
  budget − what the reply's kept clicks already vouched (read from those receipts' data.amount). Also the click's wallet
  write should always be a counter op (never a whole-wallet set) so a replay over a changed base never loses coin.
owner area: SB-inv (story budget) with SB-storage (re-read replay)
test: tests/Story_block/a2-reread-after-vouched-click.test.js

============================================================================================
id: a2-1
severity: medium
repo: rpg_battle
file:line: src/v2/combat/setup.js:366 (fielded: "the last rows give way first"), also :378 (lessStunners)
title: A boss written after four followers (or in a later wave) is the foe held back; the fight has no boss
repro: market() (Wessel, fighter, lv 1, Bluewatch); reply `! encounter 4 Wolf, Rat King (boss) | tier: strong`
  (or `… | tier: deadly`, or `! encounter 4 Wolf; then: Rat King (boss) | tier: strong`); combat.start.
expected: the boss is in the fight (it is the fight's point: never below strong, boss loot, boss kill quest); a
  follower should give way instead.
actual: setup.enemies = Wolf A–D only, no boss, no waves; start receipt "A fight begins: Wessel against Wolf ×4
  (1 more hangs back)". Offer and encounter say boss. Also 9 Cellar Rat + boss (weak→strong): 4 rats, no boss. The
  story grammar's own example writes the boss last ("3 bandit, bandit captain (boss)").
invariant: RB combat rules (bosses; MAX_FIELDED); story/fight mismatch (the next reply is told a boss fight that had none)
suggested fix: in fielded(), give room to boss rows first (sort bosses ahead when trimming, then restore order), and
  never let lessStunners drop a boss; count the boss in the headcount as now. If the room is smaller than the bosses,
  refuse the offer with a plain message rather than silently dropping them.
owner area: RB-balance2
test: tests/rpg_battle/a2-boss-held-back.test.js

============================================================================================
id: a2-2
severity: medium
repo: rpg_battle
file:line: src/v2/trade/core.js:382-385 (stockDef value = itemWorth, unscaled), src/v2/items/define.js:157 (story item
  worth = itemWorth, unscaled); same for core.js worthOf/sellEach legacy path and repair/refine fees built on them
title: RPG Battle's built-in prices and story-made item worth ignore the money scale (F104)
repro: rpgHost with Story Block setting economyScale '1' vs '8' (or the Ersveil pack, scale 8): reply
  `~ place Thornwick Village | kind: settlement` + `+ item Short Sword | note: weapon, ATK +3`; trade.stock smith.
expected: PACKS.md "The money scale": built-in defaults "RPG Battle's default loot, coin and prices" are multiplied by
  the scale (Story Block's fallback budget does: 1000 → 8000; 100 at 0.1).
actual: smith gear 18 at scale 1, 8, 0.1 and 10 alike; story Short Sword worth 20 at every scale. In Ersveil a spear is
  135 marks at Gate Forge (pack) and 18 marks at any smith off the pack's map; every story-made thing is valued ~1/8 of
  the play scale, so the reply's goods budget (2 × 400 marks, by worth) admits ~8× the gear it should, and fight loot
  coin (which IS scaled, combat/setup.js scaledMoney) buys 8× as much generic gear. (No direct sell-loop profit found:
  trade.paid caps resale at what was paid.)
invariant: 3 (code's numbers on one scale; the per-reply goods budget is meant in the chat's coin)
suggested fix: read inventory.economy's scale once per world (makeWorld / defineItem already has hostEconomyScale) and
  multiply v1 itemWorth (and so stock prices, sellEach's legacy path, craftFee, repair/refine fee bases, story item
  worth from the item.define hook) by it, whole, at least 1 — never a def's own `value` or a pack line's price.
owner area: RB-gear / SB-packs2 (Ersveil value audit) — trade pricing; RB-craft for craftFee
test: tests/rpg_battle/a2-prices-ignore-money-scale.test.js

============================================================================================
id: a2-4
severity: low
repo: rpg_battle
file:line: src/v2/combat/encounter.js:101 (`const bossFight = !ranked && …`), :107 (ranked foe takes ranked.tier)
title: A boss with a written rank is labelled below strong (even at level 1, trivial at a high level)
repro: market(); reply `! encounter Rat King (boss) | rank: F` → offer foe { tier: 'even', rank: 'F', boss: true };
  after party.grantXp 50000 → { tier: 'trivial' } (offer text "Rat King (boss, rank F)").
expected: "A fight with a boss is never below strong" (wave C, user's call) — ranked or not.
actual: the ranked path skips the hold; the stored tier then drives setup's per-tier rules (MAX_STUNNERS for
  trivial/weak can hold a stunning ranked boss back; XP from its level).
invariant: RB combat rule (bosses never below strong)
suggested fix: apply atLeastStrong to a ranked boss's tier too (keep its rank level for its numbers), or if ranked
  bosses are meant to be exempt, say so in encounter.js/MODULES and keep a boss out of MAX_STUNNERS trimming.
owner area: RB-balance2 (bosses) / RB-party2 (foe rank)
test: tests/rpg_battle/a2-ranked-boss-below-strong.test.js

============================================================================================
id: a2-5
severity: low (docs)
repo: Story_block
file:line: docs/v2/PACKS.md:66 and :341
title: PACKS.md's money-scale example is inverted (scale 0.01 for "one coin is a copper")
repro: read PACKS.md: "scale says how many of its coins one of those defaults' coins is worth" (Ersveil: marks are
  small coin, 8 to a gold → scale 8), but the example is `"economy": { "scale": 0.01, "note": "One coin is a copper: a
  hundred to a gold piece." }`. A pack maker copying it gets a fallback budget of max(1, 1000 × 0.01) = 10 coppers a
  reply (should be 100 000) and scaled loot/rewards 10 000× too small.
expected: copper coin → scale 100 (or the note should say one coin is a hundred gold).
suggested fix: change both examples to `"scale": 100` (copper) or keep 0.01 with a note like "One coin is a gold
  crown worth a hundred of the defaults' coins".
owner area: SB-packs2
test: none (documentation only; behaviour matches the formula, the example contradicts it)

============================================================================================
HELD UP (what I tried, with counts)
- Refinement loop on start gear with no trade.paid cap (Ersveil Cane-Blade, worth 600): +1/+2/+3 incl. one failed +3
  (60%, fee and materials spent), sell to smith: net −392 marks over the loop; each level's fee (81/162/270) > the
  resale it adds (+26/+27/+26). Refine on a bought piece is capped by trade.paid. 1 seed × 6 refine attempts, quotes
  for 3 buyers each step. Refinement past +3 refused; one per piece per reply holds.
- Repair → resell: by code reading of resaleOf / planRepair (bound = sale at the worst it ever was + fees paid;
  REPAIR_CAP 0.9 of new price) no repair can be sold back for more than its fee; field patches never raise `low`.
- resaleOf `Math.max(1, …)`: a broken piece sells for 1 (one piece once); junk ("Botched …", value 0) and crafts from
  key items (value 0) both get trade.paid 0, so they sell for 0, not the legacy itemWorth. (Caveat for owners: a value-0
  def is priced by v1 itemWorth — a botched equipment piece at its rarity's full budget — the moment its trade.paid
  write is gone, e.g. after MAX_PAID = 500 other paid writes evict it; not proven, needs 500 distinct defs.)
- Key items (SB #111): trade.sell refused for all trader kinds; commission and crafting count them 0 (existing tests);
  merge refused; transfer/split/hand-over on leave keep `key`; looseMatch never joins a key stack; `~ item | qty:` on a
  key stack counts as goods; rename keeps the flag. No sale/craft/commission path turned a key item into coin.
- Ersveil scale 8 budgets: `+ coin 400` at F (pack rank top) caps per reply (12 replies × 400 checked); pack quest
  "Granary Rats" re-opened and closed on the story's word 5 times with SD alone: paid once (claim), then CLAIMED;
  pack reward (50) is outside the budget by design.
- Click before any reply: the greeting is not captured, a vouched click there is counted against the greeting's sid.
- Money scale minimums: scaledMoney / scaledDefault / scaledCoin floor at 1 (documented "at least 1"); at 0.1 a fight's
  loot coin rounds up to 1 — by design, not reported.
- Stun rule: 1080 auto fights (6 presets × levels 1/10/40 × 11 encounter words incl. Ogre (Stomp/Crushing Blow), boss
  rows and made-up "Storm/Thunder" creatures × tiers trivial/even/deadly × 4 seeds); no combatant lost two of its own
  turns in a row to a stun (script: scripts/stunsim.mjs).
- Boss tier hold (unranked): trivial/weak/even lines with a boss → offer and boss row read strong; a boss's own
  "(boss, even)" read strong; a boss in the first 4 rows is fielded at its tier level.
- Timed effects (code reading): combatShift sums all effects (member's and party-wide) and clamps ±15; story lines
  claim `effect:<reply>:1` (one per reply) and are held to band 1.
- Encumbrance in fight: the AGI/DEX penalty goes into combatant stats via party.combatNumbers (code reading only).
Scripts: /home/user/cell/out/a2/scripts/ (probe1–8, stunsim, logshape).

```
### a3 — live matrix
```
a3 — LIVE SILLYTAVERN, MODULES ALONE AND TOGGLED (final break cell, v2 heads)
Heads: Story_block 81b5da3, rpg_battle 3510b50, Story_director f18d77c, npc_state_delta 1156fd7 (clones in /home/user/cell/a3/).
Live: SillyTavern 1.19.0 + mock model, one instance (ST 8213, mock 5213), one persistent headless Chromium (CDP 9463),
raw-CDP driver. Scripts: /home/user/cell/out/a3/scripts/ (browser.sh, monitor.mjs = console/exception logger,
drv.mjs, walk.mjs = open every tab/screen/settings fold/card + overflow/blank/dead-control audit, scen.mjs +
scenarios.mjs = scenarios s2..s5, s1.mjs, s3b.mjs, s3c.mjs, s6.mjs, exts.mjs). Per-run logs: /home/user/cell/out/a3/run-*.log.
Instance stopped at the end.

==================================================================================================
id: a3-1
severity: high
repo: Story_block (shows in every module's templates; worst in rpg_battle)
file:line: Story_block/src/v2/view/template/sanitize.js:159 (PURIFY_CONFIG.ALLOWED_URI_REGEXP), used by
  src/v2/ui-host.js:176 (sanitize: SillyTavern.libs.DOMPurify.sanitize) -> view/template/index.js:52
title: Live, SillyTavern's DOMPurify strips type="checkbox"/"radio" (and maxlength, rows, min, max, step...) from
  every template: the character wizard's race and talent pickers are dead text boxes; without a pack no
  character can be made, so RPG Battle holds the story forever.
repro (live): bash harness/instance.sh a3 8213 5213 Story_block=<clone> rpg_battle=<clone>; no pack installed.
  New chat with any character -> Game view -> Before you start -> Get started -> Next (Race step).
  The six race "cards" each show an empty white text box (shots/s3-race-1440.jpg, s3-race-390.jpg); clicking a
  card selects nothing; Talents step the same (shots/s3-talents-390.jpg); You -> Create says "Choose a race."
  and the send stays held ("RPG Battle: Create your character first."; shots/s3-1440-stuck-1.jpg). In the page:
    DOMPurify.sanitize('<input type="radio" data-draft="race">', PURIFY_CONFIG) -> '<input data-draft="race">'
    document.querySelector('.ss-dialog .cc-race input').type === 'text'
  Also hit live: SB Inventory loot picks + "Equipped only" (screens/inventory.js:111,119), SB changes-card loot
  picks (changes-card.js:53), SD chronicle editors' maxlength/rows (chronicle/screen.js:36-84), RB trade
  maxlength. (Whether a given screen is affected can depend on whether SillyTavern.libs was ready when
  ui-host built the renderer; on a fresh reload it is, every time.) With the Ersveil pack the preset fills the
  race, which is why st-beta passes. Workaround used by my driver: creation.finish by command.
expected: checkboxes/radios stay checkboxes/radios; a character can be made from the wizard with no pack.
actual: DOMPurify 3.x checks the VALUE of every allowed attribute that is not in its URI-safe list (alt class
  for id label name pattern placeholder role summary title value style xmlns; data-*/aria-* exempt) against
  ALLOWED_URI_REGEXP; /^(?:https:|data:image\/|#)/i rejects "radio", "checkbox", "80", "2" -> attribute dropped.
invariant: 4 (stuck generation: the story cannot start; dead controls). Also a blank/dead-controls UI bug.
suggested fix: don't hand DOMPurify a narrow ALLOWED_URI_REGEXP. Either drop ALLOWED_URI_REGEXP from
  PURIFY_CONFIG (the strict allow-list in sanitize.js already re-checks every URL attribute via urlAllowed /
  isUrlAttr), or add ADD_URI_SAFE_ATTR: ['type','maxlength','minlength','rows','cols','min','max','step','size',
  'checked','disabled','readonly','required','colspan','rowspan','width','height','datetime','open','tabindex',
  'autocomplete','inputmode', ...every non-URL attribute sanitize.js allows]. Add a test that runs the real
  rule (the one in the test below) over each module's shipped templates.
owner: SB-view (template renderer / sanitizer); RB-screens2 to re-check the wizard after.
test: tests/Story_block/a3-purify-drops-input-type.test.js (emulates DOMPurify 3.4.2's _isValidAttribute value
  rule, purify.es.mjs:1089-1118 in ST's node_modules; fails now: 'type="checkbox" is dropped').

==================================================================================================
id: a3-2
severity: low
repo: Story_director
file:line: Story_director/src/v2/atlas/widget.js:210 (button) and :605-607 (toMe: `if (data.current) goTo(...)`)
title: Map "Centre on where you are" is enabled but does nothing while no place is known (dead control).
repro (live): SB + SD only, new chat, Story panel -> Map (or Game view -> Map) -> click the crosshair button
  (aria-label "Centre on where you are"): no DOM change at all (walk.mjs click audit, both 390 and 1440,
  run-s2-*.log "dead=[Centre on where you are]"). Same on any chat before the first `~ place`.
expected: disabled/hidden (with a reason) until there is a current place.
actual: enabled, click is a no-op.
invariant: none of 1-8 (UI: no dead controls).
suggested fix: in the render/update path set centreMe.disabled = !data.current (and a title "No place yet"),
  refreshed when the view's `current` changes.
owner: SD (atlas/map screen) — by name: b6-fix / SD owner of the Map (see owners table; nearest: SD-digest)
test: tests/Story_director/a3-map-centre-me-dead.test.js

==================================================================================================
id: a3-3
severity: low
repo: Story_director
file:line: Story_director/src/v2/chronicle/index.js:36 (feature 'story-director.digest' describe)
title: Non-RPG chat (SB + SD only): the Features list still says the day digest writes "fights".
repro (live): SB + SD only, the Mira dating-sim scenario (scripts/scenarios.mjs s2): Suite -> Features ->
  Story Director -> Day digest: "When a story day ends, code writes what it held (places, quests, fights, money,
  NPC stages, world news)...". Everything else held: no fight/combat/HP/XP/encounter/foe word in any of the
  9+9 main prompts (static + tail), panel tabs, game screens, reply cards or quest progress (a "Beat Mira 3
  times at pinball" goal shows "Not yet: the story has not said its goal is met yet.", no "beaten"/"fights").
  Lesser, same settings page, from Story Block (generic, not module-aware): money help "...or 1000 per character
  level..." (Story_block/src/v2/domains/index.js:75) and the greyed pre-roll reason "...like RPG Battle".
expected: with no fight runner the description doesn't mention fights (as GRAMMAR_ALONE does for beats).
actual: static text with "fights".
invariant: WAVE rule 11 (SD alone asks for/tells no fights) — UI wording only, not the prompt.
suggested fix: make `describe` a function of env.fights (module.js already passes { fights } to parts), or word
  it neutrally ("places, quests, money, NPC stages, world news, and fights when a module runs them").
owner: SD-digest
test: tests/Story_director/a3-alone-digest-says-fights.test.js

==================================================================================================
id: a3-4
severity: low
repo: npc_state_delta
file:line: npc_state_delta/index.js:4047 (console.error 'dossier scan failed') and the per-chat data file read
  (index.js:2234 / storage.js:346 path /user/files/npc-state-delta-<key>.json)
title: SB + NSD: console errors on every new chat (404 for the chat's npc-state-delta-*.json) and a
  console.error with stack for every reply whose dossier side call comes back empty.
repro (live): node scripts/scen.mjs s4 1440 (exts Story_block + npc_state_delta, mock answers side calls with
  ''). errors.log / run-s4-1440.log: "Failed to load resource: 404 .../user/files/npc-state-delta-1b49zbivwgpb4.json"
  x2 on opening a new chat; "[NPC State Delta] dossier scan failed Error: No message generated at generateRaw ...
  scanNow ... handleAssistantMessageReceived" once per reply (8 in 5 replies + swipe + reload). Nothing thrown to
  the page, generation never stalls, but the console is red in a plain chat. Side effect seen: with no dossier
  the Cast tab says "No NPC has a dossier in this chat yet" although `~ npc Odda | trust: +10` lines set meters
  (npc.cast lists Odda/Brecht with present:false even though scene.present has them; shots/s4-cast.jpg) —
  the meters set by change lines are invisible until a scan succeeds.
expected: a missing per-chat file is "no data yet" without a failed request (check existence first or treat 404
  quietly); an empty side-call answer is a quiet warning/problem line, not console.error with a stack.
invariant: 4 (console errors), UX.
suggested fix: probe the file list (or catch and not log) before fetching the per-chat file; downgrade the
  empty-answer case in scanNow to console.warn once per chat and surface it in diagnostics. Consider using
  Story Block's scene.present for the Cast tab's "present" when no dossier exists.
owner: NSD-prompts
test: live only (network 404 + generateRaw) — repro above; not reproducible in the testkit.

==================================================================================================
HELD UP (all at 390x844 mobile-emulated AND 1440x900; console/pageerror monitor attached the whole time)
- s1 Story Block alone: 5 replies with change blocks (place/present/item/coin/loot/hostile `<b>`/onerror item
  name, unknown "- item Lantern"), swipe + swipe back (state equal), delete last 2, reload: live == rebuild;
  every tab/screen/settings fold/card opened and every non-destructive button clicked (11 settings, inventory
  Take selected etc.): no exceptions, no console errors, no horizontal scroll, no blank pane, no dead control;
  marker flag stayed unset, markup shown as text.
- s2 SB + SD dating sim (Mira, no fights/stats): 7 replies (+ later 1 more), quests with "Take Mira to 2
  films"/"Beat Mira 3 times at pinball"/"Collect 50 tickets", hook, agenda, beat, clock, time lines, swipe,
  delete last + delete a middle reply, reload (live == rebuild), one reply after reload: no stall (each reply
  ~2.5 s), no console errors; prompt scan of all main requests for fight|combat|HP|XP|battle|encounter|foe|
  enemy|damage|attack|level|beaten|wound: zero hits from the suite (only my own card text); UI scan: only a3-3.
- s3 SB + RB: wizard path holds the send (0 requests while held, notice + dialog), fight started from the Fight
  tab's button and auto-resolved, check/use/time lines, swipe/back, delete last + middle (deleting the reply
  whose encounter was fought), reload: live == rebuild; fight board mid-fight at 390 (panel and game view):
  no overflow, every board button live (Attack, foe cards, Skill, Parley, Auto, Close).
- s4 SB + NSD: npc meters (+N/-N, +9999 clamped with "held at" receipts, "banana" -> Problem), markup NPC name
  stored and shown as text, milestone, swipe/delete/reload live == rebuild; UI clean apart from a3-4.
- s5 all four with every feature off (16 features off; Crafting/Days/Inspector tabs gone) and all on (Inspector
  on, pre-roll + extractor side calls returning empty -> quiet warnings): 5 replies + fight + swipe + delete
  middle + reload + 1 more each; live == rebuild both; no exceptions; no overflow at 390; no dead controls.
- s6 RB Import character with bad files through the real file input (CDP setFileInputFiles), 390 + 1440:
  empty, non-JSON, 5 MB, wrong schema, version "<b>9</b><img onerror>", [1,2,3], null, a PNG with no card data:
  each refused with a one-line note, dialog stays usable, input re-enabled, no character made, 0 console errors.
  A valid file with `<b>`/onerror markers in name, role, background, skill, custom skill, item names, currency:
  imported; name replaced by the persona's; every screen (Home, Party, Inventory, Inspector, cards, HUD) shows
  the markers as text; no live <b>/<img src=x>; window.__xss stayed unset.
Counts: 9 scenario runs x 2 widths, ~60 replies, 10 swipes, 20 deletes, 12 reloads, ~400 button clicks,
  18 bad-file imports.

```
