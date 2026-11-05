# To-do list (updated 5 Nov evening, end of the daytime run) — read LOCAL-START.md; agents: scratch/briefs/COMMON.md on the PC

State: DEVELOPMENT FROZEN (USER 4 Nov): stability, speed and cleanup only, plus USER-approved exceptions. No version bumps for today's work (all under CHANGELOG "Unreleased").
Mains: Story Block 25505a6 (+ #299 cast start 0, #300 cast wears) (2.22.5 + Unreleased: splits, v1 removed, floating panel, no-rolls note, freeze fix, fewer saves, restore A, keep lines, present after place);
Story Director e3c1980 (2.10.2 + Unreleased: quest matching, cast fixes, sought arrivals, undated offers lapse, v1 removed); NPC State Delta 597db55 (+ #260 cast wears) (1.10.2 + Unreleased: index.js split, settings debounce, restore A);
Studio b264d44 (0.9.0 + #33 Usually wears box); vendored SB 83579215 everywhere (one merge behind: #298, a capture-order fix with no API change).
Open, in order:
1. USER: decide when to release (version bumps) the Unreleased work in all three repos.
2. Follow-ups needing the USER's go-ahead (details below, "Follow-ups 5 Nov"): incremental replay memo (14, the real freeze cure) + low-load measurement; restore group B (12; mockup for the button); remakeAsEquipment refusal test + state-fuzz instrumentation (9); chat file rewritten ~3× per reply (1); 4 model calls per reply (2); second-tier splits (7).
3. Small follow-ups from today's reviews: undated offers count only `~` touches and the reader's first mention, not prose mentions by the story (v2 has no markSeen); a hook with a giver/reward counts as an offer (old meaning) so undated ones lapse too; on a Re-read of an old-order reply present lines get new seeds (unused); NSD prepare's vault work after the load wait is outside the 8 s bound.
4. USER: portrait negative prompt keeps an old template — check SillyTavern Image Generation's Common and Character-specific negative prompts (appended to NSD's); if not, which screen/preset/text. Re-sync vendored SB to 25505a65 in SD and NSD (tests only).
5. USER: NSD scanner profile 502 (backend/profile, not code) if still seen.
Review depth (USER 4 Nov): full depth + re-reviews for saves, replay, scanning, fights, XP/practice; display-only work one review + a scoped check; 5 Nov: slimmer proofs (no duplicate pre/post runs).
Idea (USER 4 Nov, next time): a "Help corner" tab in the suite that shows docs/FAQ.md in-app. Keep FAQ.md growing meanwhile.

## Follow-ups 5 Nov (numbers referenced above; 3, 4, 10, 11, 13, 15 done or covered today: restore group A #291/#259, saves #294/#257, cleanup + branch chats deleted through SillyTavern)

USER-approved to investigate after the freeze fix (5 Nov: "yes, add them to the list"):
1. Chat file rewritten whole ~3× per reply (`POST /api/chats/save`, ~0.94–0.99 MB at 26–29 messages; Story Block's own chat-file.js / ST saves).
   Not the freeze (async) but wasted work that grows with the chat. Evidence: scratch/logs/FREEZE-PROFILE-REPORT.md "Network".
2. Each reply makes 4 `chat-completions/generate` calls, not 1: ~4 KB request before the reply (likely the RPG roll planner), the reply, and two
   ~8–10 KB requests just after it (likely Story Director's cast planner on "Same as chat", plus one more — trace which extension).

Found today, open:
3. Branches cut before the last NSD-bearing message stay `timeline.status() === 'pending'` (RESTORE_PENDING) forever; sends there are silently
   aborted after ~40 s. Seen on the USER's troubleshooting copy (NSD checkpoint file `npc-state-delta-checkpoint-nk_*.json` missing → 404) and on
   some main-chat cuts. At minimum: no silent loss — a time-out with a clear message. Ask the USER whether it happens in their own ST.
4. NPC State Delta participant callback times out after 10 000 ms for the timeline snapshot (`make` → SNAPSHOT_UNAVAILABLE), seen in C3 and C4
   real-ST runs on main and clone, with st.lock held.
5. Story Block `tests/v2/qa/state-fuzz.test.js` seed 36: one failure in one full run under load (live state vs rebuild: an inventory item's owner
   'party' vs 'story/iron-key'); not reproduced 5×; also possible on main. A live-vs-rebuild difference is never "just flaky": find the cause.
6. Sought arrivals: gate/planner cost — measure how often the extra cast-planner call is made in real play after round 2.
7. Second tier of the cleanup plan, not scheduled: Story Block `data-modules/part.js` (1,287), `ui-host.js` (1,071); NPC State Delta `branch.js`
   (1,621, plan says do not touch), `dossier-ui.js`, `social.js`.
8. Old debug script `inventory-block/harness/smoke/st-dice-dbg.mjs` imports the removed Story Block `src/handshake.js`.

Added after the diagnoses (5 Nov afternoon):
9. state-fuzz seed 36 (DIAG-STATEFUZZ-REPORT.md): not reproduced in ~330 loaded runs; suspect — a REFUSED `remakeAsEquipment`
   (inventory edit path, ex inventory.js:431) mutates `inv.defs[...]` / `def` in place before ctx.fail. Add a deterministic test (refusal leaves
   state deep-equal, head == at(n) == rebuild); fix if it fails. Keep the test-only dump instrumentation
   (scratch/logs/DIAG-STATEFUZZ-instrumentation.diff) so a recurrence explains itself.
10. Restore/branch fixes (DIAG-RESTORE-REPORT.md): group A (bug fixes, no UI): transient participant failures retried on a timer then a
    Problem; timeline.status()/head() give the reason; NSD prepare waits for load; participant timeout vs NSD's 20 s idle wait aligned (STALE,
    "retry shortly"); NSD generationReady no double 20 s wait; no auto-scan on a swipe-back without new text. Group B (bigger, mockup for the
    button): nearest verifiable earlier checkpoint when one is missing; "Start this branch's dossiers from the chat"; checkpoint file clean-up
    (~0.6 MB per native change, never deleted). Awaiting USER decision.
11. Per-reply waste (DIAG-CALLS-REPORT.md): USER settings — NSD narration capture catch-up 1 → 8; helper profile preset without high
    reasoning; ST Vector Storage (~4.5 s before the first token). Third party: Megumin-Suite-Beta saves the chat twice per reply; its
    settings 907 KB. Code (queued): SB-SAVE-MERGE (running), NSD-SETTINGS-DEBOUNCE (after N7).
12. USER decision 5 Nov: KEEP exact restore of NPC State Delta dossiers at a branch point (option 1; checkpoints stay). Group A now
    (SB-RESTORE-A running, NSD-RESTORE-A after N7); group B after the cleanup: nearest verifiable earlier checkpoint as a fallback, a confirmed
    "Start this branch's dossiers from the chat" way out (mockup first), checkpoint file clean-up (~0.6 MB per native change, never deleted).
13. Cleanup at the end: agents' branch chats on both test servers, MemoryBooks lorebooks created for branch chats ("Astra_Memories Branch NNN"
    in worlds/), ST backups of branch chats; stop test server B (PID in scratch/logs/st2-server.pid) and remove /tmp/st2.
14. Freeze, the real cure (SB-FREEZE-FIX-REPORT.md "Step 2 finding"): the 2.22.3 prefix-witness memo is one generation for the whole chat and any
    write (epoch++, a new message, archive growth) drops every answer, so after each reply every module's timeline read replays from its
    checkpoint. Make it incremental: key each answer by its prefix 0..index (chainHash) + the env parts that can change it; prove replay == live.
    Also: measure a reply's longest task under LOW load (the freeze fix's reply number was taken with the machine at load 9–48).
15. Replica hygiene: agents deleted branch chats with rm, leaving NSD `dataFiles` pointers in settings.json; a reused branch number then hydrates
    a stale/missing sidecar. End-of-day cleanup must delete branch chats through SillyTavern's own delete (so NSD's lifecycle clears pointers),
    or restore server A's settings.json pointers for deleted chats. (Normal play deletes through ST: not affected.)

