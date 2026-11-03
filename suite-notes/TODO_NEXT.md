# To-do list (updated 3 Nov ~17:00 UTC)

State: Story Block main 2ee6318 (**2.20.0, SDK**: public API v1, {{sb::}} macro, Build-a-card; Ersveil 2.6.1);
Story Director 012c354 (2.10.0); NPC State Delta 120b8a1 (1.8.0); Story Studio 7b79c3c (0.7.0).
In flight: CARD-UI mockup awaiting USER approval (https://claude.ai/artifact/3T4tuABXMuJVYrQNsHknXE).
NSD 1.8.1 follow-ups: Clear keeps scanCount ≥1 (Clear then swipe on a short chat re-reads); portrait species "elf-hound"/"troll bridge"; manual scan/Refresh/capture move the marker past waiting replies (L2a).

## Next after the prompt diet: Story Block as a platform (USER 3 Nov, DRAFT contract)
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
- SB src/v2/strings.js has a duplicate key `card` (esbuild warns in Studio's build; the later one wins) — fix in 2.19.0.
  Studio: node_modules tracked as a symlink (untrack); AI-README "Suite today: Story Block 2.16.1"; Items form `bonus`.
