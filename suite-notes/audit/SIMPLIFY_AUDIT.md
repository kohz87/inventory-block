# Story Suite simplify audit (read-only)

Checked out: Story Block `origin/stage24/look-you` (6c631e6, 2.10.0), Story Director `origin/stage24/status-you` (8adb7fc, 2.4.0), NPC State Delta `main` (3e67d86, 1.3.0). No tracked file changed in any clone (`git status` clean in all three). Measuring scripts are in `.../audit/_probe/` (outside the clones).

How I measured. The prompt numbers come from the real thing: Story Block's own test host (`createHost`) with the real Story Director module and NPC State Delta's real adapter registered, then the actual `story_suite_static` and `story_suite_tail_1` prompt texts read back. Token counts use the repo's own estimator (characters / 4, `estimateTokens` in `src/v2/prompt.js`). Not measured live: NSD's own dossier injection and its scanner call (NSD builds those in its own code, which the test host does not run); for those I used NSD's own `npm run measure:prompts` output and its README. RPG tail lines and the RPG pre-call are estimated from source. Tail readings move by about 5 tokens between runs.

---

## 1. Narrator load

### 1a. Every change-line kind the narrator is taught

26 kinds are registered across the three extensions. **22 are taught by default** (they are in the fixed prompt part with all defaults on). 4 more appear only when a switch or the RPG is on.

Ops used by all kinds: `+` new/gained, `-` gone/lost, `~` changed, `!` happened, `?` asks code to decide.

| # | Kind | One-line grammar (as the narrator sees it) | Owner | Gate | Default |
|---|---|---|---|---|---|
| 1 | item | `+ item Name \| qty: 1 \| note: …` (`- item`, `~ item`) | Story Block | none | on |
| 2 | coin | `+ coin 30 \| from: who` (`- coin 5 \| to: who`) | Story Block | none | on |
| 3 | loot | `? loot Thing, Other Thing x2 — where it lies` | Story Block | `story-block.loot` | on |
| 4 | place | `~ place Name \| kind: … \| region: … \| with: who came along` | Story Block | none | on |
| 5 | present | `+ present Name` / `- present Name` (plus the rename rule: `- present clerk, + present Nelje`) | Story Block | none | on |
| 6 | weather | `~ weather cold drizzle, low fog` (≤60 chars) | Story Block | `story-block.weather` | on |
| 7 | you | `~ you wearing: … \| condition: …` (adds `rank:` where a pack gives one) | Story Block | `story-block.you` | on |
| 8 | npc | `~ npc Name \| trust: +N \| affection: -N` (meters trust, affection, desire, tension) | NSD | none | on |
| 9 | milestone | `+ milestone Name — the turning point just happened (once)` | NSD | `npc-state-delta.stages` | on |
| 10 | quest | `+ quest Name — … \| goal: … \| giver: …` | Story Director | none | on |
| 11 | hook | `+ hook Name — an open thread or lead` | Story Director | none | on |
| 12 | agenda | `+ agenda Name — off-screen doing \| now: \| then: \| on: <date>` | Story Director | none | on |
| 13 | event | `+ event Name — happening in the world \| then: \| on: <date>` | Story Director | none | on |
| 14 | clock | `+ clock Name — what happens when it runs out \| due: \| shown: none/sign/warning` | Story Director | none | on |
| 15 | beat | `+ beat Name — a planned turn \| on: \| reach: …` | Story Director | none | on |
| 16 | secret | `+ secret Name — what must not be revealed yet` | Story Director | none | on |
| 17 | time | `~ time <date, clock time>` and `! time +2h` | Story Director | none | on |
| 18 | route | `+ route Place — Other Place \| hours: / days: \| kind:` | Story Director | none | on |
| 19 | landmark | `+ landmark Name \| region: \| kind: \| plane:` | Story Director | none | on |
| 20 | world | `+ world Name — … \| state: looming/ongoing/resolved \| place: \| factions:` | Story Director | none | on |
| 21 | faction | `+ faction Name — … \| area: \| stance:` | Story Director | none | on |
| 22 | check | `? check <skill> — attempt \| dc: \| who: \| vs:` | Story Director | none | on |
| 23 | choice | `? choice Climb the wall` (2 to 4 lines at the end) | Story Block | `story-block.choices` | **off** |
| 24 | chatter | `~ chatter Name: …thought` | Story Block | `story-block.chatter` | **off** |
| 25 | party | `+ party Mara \| about: … \| class: I \| best: int` (`- party`) | Story Block (RPG) | `story-block.rpg`, and only once a party exists | **off** |
| 26 | dm | one kind whose grammar grows with each custom block/data module the reader makes (up to 8 blocks) | Story Block | none, but empty until a block is pinned | off (none until made) |