## DONE — Story Block as a platform (API + {{sb::}} macro in 2.20.0, card offer in 2.21.0); kept for reference
Contract: suite-notes/cleanup-briefs/SDK-CONTRACT.md (awaiting USER answers to its 3 open questions).
1. Public API `StoryBlock.api` v1 (read-only `get(path)`, `paths()`, events `story:changed` / `story:reply` /
   `story:rebuilt` / `story:chat`; hidden values never returned; frozen with version rules) — ~2–3 h.
2. `{{sb::path}}` / `{{sb::path|fallback}}` SillyTavern macro for prompts, regex scripts and status bars — ~1–2 h.
3. (Separate contract) blocks from the card — USER approved option A (4 Nov); mockup CARD-UI in progress, then build. Found: cards can already carry a pack (`[storysuite:pack]` lorebook entry + "Import from lorebook"); recommend a one-click offer on chat open (mockup first) + docs + Studio export, ~2–3 h.
4. Tutorial docs/v2/BUILD-A-CARD.md + one example card — ~2–3 h.
Plus reviews, real-ST checks, release ~2–3 h. Order: 1+2 in parallel, then 4, then 3 as its own release.

## Released 31 Oct
| Work | PR | Reviews |
|---|---|---|
| RPG (Story Block 2.8.0) | kohz87/Story_block#225 → f182f2c | 155, 157, 158, 160, 163, 164, 166 → final 167 HOLDS |
| AI writing help (Studio 0.4.0) | kohz87/Story_studio#19 → 061ca41 | 159, 161, 162, 165 → final 168 HOLDS |
| Timeline (SD 2.3.0, Studio 0.3.0) | Story_director#144, Story_studio#18 | 154, 156 |

