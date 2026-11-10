# V1 → v2 feature audit (read-only, 2026-10-22)

Heads checked (shallow clones in /home/user/_ro/audit-<repo>-{main,v2}):
SB main bbd4599 / v2 735e56e · RB main defbcdf / v2 9898b2a · SD main 1273686 / v2 ee18775 · NSD main f6e92f5 / v2 4ba92a5.
I checked each item in v2 code (settings schemas, capture kinds, commands, screens), not only the docs. Decisions are cited
as F# (SB docs/v2/MODULES.md §F), SPEC § (SB docs/v2/SPEC.md) or LOG:line (scratchpad/V2_LOG.md).

## MISSING (no decision found), most impact first

| # | Repo | v1 item → state in v2 | Impact | Effort | Where it would go |
|---|---|---|---|---|---|
| 1 | SD | **Arc planning**: one planner call per arc on its own connection profile; Plan arc / End arc; review (Accept, Discard, Plan again, Accept without reading); auto triggers (no arc, beats done, stall 7 days, running low <3); genre and tone; Director's note (used once or kept); editable planning prompt; beats with `reach:`; planned fights. v2 has no planner, arc record or buttons (`arc` is only a passthrough field in tracker/convert.js). | high | L | new SD part `src/v2/arc/` (reuse v1 src/planner.js), SD module.js, screens/director.js; needs #3 |
| 2 | all | **Diagnostics**: RB v1's report (what it sees, last/next reply sent, blocks and their outcome, last fight, activity, raw JSON, Copy) and SB v1's status line ("the last prompt got the instructions"). v2 has none (NSD's own Diagnostics still works in its carried panel). **In progress: settings3.** | high | M | SB src/v2/host-ui.js + one diagnostics hook per module |
| 3 | SB | **A model call API for modules, with a connection-profile dropdown.** v1 RB and SD each picked a profile from `getSupportedProfiles()`. v2 has only SB's private assist/st-adapter.js and a free-text profile field. Arc, monster flavour, companion skills, What next? and capture-always all need it. **Dropdown in progress: settings3.** | high | M | SB src/v2/sdk.js (`sdk.callModel({prompt,maxTokens,profile})`), assist/common.js schema → choice |
| 4 | SB/RB/SD | **What's sent (exact text + Copy)**: v1 had it in SB settings, the RB Party card and the suite overlay, one fold per extension. v2 shows token counts only (host-ui.js drawSize), though `turn.preview()` already has the text. | med | S | SB src/v2/host-ui.js (size fold: show each part's text, Copy) |
| 5 | SD/SB | **Behind-the-scenes hiding**: SD v1 Director tab hidden by default with Reveal/Hide; SB v1 "Hide off-screen until revealed". The v2 Director screen shows agendas, beats and clocks openly (only secrets are name-only). | med | S–M | SD src/v2/screens/director.js (+ status-card.js): a hidden fold or setting |
| 6 | RB | **Recover HP/MP as story time passes** (5 %/hour, a full rest at 6 h or more, setting on by default, with SD). Not in v2: party/pools.js uses the clock only for conditions wearing off. F30 lists rests, items and story heals, and does not mention time. | med | S–M | RB src/v2/party (capture hook on the `director.time` delta, v1 src/recovery.js), setting in party/sheets.js |
| 7 | RB | **Story XP awards** (`<XP>minor/major/milestone: …`, awarded at once). `party.grantXp` accepts `kind`, but no capture kind sends it (party/capture.js kinds: wound, join, skill, check, rest, leave). Only quest and fight XP reach the party. | med | S | RB src/v2/party/capture.js: an `xp` kind → party.grantXp {kind, claim} |
| 8 | NSD | **Story date for birthdays and ages while hosted.** v1 read the World State date and SD's calendar through the v1 handshake. Hosted, the v1 handshake offers nothing and nothing reads `director.time` or `director.calendar`, so NPCs no longer age with the story clock. | med | M | NSD src/storysuite-v2.js (query director.time/calendar) → index.js setExternalCalendarSource |
| 9 | NSD/SB | **The prompt-size estimate leaves out NSD's own injection** (dossiers, ~2–4 k tokens; one-pass rules). NSD's v2 context is only the meters line, so the overlay total and contextShare miss NSD's biggest part. | med | S | NSD storysuite-v2.js (report its injection as a preview part) + SB host-ui.js |
| 10 | SB | **Choices**: four next actions as buttons (click fills the box, Shift-click sends). Gone. F13 bans the block form ("only `<Changes>`") but no decision covers the feature. | med | M | SB: a `choice` change-line kind + a buttons widget on the changes card |
| 11 | RB | **Monster flavour call** (one short call per new creature, ≤4 per fight, words only: look, traits, skills, loot names; on by default). v2 makes template and kin creatures only (v1 templates.js), with no call. | low–med | M | RB src/v2/combat/setup.js + v1 src/flavour.js; needs #3 |
| 12 | NSD/SB | **NPC Inner Chatter** (whispers and thought bubbles on NSD cast cards). Gone, the same way as #10 (F13 implicit). | low–med | M | SB kind + NSD storysuite-v2.js cast cards (v1 bubble code exists) |
| 13 | RB | **Bestiary screen**: this story's creatures by family, Regenerate, Forget, Export/Import JSON. The domain exists, but no screen or command shows it. | low | M | RB src/v2/screens/ (new screen) + combat commands |
| 14 | RB | **Companion skills by model call** on join (library fallback in v1). v2 uses the library and hints only. | low | M | RB src/v2/party/commands.js join; needs #3 |
| 15 | RB | **What next? after a fight** (moves as buttons, own model or profile). Gone. | low | M | RB src/v2/board or screens + #3 |
| 16 | RB | **Join form / NSD link**: v1 opened Add companion (role, focus, control) with an NPC picker from NSD and a Dossier button. v2 accepts the offer as written; `npc.dossier` and `npc.known` queries exist but nothing uses them. | low | M | RB src/v2/party/tab.js, screens/party.js |
| 17 | RB | **Settings: XP rate** (0.25–5) and **gear limits** (worn pieces, accessories; F99 says a setting up to 3). The rules read `xpRate`, but there is no schema field; the gear limits are fixed in rules. | low | S | RB src/v2/party/sheets.js, items/index.js schema |
| 18 | RB | **Undo** for a trade (0.5.43) and for a story wound (toast and Party tab). v2 can only swipe or delete the reply. | low | M | RB src/v2/trade, party (a reverse command per receipt) |
| 19 | SD | **Pin a thread** to keep it in the note. `track.pinned` is still honoured (tracker/note.js:119), but there is no command or button to set it. | low | S | SD tracker command `director.pin` + screens/director.js |
| 20 | SD | **Capture "Always" mode** (no change lines asked of the story; the second call writes them every reply). The v2 extractor runs only when `<Changes>` is missing. | low | M | SB src/v2/assist/extractor.js + prompt.js |
| 21 | NSD | **Dossiers tab** (searchable list with the dead hidden). Hosted v2 has only the Cast tab; the list is reachable only from Open dossiers in the settings panel or the opt-in launcher. | low | S | NSD storysuite-v2.js tabs (reuse story-block-tabs.js dossiers render) |
| 22 | SD | **`/route` slash command** (route with mode/rate/from/to). v2 has the route trip in map place details only. | low | S | SD index.js / src/v2/atlas/travel.js |
| 23 | SD | **Import from World State Alpha** (bundle → World records). | low | M | SD src/v2/chronicle (v1 src/wsa.js) |
| 24 | RB | **Dice: Everyone** (NPC rolls) and dice without RB. v2 checks are party-only and RB-owned. | low | M | RB src/v2/checks or SB |