Counts: 22 taught by default; 18 of those have **no switch at all** (every Director kind, item, coin, place, present, npc). Only 4 default-on kinds are switchable (loot, weather, you, milestone). Switch-gated default-off: 3 (choice, chatter, party), plus the open-ended `dm`.

Planned additions: kinds 27 and 28.

| Planned | Grammar (from the briefs) | Gate | Default |
|---|---|---|---|
| `~ trip` (R11, Story Director) | `~ trip Wolfmere Outpost \| by: riding\|foot\|wagon\|boat\|ship \| via: …`, `~ trip stop`, `~ trip delay: 1 day \| because: …` (one grammar line) | `story-director.trip` | on |
| `+/~/- mount` (R10, Story Block) | `+ mount Grey Mare \| kind: horse \| count: 1 \| pace: 35 \| where: ridden by Wessel`, `~ mount Burr \| condition: lame`, `- mount Burr` (one grammar line; up to 6 rows) | `story-block.mounts` | on |

After both ship: 24 kinds taught by default, 24 feature switches, 15 → 17 switches on.

### 1b. Size of the instructions (measured, all defaults on)

**Fixed part (static, same bytes every reply, cacheable): 5,246 characters = about 1,312 tokens, 48 lines.**

| Piece | Tokens (approx) | Share |
|---|---|---|
| Opening rules + `<Changes>` how-to (12 lines) | 207 | 16% |
| The 22 kind lines | 590 | 45% |
| Story Block's context text (inventory/place rules + money line) | 83 | 6% |
| NSD's meters line | 57 | 4% |
| Story Director's text (Director lines, Fields, Pacing, World lines, Under [World], Checks, Initiative) | ~375 | 29% |

By owner: **Story Director is about 730 tokens (56%) of the fixed part** (13 kind lines about 355 + its prose about 375). Story Block is about 300, NSD about 85, the shared header 207.

Cost of the switchable pieces (static tokens added/removed by one switch): Initiative 48, Weather 29, Loot 28, Your look 27, Stages and milestones 19 = about 150 tokens for the five default-on prompt switches. Turning on Choices adds 43, Inner chatter 38. A party line adds about 58 (once an RPG party exists).

**Everything switchable off at once** (all 15 default-on switches off): fixed 1,162 tokens (-150, -11%), tail 185 (-34). So today's switches barely thin the prompt, because the heavy part (Director kinds and prose) has no switch.

**Typical per-reply tail (changes every reply, sent last):**

| State | Tail |
|---|---|
| Moderate mid-story (3 people here, 7 items, 120 coin, 2 quests, 2 agendas, 1 clock, 2 hooks, 1 world event, weather, look) | 876 chars = about 219 tokens, 14 lines |
| Busy (6 people, 20 items, 5 quests, 4 agendas, 3 clocks, 4 hooks, 3 world events) | 1,562 chars = about 391 tokens |
| Hard cap | Tail budget 1,500 tokens by default (`DEFAULT_TAIL_BUDGET`); context share 40% |

So the narrator reads about **1,530 tokens (moderate) to 1,700 (busy) of Story Suite text per reply** from Story Block and Story Director, 75–85% of it the fixed part.

**NSD's own prompt on top (separate keys, not in the above):**
- Live dossier of present NPCs: on by default, up to 3 NPCs, budget 4,000 tokens. NSD's fixture for one rich NPC is 2,108 chars = about 603 tokens; its README says "often 2,000–4,000 tokens". Counts toward the context share.
- Auto scan on by default: a **separate model call every reply**, 2,094 to 2,290 estimated input tokens on NSD's fixtures (7,300–8,000 chars). Scanning every N replies is a setting (`scanEvery`, default 1).
- One-pass capture (off, experimental) would add about 2,100 to 2,700 tokens to every roleplay request; compact version about 1,800.
- Other extra model calls, all off by default: pre-roll, safety net (Story Block Assist); arc planning when set to "by itself" (Story Director, default is manual); RPG pre-call (about 366 tokens of fixed instructions plus the sheets, when the RPG is on).