Approved mockups: RPG https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R (v8); Studio Timeline
https://claude.ai/artifact/AJZkpqZigE5TvZRRh4jrMK (v3); AI writing help https://claude.ai/artifact/EanYreZdULFAjKTf2reV2K.

## Waiting on the USER
2. **UI redesign (P6)**: CLOSED 1 Nov. The current shipped UI is the baseline; any UI change is incremental, with a mockup first.

## Next, in order
| # | Work | Who | Size | Needs |
|---|---|---|---|---|
| ~~K~~ | RELEASED 31 Oct: Story Block 2.8.1 / Ersveil 2.2.0 (#226): hidden history CY 611+, Court favour, Sealwarden recruit, 56 notable people | — | — | — |
| ~~N~~ | RELEASED 31 Oct: Story Block 2.9.0 (#227): RPG new chat / held first send / companions who join, Blocks in Suite settings (+ Hidden), Money cap removed, slider hardening | — | — | — |
| ~~2.9.1~~ | RELEASED 31 Oct: Story Block 2.9.1 (#228, f81e052): Create sets up Combat rules/Foes, +3 points per Soul Class, defence skills, "full above 10", Soul Class field name | — | — | — |
| ~~2.9.2~~ | RELEASED 31 Oct: Story Block 2.9.2 (#229, 224f7c9): wizard Stats step keeps "Points left" out after a click | — | — | — |
| ~~2.9.3~~ | RELEASED 31 Oct: Story Block 2.9.3 (#230, 0a0254d): wizard summary row spacing | — | — | — |
| ~~G~~ | SHELVED 31 Oct (USER): gear as stat bonuses; mockup v11 section 10 kept on file | — | — | — |
| ~~2.9.4~~ | RELEASED 31 Oct: Story Block 2.9.4 (#231, bddaedb): present-rename clause in the narrator grammar | — | — | — |
| ~~T~~ | RELEASED 31 Oct: SB 2.10.0 (#232) + SD 2.4.0 (#146): Text size, Your look, Rank from the pack | — | — | — |
| ~~V~~ | RELEASED 31 Oct: SB 2.11.0 (#233) Mounts + header Travel; SD 2.5.0 (#147) Trips + map | — | — | — |
| ~~S2~~ | DONE 31 Oct: vendored Story Block 2.11.0 in SD#148, Studio#21, NSD#226 | — | — | — |
| ~~S~~ | DONE 31 Oct: vendored Story Block 2.8.0 in SD (#145), Studio (#20), NSD (#225) | — | — | — |
| P4 | P4 trim: lazy-load the pack checker, Diagnostics, UI sample | Haiku or Sonnet | ~½–1 day | Any time |
| L | UI redesign — CLOSED 1 Nov: all proposals (v1–v5) rejected and deleted; current UI stays the baseline | lead | — | done |
| L2 | Cleanup on today's UI — RELEASED 1 Nov: SB 2.12.0 (#237), SD 2.6.0 (#150), NSD 1.4.0 (#227) | lead | — | done |

## Small follow-ups (any time)
- 2.9.0 (review 171): refuse `- party` on the player's own character; a character made on the greeting is lost if the greeting is swiped (pre-existing); Home card lingers after turning the RPG off until Home redraws; old capped reply Re-read now pays in full (CHANGELOG could say).
- 2.9.1 (review 172): Re-read of an old `- party X` after a persona rename refuses the leave; "+1 points" singular
  when the clamp limits it; the first-character `dm.join` docs paragraph describes an unreachable path; a Create
  on the greeting is lost if the greeting is swiped (add a one-line note in the dialog).
- 2.9.1 (R8, review 173): "full above 10" goes negative under stat 5 ("+-4"); Settings hint "rounded down" under
  it; foes' class words follow the party's soul field; `+ party` grammar says I–IX; statDivisor 0 encoding; unused
  soulOne string; wizard/join characters carry the stock "Soul Class" label.
- Money: a coin list of a single coin worth 1 ("crown: 1") gets coinLine without "no other coins exist"; treat it as
  a single-unit currency in moneyLine. (An always-on lore currency entry still wins; say so in the Money help.)
- Status Coordinates: a place not on the map (a guild office) shows none; fall back to its town's or region's
  position (Story Director director.status).
- Trips/mounts (review 175): overlapping `~ trip delay` holds double-count the marker; no rest days; `~ trip` before
  `~ place`/`+ mount` in one reply; arrived cue at the start place. Your look (174): a rank line with no pack drops its
  wearing/condition. SD delete-fuzz seed 19 fails on baseline ("Fenna is listed as present twice").
- Replay (review 177): timeline-release-fuzz seeds 13/20 fail on main (cause unknown); a middle delete can bring back
  a name a later whole-list present replace wrote; old checkpoint after a skipped block keeps the stale outcome.
- (done 2.11.3) Pack checker parses event `when`. Follow-ups: Packs panel shows all event errors of a stored pack;
  kit note on `when` syntax; sync Studio's vendored Story Block to 2.11.3.
- Ersveil: split news events can repeat the same bulletin when the player moves between region groups; Ardelia deadlocks (outline said elects).
- RPG: a reply where the story changes nothing doesn't settle the death check (it waits for the next reply with lines).
- RPG: an optional real-host integration test for review 166 (rollPrepared wiring + narrator request).
- RPG: class-up note weight; names no cut can separate; the rank-0 death card distinguishes only the character role;
  a remove-then-define pin leak.
- Studio AI help: a hand-made parent name with a carriage return plus an invalid delay unit shows "Just the 2 days is
  fine" although the delay is dropped (a second warning still blocks Keep). Factions are read up to the first five.
- Timeline: an "Any time" lasting event never fires in a story with no date (add a help line); sync `chronicle-lasting`
  at export too; drop the stale `time() != null` guard when the last delayed child goes.
- Block chooser says "1 buttons" (pre-existing in 2.7.2).
- Studio: event names are shown from their ids, so capitals are lost; consider an optional display name.
- Block prompts are stored on one line, so the RPG combat text loses its line breaks.
- Story Block keeps a pack enabled when a module capability it needs goes missing after install; consider skipping such
  events with one Problems line.
- A merge-on-rename can drop "from the story" after an earlier reply is re-read (pre-existing; 151 note).
- Story Director clock editing: building (stage36/clock-set + SB stage36/hero-edit). Follow-up: Status card Time row padded "06:40 am".
- `b1r2-capture.test.js` 10 s backstop trips under heavy load (passes alone); watch it in CI.

## Rules to keep in mind
- **Reviews:** Claude reviewer agents (USER, 31 Oct: no Codex quota). **Blocker bar
  (USER, 31 Oct):** only ordinary-use data loss/corruption, crash/wedge, wrong rules, or a hidden-value leak in normal
  play; everything else is a follow-up.
- **Tests (USER, 31 Oct):** write a test per fix and run it after the fix only; no failing-before runs.
- **Merges:** merge commits only, after green CI; agents never merge.
- **UI:** a mockup is approved before any UI is built.
- **RB = rpg_battle (USER, 31 Oct):** stop updating the rpg_battle extension (kohz87/rpg_battle). No work, syncs, reviews or pushes touch it.

- U1 bugs (1 Nov): Director card grid overlap; phone NSD dossier modal too narrow; status strip on but empty; hero vitals hidden with RPG on; RPG-off leftover block tabs with duplicate names.
- Follow-ups from the UI cleanup (1 Nov): SB still names SD ids in DEFAULT_HIDDEN/SUITE_NAV/icons/strings (ownership pass);
  NSD 5 cancelled tests in storysuite-participant-selection (check on Node 24); phone dossier header translucent; Lean
  tile text names SD's "world-building threads"; "Start" block in the first message (USER asked; offer mockup).
- Encounters (USER idea, 1 Nov): pack cast list + backdrop (roles/names/traits/meter preset/rarity per place), code-rolled
  encounter table (swipe rerolls, Re-read keeps), AI fleshes out, promotion to NSD dossier. Mockup after the formula release.
- Key people (USER, 1 Nov; SD owns, cap 10 by default (adjustable) + token budget the reader sets, no upper cap (default ~300), auto-removed when archived or dead; NSD pulls + evolves dossier when both; NSD alone none): pin a person as key → its off-screen agenda survives Lean (threads off); World → People shows
  "Away: <name> — <doing>, back <date>"; RPG sheet waits (Left); optional small XP catch-up on return. Mockup after formula release.
- Order (USER, 1 Nov): 1 formula release (2.14.0) → 2 Key people → 3 Encounters (cast + backdrop format) → 4 write the
  Ersveil heroines and heroes (8–12 core, up to 16) into the pack.
- Follow-up (backlog release): NSD `.delta-panel` translucent (66% alpha, no blur) → Game view shows through on phone. Make opaque.

- 1 Nov: Standard formula released (SB 2.14.0, 0b23c3f). Next: Key people release (KA SD + KB NSD), then the living cast (mockup v2 awaiting USER), then Ersveil cast writing, then backlog release.
- Follow-up (backlog release): NSD dossier sticky jump-chip row is see-through (content shows under it) — opaque with the panel fix.

- 1 Nov: Key people released (SD 2.7.0, NSD 1.5.0). Next: living cast fixes (Review C B1/B2) → re-check → release (SB 2.15.0, SD 2.8.0, NSD 1.6.0, Studio 0.5.0); Ersveil cast 7/12 with USER; then clean-up release.
- Follow-up (clean-up release): SB "This reply" card drawn after ST's scroll-to-new-message → sits below the fold until the next reply; scroll again after drawing (then drop SD cast/follow.js).

- 1 Nov: Living cast released (SB 2.15.0, SD 2.8.0, NSD 1.6.0, Studio 0.5.0). Next: Ersveil cast 11–12 with USER → assemble cast.json (trim to limits) + portraits → Ersveil pack update PR; then clean-up release (date/time pencil, SB card-scroll, pack formula in Studio, NSD 404 check, other follow-ups).
- (done 2 Nov, SB 2.16.0) Portraits shrink on import; 150 KB / 1200 px; NSD keeps them as files (1.7.0).

## Follow-ups after 2 Nov (clean-up + fix releases + docs)
- Customizing: SB should accept user overrides from one place (e.g. :root or a single class) instead of the long root
  list; one accent variable should drive accent-soft/-text; pack-level `theme` is validated but drawn by nothing;
  authoring-kit check does not look inside layouts.
- Review X: phone "at the bottom" reaches 357 px; Escape in the hero editor closes the Game view; no busy line while
  portraits shrink (+ parallel import); phone memory on big zips / 64 MP decode; corrupt header sentence; Studio vs SB
  keep-rule for small large-pixel images (Studio could reuse SB portrait-fit.js).
- Review Y: phone Pin list under the bottom bar; NSD-off save point STALE after /cut; unreadable NSD index reads empty;
  release() failing after a heal may repeat the toast.
- ZC: Quests tab plain text; Dossiers library stray bullets; map label cut by the You marker; Studio phone "Pack" label
  offset; a trip from a sub-place refused (needs the town); World cards leave Factions alone on a row.
- Docs: SB docs/v2/STATUS.md, docs/STORY_SUITE.md, docs/v2/ERSVEIL.md (2.4.0); SD docs/ARCHITECTURE.md (v1 contract);
  Studio docs/STUDIO.md 5b numbers; Studio Timeline screenshot.
- Code: delete NSD story-block-tabs.js v1 tab registration; SB sdk could expose scroll helpers (SD keeps a local copy);
  director.time text zero-padded; Key people removal line waits for a reply with change lines.
- BH2 unproved suspects (2 Nov): NSD inlineEntriesForRender ignores Enabled (cards may render while NSD disabled);
  NSD storage-durability retry every 30 s uncapped even when disabled; NSD deferUntilSettled polls 250 ms while the
  barrier is up; NSD extractExplicitKeyRelationshipEdges quadratic on 20k+ char no-space text; NSD vault.read null on
  unparseable body → index rewritten; Studio Open pack replaces unsaved work without confirm (needs mockup); Studio
  saveHeld fire-and-forget ordering; SD reveal.set evicts by insert order.
- BH1 unproved suspects (2 Nov): sdk.command await settle() window lets a chat switch apply a click to the new chat;
  store.js unsaved map keeps old-chat objects when a rescue is given up (memory); "a change of another chat was not
  saved" warning seen under 40 ms chat switching in polluted test chats (cause unknown); rewind/savepoints running
  flag stays if ST's branch call never settles; a user message with a literal [battle] line is hidden.
- REVIEW-Z follow-ups (2 Nov): LEGACY_FORMAT / safety-net REFUSED lines show only in Problems/Inspector, not on the
  reply card (card said "No changes"); empty own <Changes></Changes> + v1 envelope drops envelope lines silently; v1
  envelope inside a code fence leaves an empty fence; RPG off: [battle] raw on fresh page load (pre-existing); safety
  net refuses "! time -1h"; Studio + NSD READMEs list SB 2.16.1 / SD 2.9.1 (NSD readme-docs test pins them).
- Gear part 2b (after levels on main; branch from 2.17.0 + stage52/54/55): stat bonuses in rolls (effective stats
  capped at 30), wear on decisive hits (gear.wear), battle-log gear lines, story.legendaryEarned, and `wear: ruin` → Broken
  in one step (today one ruin = 100→60). Merge stage54/gear-grammar 906c7e6, stage55/gear-ui, Studio stage55/gear-items.
- Levels follow-ups (3 Nov): F2 narrator XP line on Re-read should use its recorded xpRate; Custom "Points per Soul Class"
  row (pointsPerSoul) is stale under levels — reword or remove; B6 witness still carries the raw class for old blocks
  (read side maps 10n−5).
- 2.17.0 review follow-ups: refuse commands while onChatChanged awaits the RPG load (≤4 s, store still on the old chat);
  rebuild when the RPG code arrives after the 4 s cap; blocks made from Settings → Blocks → template get cap 99 (use
  levelCapFor).
- Gear follow-ups: P8 bound pieces of a member renamed while present are not stowed on leave (store the block id on the
  bound stack); F1 the roll guard doesn't check who `own` should be (pc/roster change before a roll); pack event case for
  B1 tested by harness caller only.
- **2.18.1 (USER 3 Nov): party roster.** The RPG answers `party.actors` from its Character blocks (one actor per Character,
  stable id from the block), so companions own and wear their own gear, the Party Inventory card shows theirs, and
  signature gear is granted and bound on join. Until then, in a setup with no roster all worn gear counts for the reader
  and NPC signature gear stays with the NPC (the narrator's Gear line only).
- Prompt-diet release plan: SB 2.19.0 = LEAN1-SB (+ kind `heads`) + LEAN2-RPG + lean-lore (Ersveil 2.6.1), on top of 2.18.1
  (roster). Then SD (stage59/lean-sd: set STORY_BLOCK_WITH_HEADS to 2.19.0) and NSD (stage59/lean-nsd).
- (done 2.22.0) SB strings.js duplicate key `card` split into `card` / `cardKind`.
  Studio: node_modules tracked as a symlink (untrack); AI-README "Suite today: Story Block 2.16.1"; Items form `bonus`.
