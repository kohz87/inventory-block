# Review C (1 Nov): the living cast + secrets + Studio cast editor

Heads reviewed: Story Block `stage33/cast` 4d4525c, Story Director `stage33/cast` 57b882b, NPC State Delta `stage33/cast-nsd` c8fca1a,
Story Studio `stage33/cast` 66a7025. Reviewer: Claude agent. No commits, no pushes, no merges, rpg_battle untouched. Real SillyTavern on
port 8188 (own data copy, mock model on 5190, both stopped by PID at the end).

## Verdict: BLOCK (2 blockers; B1 is a hidden-value leak)

### B1. The dossier Edit form shows every locked secret in clear text (LEAK)
Repro (real ST, SB + SD + NSD heads, Ersveil 2.4.0 .zip exported from Studio, mock model):
1. Meet Tansy Millrace (pack person, 4 secrets: trust 15 / 35 / 60 and one `when`). Raise her trust to 25 so exactly one secret is open
   (`~ npc Tansy Millrace | trust: +20` in a reply's change block).
2. Game view -> Dossiers -> Tansy Millrace. The dossier itself is right: "Secrets · 1 opened · 3 still hidden", one title + text, three blank
   bars "Opens at Trust 35" / "Opens with the story" / "Opens at Trust 60".
3. Click **Edit**. The modal's "Hidden notes" textarea holds one line per note including the locked ones, e.g.
   `trust 35: [The seized barge] The Grey Ledger took her family's barge for her late husband's gambling debts ...`, the `when` wording of the
   event note ("after a night when the party and Tansy work through casualties together"), and below it the Opened/Hidden selectors are
   labelled with every title ("The seized barge", "The cellar guest", "What he raved"). The editor's own help text says "you see only that a
   note is hidden". Same for generated layered notes (checked with a generated NPC, "Barrel Hob").
   Measured: all 4 titles, all 4 texts and the event wording are in the page after Edit. What's sent, World, cards, Chronicle, Director
   (also revealed) were checked and are clean.
Bar: "locked secret text to the reader anywhere on screen ... secret text in a visible field". Fix idea: in the editor list notes that are
locked and not reader-written as "Hidden note n - opens at Trust 35" rows (open/shut control only), and keep text/title only for opened ones
and for notes the reader wrote.

### B2. The narrator's [Cast] cue is cut before "Why now" and the closing instruction (wrong result vs the agreed design)
Repro: real entries (the 12-entry fixture), Siebert Maas drawn by his goal (planner line `> cast siebert | someone is asking about Master Somner`).
The narrator prompt line is 877 chars and ends `... Wants: Stay out of sight, ... Why now: Someone is aski…`: note.js cuts the cue at TAIL_BUDGET*4-8 = 872
characters, and Who(240)+Look(200)+Voice(140)+Manner(140)+Wants(120) already fill it. So for every real-length entry the reason the story gave
for a goal meeting is lost, and so is "Bring them in naturally; do not treat them as known to {{user}} yet." Place meetings lose the same
tail ("Why now: They are at Bluewatch Village, the place…"). Unit tests use short entries. Fix idea: put "Why now" and the closing
sentence first (or cut the long fields harder, or give the cue its own budget). Judgement call: if you read "the narrator is told they come"
as enough, move it to follow-up 1.

## Follow-ups, ranked
1. A goal meeting leaves the person at their start place. Siebert came to the party at Bluewatch Village, but `director.cast` `met.where`/`where`
   and the dossier ("From the Ersveil cast . first met ... AT OLD LANTERN POST", Now: ... at Old Lantern Post) say Old Lantern Post. Set `where`
   to the party's place on a goal meeting.
2. Import message names unmet people: a pack imported without all its portrait images says "no picture yet for cassian-orrel.webp,
   gundisse-of-brightspur.webp, hearth-under-snow.webp, ..." (file names are the people's names). Under a strict reading of "unmet names to the
   reader" this is B-class; it is a one-time message about a file the reader picked. Suggest "10 portraits not picked".
3. `git diff --check origin/stage32/key-people...HEAD` fails in SD: blank line at EOF in cast/apply.js:226, capture.js:144, hooks.js:214,
   plan.js:196, queries.js:106, world.js:124. (SB, NSD, Studio clean.)
4. SD Settings -> The cast: "New faces at most" is a dropdown, not compact pills (mockup C6, CS compact pills landed and are used only by SB's
   own segmented fields). Phone pills where used measured 30px drawn, tap area 44px (::after 55px / 0.8 zoom), no tap-area overlap.
5. The "pack updated" note counts a version bump as a change: Fenna and Sera were identical in 2.4.0 yet the card says "2 unmet people's entries
   changed (kept where they are)" (planSync puts every `ver` difference in `update`; `changed` counts them).
6. Pack person the narrator already has present (the chat already had a Fenna dossier and Fenna in the scene): SD leaves present people alone,
   so pack-Fenna stays unmet and hidden while she is in the scene. What happens at the first meeting with an existing same-name dossier was NOT
   verified (pace left no room in my run).
7. Dossier/`director.cast` "doing" for an unmoved person is the routine cut at 120 characters with an ellipsis mid-word ("then t...").
8. Observed, not checked against main: a "This reply" card is not drawn for the newest reply until the next reply is generated (so "Paths crossed:
   Tansy" shows on her arrival card only after the following reply; later it is correct). NSD checkpoint files 404 four times in the console on a
   `! time +5d` reply (`/user/files/npc-state-delta-checkpoint-nk_*.json`).
9. Secret blank bars have different lengths (320/310/395 px); if that follows the text length it hints at it.
10. NSD runs a backfill scan for every cast-made dossier (extra model call at the first meeting; no layered-secret rule in it, correct).
11. Known, not retested: SD Key people B2 (archived pinned dossier not released), per coordinator.

## What passed
Counts:
- SB: check ok, 4396 tests, 4385 pass, 0 fail, 10 skipped. diff --check clean vs main.
- SD: check ok, 1084 tests, 1082 pass, 0 fail, 2 skipped.
- NSD: check ok, 1585 tests, 1580 pass, 0 fail, 5 cancelled (the pre-existing Node 22 barrier tests); compatibility-check and runtime-smoke by hand pass.
- Studio: check ok (needed `npm ci --ignore-scripts` for esbuild and playwright, no browser download; chromium via STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium); full suite: 835 tests, 835 pass, 0 fail.
- Byte identity (scripted 31-prompt chat, same testkit, base = stage32/key-people 96ea544 / main 0b23c3f): SD with no cast pack: 0 of 31 prompts differ; SD with a
  cast pack but the feature off: 0 of 31; NSD without SD and with no secrets: prompts, npc slice, npc.cast, npc.known, buildInjection identical; SB core: identical.
- Pack: cast validation per tests; Studio-exported .zip (pack.json + 2 portraits, 12 fixture entries) imports in real ST ("2 portraits saved", files in
  /user/files, `packs.portrait` gives the URL); multi-file pick: good png saved, wrong-bytes .webp refused ("not a WebP, PNG or JPEG image"), unnamed image
  refused, pack imported anyway; zips refused with plain words: `../` path, absolute path, `portraits/../../`, duplicate name, encrypted flag, unnamed extra
  file (nothing imported), no pack.json, 6 MB bomb (">4 MB"), oversize pack.json (512 KB), 68 KB portrait ("at most 64 KB"). Removing the pack removed its
  portrait files. Round trip: the 14 entries (2 sample + 12 fixture) come back from Studio's zip identical except Ruvai's portrait renamed .webp -> .png
  (kept type), other keys equal, SB validatePack ok.
- SD (real ST): join on update (12 joined, note without names), meetings by place + routine (Tansy at midday; Ruvai at dawn after the skip), Lean RPG foes
  (Sluice Rat x2) blocked every meeting while 3 people were at the party's place, and meetings resumed at once when the foe was cleared; goal meeting (Siebert)
  with the planner's reason, cap 1 a day held; day change and a +7h skip moved the cast; deaths ignored with the setting off; swipe keeps who you met (state equal);
  reload state equal; pin from the dossier -> World Key people, away works.
- NSD (real ST): dossier the same reply as the meeting (portrait, "Ersveil cast" badge, block with own path), Pin button, Secrets section per mockup (opened =
  title + pill + text; hidden = bar + rule; no titles/event words while hidden), meter unlock at trust 25, event unlock by scan (the `when` key), generated
  3 layered notes for a new scanned NPC (hidden bars), injection wording "hidden: never state or reveal; let it shape how they act" / "known to the player now;
  may come out", nearest-to-open first and "1 line left out to fit the budget", What's sent shows "Tansy Millrace: 1 hidden note". Narrator prompts (14) carried
  no unmet name, alias or secret text.
- Leak scan of Game view tabs (Home, Party, Inventory, Quests, World, Map, Chronicle, Director incl. revealed, Dossiers): no unmet name.
- Studio: Cast part list/form/portrait shrink (380 KB WebP -> 52 KB, named after the person), check list, zip tree, no console errors.
- Browser errors: none except follow-up 8.

## Not done / not verified
Swipe-undo of an event unlock (my mock opened it again on the swipe; the unit tests cover it), `npc.open` held, one-pass/backfill paths beyond the
dossier backfill call, middle delete and Re-read in real ST (SD's own fuzz covers delete in the testkit), Studio on a phone and dark theme beyond its tests,
phone dossier screenshots, NSD "More" menu export contents, a met person with an existing same-name dossier (follow-up 6).

Shots: scratchpad/rv-c/shots. Probe scripts: scratchpad/rv-c/probes.