**Planned additions (estimated with the same estimator, from the brief wording):**
- Fixed part: `mount` grammar line about 43 tokens, `trip` grammar line about 40 = **about +83 tokens (+6%)**.
- Tail: Mounts line about 30 tokens (only while a mount exists), On the road line about 30, plus the "has reached X: write ~ place X" line about 19 when a leg has been passed = **about +30 to +80 per reply while in use, 0 otherwise**.
- Both default on, so the fixed part grows for every reader whether or not they ever ride anywhere.

---

## 2. Screens

Three display surfaces: the **Story panel** (side sheet, same tab list as the game view), the **Game view** (full screen), and the **cards under each reply**. A header block (`ss.hero`) sits above every Game view screen. A status strip (HUD) can sit above the message box.

### Game view tabs (default install of all three, RPG off, no custom blocks)

| Tab | From | Shows | Notes |
|---|---|---|---|
| Home | Story Block | RPG start card (RPG only), Before you start, **Where** (place, region, time, weather, people here, with pencils), **Purse** (coins, item count, worn items), **Quests** (board of open quests and offers), Save points, block cards | landing page |
| Inventory | Story Block | wallet, items, loot, bag actions | |
| Quests | Story Director | "Goals and quest history" cards | read only |
| World | Story Director | two views. **Now**: Here (place, weather, people with NSD cards), Upcoming, News and events, Factions. **Journal**: one fold per story day, search | only what the reader knows |
| Map | Story Director | map widget, layers, search, trip from here | R11 adds "On the road" panel |
| Chronicle | Story Director | world events under way and resolved, factions, with Edit forms | |
| Director | Story Director | story time and place, Arc panel, Quests, Hooks, Off-screen, World (events), Clocks, Beats, Secrets, Problems; agendas/beats/clocks/secrets hidden behind **Reveal** | GM view |
| Dossiers | NSD | dossier browser with search (present cards sit on top only without World) | last tab |
| Scene | Story Block | place, kind, region, time, weather, people with portraits | **registered but hidden by default** while World exists |
| Party, Fight | Story Block (RPG) | only with the RPG on | +2 tabs |
| custom blocks | reader | up to 8 own tabs | |

Visible by default: **8 tabs** (9 registered). 10 with the RPG, up to 18 with custom blocks. The reader can reorder and hide tabs (Settings → Tabs & Packs → Tabs). The Journal is also a dialog (`story-director/days`).

Under every reply (each can be turned off on its own): **Changed this reply** (Story Block), **Status** (Story Director: Time, Weather, Place, Coordinates, rank/Wearing/Condition, Goal), **NPCs** meters (NSD). Plus Choices strip, Inner chatter, per-reply notes, Problems.

### Settings sections (window with a left rail)