## Story Block (v1 = block engine; v2 = host)

- PRESENT: settings overlay "Story Suite" (host-ui.js), tokens per reply (sizes only, see #4), Versions fold,
  Features toggles (F100), packs import (F60), state inspector (F92), save points (F93), game view Alt+G (F53).
- REPLACED: Inventory block and purse line → inventory domain and wallet (F1, F13); money tiers → one currency (F1;
  coin denominations being added by terms2, LOG:349); World State scene board → Scene screen and `scene` domain plus SD
  Director/atlas (F13); Dice/Dice: Everyone → same-reply d20 checks in RB (F80); Character Sheet → RB party (F13);
  Rescan chat → per-reply Re-read (F40); Edit on a tab → edit the reply and Re-read (GUIDE "Swipe, delete, edit");
  sidebar/card display → v2 tabs (F59); "This turn" strip → status strip (F54) and changes card (F24); found-this-turn
  Leave → loot picker (SB #104); Source of truth → one writer per domain (SPEC §0.3); plugin API
  registerTab/registerBlock/kept blocks → sdk.registerModule (SPEC §6); prompt-cache layout → static/tail (SPEC §0.4).
- DROPPED BY DESIGN: user-defined blocks, block editor, "From an example", stateful/per-turn/first kinds, layouts
  (F13; Studio later F27/F75); envelope `<!-- STORY_BLOCKS_V1 -->`, reading v1 chats, migration from Inventory
  Block/Megumin (SPEC §0.7, F15); Megumin-compatible card, Hide empty tabs (F59).
- MISSING: #3, #4, #10, #12 (and its share of #2).

## RPG Battle

- PRESENT: creation wizard (F12, F14, F22); Party screen with companion control/growth switches (F29, F49); points and
  Spend; fight board (Attack, Skill, Item, Defend, Parley, Flee, Auto); offers for join, skill and leave (Accept);
  wounds, rests and checks kinds; template + kin creatures (v1 templates.js); loot tables (F35); Trade buy, sell,
  commission, collect, place prices, shortages (F36–F38, F107); Combat settings (turn order, speed, hit chance); Party
  settings (points/level, stat cap, level cap, active skills, auto-spend, max companions); Terms (F105, levels per rank
  in progress terms2); character file export/import (F66); fell companion removed (F26); return in time (F17).
- REPLACED: `<Encounter>` → `! encounter` kind; multi-stage plans → waves in one fight, so the between-stage Fall
  back/Go on is lost (LOG:34 "Plan stages join as waves for now"); Use item button → story use (F96); RB Items page →
  SB Inventory (LOG:97, F99); `<Crafted>` → crafting with stats (F102); party file (with companions) → PC-only
  character file (F66); "Battles on" switch → Features (F100); money settings → F1/F104; Source of truth (SPEC §0.3);
  Character Sheet notice (F13).
- DROPPED BY DESIGN: Party/Inventory block tags and the Blocks fold (F13); reader-added check modifiers (F78/F80);
  respec (F51, not built); multi-foe weak-offer v1 parity (LOG:122).
- MISSING: #2, #6, #7, #11, #13–#18, #24.

## Story Director

- PRESENT: change-line grammar and tracker (agenda, event, hook, quest, clock, beat, secret; SPEC §4); Director screen;
  Quests screen with details pop-up (F84); calendar (preset/pack, era, months as lines, leap years, weekdays; pack
  calendar view in progress terms2); quiet-after/due-soon settings; lapses and slips (F21); while-away recap (F21, F45);
  map with pan/zoom/search/route trip (F98) and map settings (north, east, km/unit, road factor, travel era); Days screen
  with search (SD #90); Chronicle (F89).
- REPLACED: Journal tab → Days screen (day digest, SD #90); world pack import (file/paste) → SB packs (MODULES §E, F60);
  note depth and budget → host static/tail + tailBudget/contextShare (SPEC §0.4, SB #115); capture call (fallback) →
  SB Assist extractor (F23, F100 `story-block.extractor`), but see #20 for Always; "Today is" → story writes the clock
  (F44) + pack start date (F21); `globalThis.StoryDirector` API → sdk queries.
- DROPPED BY DESIGN: quest buttons Take on, Turn down, Complete, Abandon, Undo (F95); the Offered step, offer cooldown,
  and "ask before taking a job away from where it was offered" (SD #99, user today; LOG:301, 315); Seed from World
  State, Scene block tag, Mirror off-screen agendas into World State (F13, F15, SPEC §0.7); Source of truth (SPEC §0.3).
- MISSING: #1 (with genre/tone, Director's note, planning prompt, review, auto triggers), #5, #19, #20, #22, #23.

## NPC State Delta (hosted: v1 engine + src/storysuite-v2.js)

- PRESENT (engine unchanged; its whole panel is carried into the overlay): auto scan, Refresh, Full scan, Add NPC,
  dossier editor with field locks, Archive/Remove/Restore, portraits (upload, ST image gen), custom fields,
  relationship map, injection, one-pass capture, rewind options, backup export/import, Diagnostics, What's sent,
  scanner connection profile (selector being fixed, settings3, LOG:349); Cast tab and game-view Cast (#195);
  in-chat cast (hidden by default while hosted, setting kept, #173); floating launcher (hidden while hosted, setting
  `launcherWithStoryBlockV2`, #173).
- REPLACED: trust/affection/desire/tension → `npc` meters domain with stages and custom meters (F81, F90); focused
  relationship passes and new-NPC passes while hosted with meters → skipped, backfills ≤2 per reply (NSD #192,
  LOG:158, 230); v1 SB tabs (Present NPCs) → Cast tab; Source of truth → none needed under v2; World State mood and
  outfit lines → dossier lines (F13).
- DROPPED BY DESIGN: deceased NPC revival by the model (C-1, LOG:156 item 6).
- MISSING: #8, #9, #12 (chatter bubbles), #21. The RB-side companion picker and Dossier button is #16.

## Notes

- #3 blocks #1, #11, #14, #15 and #20; build it first (or together with #1).
- Already in flight, so not new work: Diagnostics, the profile dropdown (settings3), terms/tiers/levels per rank, coin
  denominations, SD pack calendar (terms2).
- Choices and Inner Chatter (#10, #12) are the only v1 features removed as a side effect of F13 without a decision of
  their own. Ask the user whether to keep them dropped.