| Section | What is in it |
|---|---|
| Look | panel style, glass strength, font, text size (4) |
| Features | the 22 switches, grouped by module |
| Money | currency name/plural/short, money scale, coins list, coin display (6) |
| Assist | model connection, pre-roll, safety net and its kinds, recent runs (3 fields + 2 switches) |
| Tabs & Packs | prompt size (tail budget), share of the context, max change lines, one-call-at-a-time, tab order/hide, pack import, block templates |
| Blocks | custom trackers for this chat |
| Modules | each module's own settings: Story Block (inner chatter in prompt), **Story Director 36 fields** (calendar 5, tracker 7, time 2, map 5, chronicle 3, world 1, arc 11, checks 3, behind-the-scenes 1), **NSD's own panel in 9 groups** (Scanning, Roster & continuity, Calendar & birthdays, Source of truth, Portrait generation, Scanner rules, Advanced, What's sent, Data & maintenance; about 43 setting rows, 93 controls), NSD meters/stages/social (8) |
| Diagnostics | report, packs/modules self-report, events, state inspector |
| (RPG) | its own page appears when the RPG is on |

Counts: **8 sections (9 with RPG)**; about **120 individual settings** (Story Block 10 + host 8 + Story Director 36 + NSD schema 8 + NSD panel keys about 53 + RPG about 6). The window opens on Features. The Features page is the only place that lists everything optional.

### Same fact shown more than once

| Fact | Where it is shown | Primary owner today (where it is edited) |
|---|---|---|
| **Place** | hero header (every screen), Home Where, Scene tab (hidden), World → Here, Director header, Status card under each reply, Map "you" and coordinates, Changed card | **Home Where** (pencil) and Scene (pencil). 6–7 places. |
| **Time** | hero header, Home Where, Scene, World header, Director header, Status card, World → Journal | Story Director's clock (`~ time`); no single screen. 6 places. |
| **Weather** | hero header, Home Where, Scene, World → Here, Status card | Home Where / hero (pencil). 5 places, and two features produce it. |
| **People present** | Home "Here" (with edit), Scene (hidden), World → Here (NSD cards), Dossiers top cards (without World), NPCs meters card under replies, NSD's in-chat "Present NPCs" strip setting, Changed card | **Home** for the list; NSD for cards. 5–6 places. |
| **Money** | Inventory wallet (pencil), Home Purse, Changed card | Inventory. Only 3, fine. |
| **Quests / hooks** | Quests tab, Home Quests panel, Director (Quests and Hooks sections), Status card "Goal", World → Upcoming (quest due), narrator tail | **Quests tab** for quests. Hooks only in Director. 5 places. |
| **Reader's character** | hero header (name, class, level, HP/MP/SP, conditions, rank, wearing, condition; pencils on the last three), Status card (rank/wearing/condition), Party tab (RPG sheet), Changed card | **hero header** for look; Party tab for stats |
| **Companions** | Party tab (RPG sheets), Dossiers and NPCs meters (NSD), World → Here people, join-offer card under the reply | Party tab for the RPG party; Dossiers for everyone else |
| **World events / factions** | Chronicle (with edit), World → News and events, World → Factions, Director "World" section, narrator tail "[World]" | **Chronicle** (editable); World is the read-only twin |

On Home itself, place, time and weather appear twice, once in the hero header above and again in the Where panel just under it.

---

## 3. Overlaps between extensions

1. **Who is present: three trackers.**
   - Story Block `+/- present` is the scene's list (and the list shown on Home).
   - NSD keeps its own `present` flag per dossier from its scanner; the test `storysuite-v2-fresh-chat` shows "a person with a dossier keeps the dossier's presence: away in the dossier, not drawn from the slice". The "Source of truth" setting (NPCs, Calendar, Scene, Game stats, each Automatic / mine / theirs) exists only to referee this.
   - Story Director `agenda` says where an off-screen person is and what they do (a third place for "where is Odda?").
   - The narrator is told to write all three: `+ present`, `~ npc`, `+ agenda`.
2. **Quests vs hooks vs agendas vs beats vs clocks vs events vs secrets.** All seven are the same stored thing (a "thread" in Story Director's tracker) with different labels. The narrator needs a rule for each (`a job only offered stays a hook; + quest once You accepts it`). Quests have a Home panel, a tab and a Status row; hooks are visible only in the Director tab.
3. **`event` vs `world`.** Two kinds for "something happening in the wider world". `event` (tracker: dated, `then:`/`on:`) shows under "World" in the Director tab. `world` (chronicle: `state: looming/ongoing/resolved`, place, factions) shows in Chronicle, World → News, and the tail's `[World]`. Story Director's own source comment explains the split as "a kind has one owner", not as a reader need. `faction` lives with `world`; the prompt needs a separate rule paragraph for them.
4. **Scene vs World vs Home Where vs hero header.** All show place/time/weather/people. Scene is already hidden by default when World is registered ("Here covers what Story Block's Scene tab shows"). Home Where and the hero header still both show the same three lines.
5. **Chronicle vs World vs Director.** Chronicle edits what World → News/Factions displays read-only; Director's "World" section lists the same events a third time.
6. **Weather: two features for one fact.** `story-block.weather` (the narrator writes `~ weather`) and `story-director.weather` (code derives it from calendar and region; a narrator line wins for the day).
7. **Two calendars.** Story Director's Calendar settings (and the pack's) and NSD's "Calendar & birthdays" group; NSD follows Story Director's clock only "when the two calendars agree".
8. **Companions: three representations.** RPG party sheet (`+ party`), NSD dossier with Companion meter preset, and just a name in `present`.
9. **Reader's character: Your look vs RPG sheet vs persona.** Hero header shows both (RPG bars/class and `you` rows) when both exist.
10. **Journal: Digest vs Chronicle vs Changed card.** World → Journal (day digest, on by default), Chronicle's "Last news" and the Changed card all record "what happened".

---

## 4. Feature switches

- **22 switches declared today**: Story Block 13, Story Director 5, NSD 4. **15 default on, 7 default off.**
- On by default (15): Status strip, Cards under replies, Save points, Weather (SB), Your look, Pick what you take (loot), Encumbered; NPC initiative, Weather from the calendar (SD), Day digest, World view, Arc planning; Stage ladders, Meter presets, Social checks.
- Off by default (7): Roll checks before the reply, Safety net, State inspector, Choices, Inner chatter, RPG, Meters drift.
- 6 of the 22 change the fixed prompt when flipped (the page warns "one slower reply"): Weather, Your look, Loot, Initiative, Stages, Meter presets (plus Choices, Chatter, RPG when turned on).
- **What cannot be switched off**: 18 of the 22 default-on kinds (all 13 Director kinds, plus item, coin, place, present and npc), the Quests, Map, Chronicle, Director and Dossiers tabs (hideable, not removable), NSD's scanner call (an on/off "Enable / Auto scan" in NSD's own panel, not on the Features page), money.
- **No preset or profile exists.** I found no lean/standard/full picker anywhere in code or docs (searched `features.js`, `bodies.js`, the form engine, the guide, the changelog). The Features page is a flat list of toggles. What exists instead are unrelated presets: NSD meter presets (Companion/Rival/Mentor), RPG difficulty presets, calendar presets, panel style. A reader who wants "just inventory, place and quests" must flip 15 switches, hide 5 tabs, and still gets about 740 tokens of Director instructions they cannot remove.
- After R10 and R11: 24 switches (mounts and trips both on by default).

---

## 5. Recommendations (best continuity kept per complexity removed)

Order is by ratio. "Size" is a rough effort for the code and tests, S = days, M = about a week, L = longer.

**1. A Features preset: Lean / Standard / Full (one picker on the Features page).**
- Removes: the need to understand 22 switches. Sets them in one click from a stored table; a fourth word "Custom" shows when the reader has changed any. Include NSD's scan cadence (for example every 3 replies in Lean) and the planned Trips/Mounts (off in Lean).
- Keeps: all saved state; flipping a switch never deletes data.
- Risk: on its own it barely thins the prompt (measured -11%), so it only pays off together with item 2. A preset must be defined by switch ids, so a new switch needs a decision for each preset. Prompt switches re-prime the cache once.
- Size: S (the store already has `features.set`; one table, one control, tests).

**2. Put the nine "world-building" Director kinds behind one switch ("Story threads: full"), so Lean keeps only `~ time`, `+ quest`, `+ hook`, `? check`.**
- Removes (measured by deleting those lines from the Lean prompt): agenda, event, clock, beat, secret, faction, world, landmark, route lines plus the Pacing, World lines and Under [World] paragraphs = **425 tokens, 37% of the Lean fixed part (1,162 → 737)**. The same switch hides the Off-screen, Clocks, Beats, Secrets, Chronicle and World-news panels, which a Lean reader would find empty.
- Keeps: any agenda, clock or secret already in a chat stays stored and keeps replaying; Lean just stops asking for new ones. (Decide whether existing clocks still print in the tail; I would keep them so a ticking clock is never silently dropped.)
- Risk: a story built around beats, clocks and a hidden secret loses its engine in Lean; that is what Full is for. The `world` kind must stay available when a pack's events write lasting changes (`chronicle.lasting`).
- Size: M (feature tag on 9 kinds, 3 prose paragraphs, a few screens; the machinery for tagging already exists).

**3. One owner for the scene header: make the hero header the only place that shows place/time/weather, and compact it.**
- Removes: the Where panel's place/time/weather lines on Home (keep "Here" people and the pencils, or move the pencils into the header), the Director header line, and World → Here's place/weather lines. That is 3 of the 6–7 repeats of place and time and 2 of the 5 of weather. Compact the hero: one line (name · place · time · weather) with HP/MP/SP only when an RPG exists, and Rank/Wearing/Condition behind a "Look" fold.
- Keeps: Status card under each reply (it is history, a different job: what it was at that reply) and all pencils.
- Risk: the place and weather pencils live in Home and Scene today; the header would need them, or Home keeps one compact "Where" row. Layout work overlaps with the UI redesign in progress.
- Size: M.

**4. Retire the Scene tab (keep it only when Story Director is absent, or fold it into Home).**
- Removes: a whole screen and its tab entry (already hidden by default since F119), its copy of place, kind, time, weather and people.
- Keeps: everything, since World → Here and Home already show it; Story Block alone keeps the same content as Home.
- Risk: a reader who un-hid Scene on purpose loses it (migrate the saved tab order). Docs and tests that name it need updating.
- Size: S.

**5. Merge Chronicle into World.**
- Removes: one default tab (8 → 7) and the duplicate lists (events and factions appear in Chronicle, World → News/Factions and Director). World's cards gain the Edit/Reopen/Remove actions Chronicle has today.
- Keeps: all events/factions and their editing.
- Risk: World shows only what the reader knows while Chronicle shows everything; the unknown part (hidden events) would move behind the Director tab's Reveal, which already exists for this.
- Size: M.

**6. Collapse `event` into `world` (one "world happening" kind), keeping both old kind names as aliases when reading.**
- Removes: one narrator kind line (about 22 tokens), the second storage and screen path, the Director "World" section, and the narrator's hardest distinction ("event or world?"). `world` gains optional `on:`/`then:`.
- Keeps: old chats (read `event` lines as `world` with dates; replay must stay identical, which the fuzz tests cover).
- Risk: highest of the list: touches stored data and replay, and the Ersveil pack events. Do it only if item 2's Full mode still feels like too much.
- Size: L.

**7. One Weather switch with a source (Calendar / Narrator), instead of two separate features.**
- Removes: one switch, 29 fixed-prompt tokens when the source is Calendar, and the second Home pencil/Status row clutter. Calendar mode still lets a narrator `~ weather` win if the story clearly changes it, or drop that and keep only the pencil.
- Keeps: weather on every screen as today.
- Risk: a story that wants narrated storms loses the line in Calendar mode; leave it on in Full.
- Size: S.

**8. NSD hosted mode: hide the plumbing and share the calendar.**
- Removes (from view, not from code): in the Modules page, when Story Block is the host, put "Source of truth", "Calendar & birthdays" (use Story Director's or the pack's clock), "Scanner rules" and "What's sent" under one collapsed "Expert" group. That is 4 of NSD's 9 groups and the 12-combination Source-of-truth chooser. Lean preset also sets scan cadence to every few replies (the scanner call is 2,100+ tokens per reply).
- Keeps: every dossier, birthday, meter and portrait; the settings are still there, just not in a beginner's face.
- Risk: birthdays depend on NSD's calendar when no Story Director is installed; show the group again in that case.
- Size: S to M.

**Also decide now (no extra work, saves growth).** Ship R10 and R11 as **one "Travel" switch** (trips and mounts together; mounts alone has no use without a trip planner, and trips use the mount pace) and **off in Lean**. That keeps the switch count at 23, not 24, and the Lean prompt unchanged. Hold a feature freeze after Travel until items 1–4 are in (the lead's own V2_LOG note of 31 Oct asks the same).

**What I would not touch.** Inventory/money (small, 3 places, one owner), the per-reply Status card (it is the history view), save points, the pack/block system (separate from the day-to-day surface), and the replay guarantees.

---

## What the numbers say in plain words

- A roleplayer who installs all three gets 22 narrator kinds, 8 visible tabs, 8 settings pages, about 120 settings and 22 switches, with no way to say "keep it simple".
- The load is not the per-reply tail (small: 220–390 tokens). It is the fixed part (1,312 tokens, 56% Story Director) plus NSD's separate scan call and dossier.
- The heavy, rarely-needed items (world-building kinds, Chronicle, Director Reveal, second calendar, Source-of-truth) are all on, unswitchable, and spread across 3 extensions' settings.
- Items 1 and 2 together cut Lean's fixed part from 1,312 to about 737 tokens (-44%) with no data loss; items 3–5 cut the screens a casual player sees from 8 tabs and 6–7 place readouts to about 6 tabs and 1–2.
