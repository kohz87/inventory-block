# U1 baseline: Story Suite UI as it is today (no code changes)

Test ST: `$S/bc270`, port 8155, node PID 1029 (file `$S/bc270/live/st.pid`), mock LLM on 5005 (PID in `$S/u1/mock.pid`).
`S` = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Extensions (all detached at origin/main, no local edits):
- Story_block 121e49a15758fc28b0c5f60920c2102ce6658e2a (2.11.3)
- Story_director 4b188c37aaf6b2afd73832ac223f1e223a9e92ae (2.5.1)
- npc_state_delta 13daee6d2ba13fb02e24f972a5a31719ddacc940 (1.3.0), newly cloned into `st-data/default-user/extensions/`
Chat: test character Ersveil, `/go Ersveil` pack, hero Wessel. Filled through the mock LLM with real replies: place, time, weather,
people present (Fenna), items, coin, a quest (Clear the weir), hook/secret/clock/agenda, a world event, a faction, a mount, an NPC dossier
(Fenna), and one battle (Sluice Rat). RPG feature: OFF for the chat/story/game/settings shots, ON for the 6x/7x shots (it was ON when
found and is left ON). Files: `NN-area-view-d.png` (desktop 1440x900) / `-p.png` (phone 390x844). A view that scrolls is shot at its full
height (the viewport is grown to fit; phone Game view keeps its fixed bottom tab bar, so it floats over the last rows in the tall shots).
Settings are not full-page on 53 (capped at 7000 px).
The shots use the default Glass panel style and the default dark ST theme.

## Files
- `01-chat-bar-d.png` [1440x900] Chat scrolled to the last reply: Story/Game view/Suite bar above the message box, cards collapsed (RPG off).
- `01-chat-bar-p.png` [390x844] Chat scrolled to the last reply: Story/Game view/Suite bar above the message box, cards collapsed (RPG off).
- `02-chat-card-changed-this-reply-open-d.png` [1440x900] Same, "Changed this reply" card open (chips: item, wallet, person).
- `02-chat-card-changed-this-reply-open-p.png` [390x844] Same, "Changed this reply" card open (chips: item, wallet, person).
- `03-chat-card-status-open-d.png` [1440x900] Same, "Status" card open (time, weather, place, coordinates, wearing, condition, goal).
- `03-chat-card-status-open-p.png` [390x844] Same, "Status" card open (time, weather, place, coordinates, wearing, condition, goal).
- `10-story-panel-first-tab-d.png` [1440x900] Story side sheet open on its first tab, Inventory; bottom tab bar Inventory/Quests/World/Map/More.
- `10-story-panel-first-tab-p.png` [390x844] Story side sheet open on its first tab, Inventory; bottom tab bar Inventory/Quests/World/Map/More.
- `11-story-panel-more-d.png` [1440x900] Story sheet with the "More" tile menu open.
- `11-story-panel-more-p.png` [390x844] Story sheet with the "More" tile menu open.
- `20-game-home-d.png` [1440x900] Game view, Home: hero header, tab bar, Where / Purse and pack / Quests / Save points / Mounts cards.
- `20-game-home-p.png` [390x958] Game view, Home: hero header, tab bar, Where / Purse and pack / Quests / Save points / Mounts cards.
- `21-game-inventory-d.png` [1440x900] Game view, Inventory (goods list, filters).
- `21-game-inventory-p.png` [390x844] Game view, Inventory (goods list, filters).
- `22-game-quests-d.png` [1440x900] Game view, Quests.
- `22-game-quests-p.png` [390x844] Game view, Quests.
- `23-game-world-now-d.png` [1440x900] Game view, World, Now (here, people, upcoming, news, factions).
- `23-game-world-now-p.png` [390x919] Game view, World, Now (here, people, upcoming, news, factions).
- `24-game-world-journal-d.png` [1440x900] Game view, World, Journal.
- `24-game-world-journal-p.png` [390x844] Game view, World, Journal.
- `25-game-map-d.png` [1440x1022] Game view, Map (regions filter, atlas, legend).
- `25-game-map-p.png` [390x891] Game view, Map (regions filter, atlas, legend).
- `26-game-chronicle-d.png` [1440x900] Game view, Chronicle (world events, factions).
- `26-game-chronicle-p.png` [390x844] Game view, Chronicle (world events, factions).
- `27-game-director-d.png` [1440x900] Game view, Director with Behind the scenes hidden (arc, quests, hooks, problems).
- `27-game-director-p.png` [390x882] Game view, Director with Behind the scenes hidden (arc, quests, hooks, problems).
- `28-game-director-reveal-d.png` [1440x900] Director after Reveal (adds Clocks and Secrets cards).
- `28-game-director-reveal-p.png` [390x1017] Director after Reveal (adds Clocks and Secrets cards).
- `29-game-dossiers-d.png` [1440x900] Game view, Dossiers list (NPC State Delta cast).
- `29-game-dossiers-p.png` [390x844] Game view, Dossiers list (NPC State Delta cast).
- `30-game-dossier-open-d.png` [1440x900] Fenna dossier modal opened from Dossiers (Player relationship, Identity, Current).
- `30-game-dossier-open-p.png` [390x844] Fenna dossier modal opened from Dossiers (Player relationship, Identity, Current).
- `31-game-more-menu-p.png` [390x844] Phone only: Game view "More" sheet (Map, Chronicle, Director, Dossiers).
- `40-game-home-with-leftover-block-tabs-d.png` [1440x900] Game view Home with RPG OFF but the chat still holding RPG blocks: 7 extra tabs (Character, Character 2, Foes, Character, Skills, Skills, Skills 2). Test-chat artefact; all other RPG-off shots hide them.
- `40-game-home-with-leftover-block-tabs-p.png` [390x958] Game view Home with RPG OFF but the chat still holding RPG blocks: 7 extra tabs (Character, Character 2, Foes, Character, Skills, Skills, Skills 2). Test-chat artefact; all other RPG-off shots hide them.
- `50-settings-look-d.png` [1440x900] Settings, Look (panel style, glass strength, font, text size).
- `50-settings-look-p.png` [390x844] Settings, Look (panel style, glass strength, font, text size).
- `51-settings-features-collapsed-d.png` [1440x900] Settings, Features with the three groups collapsed.
- `51-settings-features-collapsed-p.png` [390x844] Settings, Features with the three groups collapsed.
- `52-settings-features-open-d.png` [1440x1716] Settings, Features with all groups open (every switch).
- `52-settings-features-open-p.png` [390x3348] Settings, Features with all groups open (every switch).
- `53-settings-tabs-packs-d.png` [1440x7000] Settings, Tabs & Packs (tab order list, packs, block templates, Data modules dump, prompt budget). Capped at 7000 px tall.
- `53-settings-tabs-packs-p.png` [390x7000] Settings, Tabs & Packs (tab order list, packs, block templates, Data modules dump, prompt budget). Capped at 7000 px tall.
- `54-settings-modules-top-d.png` [1440x900] Settings, Modules, three module folds collapsed + Versions.
- `54-settings-modules-top-p.png` [390x844] Settings, Modules, three module folds collapsed + Versions.
- `55-settings-modules-story-director-d.png` [1440x1747] Modules, Story Director fold open (full height).
- `55-settings-modules-story-director-p.png` [390x2391] Modules, Story Director fold open (full height).
- `56-settings-modules-npc-state-delta-d.png` [1440x2511] Modules, NPC State Delta fold open (full height).
- `56-settings-modules-npc-state-delta-p.png` [390x3505] Modules, NPC State Delta fold open (full height).
- `57-settings-money-d.png` [1440x900] Settings, Money.
- `57-settings-money-p.png` [390x1229] Settings, Money.
- `58-settings-assist-d.png` [1440x1024] Settings, Assist.
- `58-settings-assist-p.png` [390x1850] Settings, Assist.
- `59-settings-blocks-d.png` [1440x900] Settings, Blocks.
- `59-settings-blocks-p.png` [390x1410] Settings, Blocks.
- `59b-settings-diagnostics-d.png` [1440x900] Settings, Diagnostics.
- `59b-settings-diagnostics-p.png` [390x844] Settings, Diagnostics.
- `60-rpg-home-d.png` [1440x900] RPG ON: Game view Home (hero header, tab bar now with Party and Fight).
- `60-rpg-home-p.png` [390x958] RPG ON: Game view Home (hero header, tab bar now with Party and Fight).
- `61-rpg-party-d.png` [1440x900] RPG ON: Party tab, a card per character (XP, health/mana/stamina stage bars, stats, buttons).
- `61-rpg-party-p.png` [390x1287] RPG ON: Party tab, a card per character (XP, health/mana/stamina stage bars, stats, buttons).
- `62-rpg-fight-d.png` [1440x1022] RPG ON: Fight tab during a battle (2 Sluice Rats, party bars, last exchange).
- `62-rpg-fight-p.png` [390x1478] RPG ON: Fight tab during a battle (2 Sluice Rats, party bars, last exchange).
- `63-rpg-inventory-d.png` [1440x900] RPG ON: Inventory.
- `63-rpg-inventory-p.png` [390x844] RPG ON: Inventory.
- `66-rpg-story-panel-d.png` [1440x1119] RPG ON: Story side sheet.
- `66-rpg-story-panel-p.png` [390x1176] RPG ON: Story side sheet.
- `71-chat-bar-d.png` [1440x900] RPG ON: chat bar and cards (collapsed).
- `71-chat-bar-p.png` [390x844] RPG ON: chat bar and cards (collapsed).
- `72-chat-card-changed-this-reply-open-d.png` [1440x900] RPG ON: Changed this reply open ("1 exchange rolled").
- `72-chat-card-changed-this-reply-open-p.png` [390x844] RPG ON: Changed this reply open ("1 exchange rolled").
- `73-chat-card-status-open-d.png` [1440x900] RPG ON: Status card open.
- `73-chat-card-status-open-p.png` [390x844] RPG ON: Status card open.
- `74-rpg-chat-battle-d.png` [1440x900] RPG ON: the battle log inside the reply after the [battle] marker.
- `74-rpg-chat-battle-p.png` [390x844] RPG ON: the battle log inside the reply after the [battle] marker.
- `81-chat-bar-d.png` [1440x900] Synthesized light ST theme: chat + bar.
- `81-chat-bar-p.png` [390x844] Synthesized light ST theme: chat + bar.
- `82-chat-card-changed-this-reply-open-d.png` [1440x900] Light: Changed this reply open.
- `82-chat-card-changed-this-reply-open-p.png` [390x844] Light: Changed this reply open.
- `83-chat-card-status-open-d.png` [1440x900] Light: Status open.
- `83-chat-card-status-open-p.png` [390x844] Light: Status open.
- `85-light-game-home-d.png` [1440x900] Light: Game view Home (leftover block tabs shown).
- `85-light-game-home-p.png` [390x958] Light: Game view Home (leftover block tabs shown).
- `86-light-game-inventory-d.png` [1440x900] Light: Inventory.
- `86-light-game-inventory-p.png` [390x844] Light: Inventory.
- `87-light-game-director-d.png` [1440x900] Light: Director.
- `87-light-game-director-p.png` [390x882] Light: Director.
- `88-light-settings-look-d.png` [1440x900] Light: Settings Look.
- `88-light-settings-look-p.png` [390x2117] Light: Settings Look.

## Containers (for CSS/DOM patching)
**Chat (all 01-03, 71-74):** bar `#story_suite_v2_bar.story-suite-bar` > `button.story-suite-bar-story | -game | -settings` + `div.story-suite-notice`.
Under each reply, inside `.mes_block`: `div.ss-cards` > `div.ss-card` (`.ss-card-open` when open) > `button.ss-card-head` (`i`, `span.ss-card-title`,
`span.ss-card-summary`, `i.ss-card-chevron`) + `div.ss-card-body`. Changed: body `div.chg` (chips). Status: body rows (Time, Weather, Place, Coordinates,
Wearing, Condition, Goal). Re-read warning bar sits above the cards on a reply without change lines. Status strip: `div.ss-hud` (parent `#form_sheld`,
inserted before `#send_form`), toggle `label.story-suite-hud-toggle`. Battle log in a reply: `div.rpg-battle.rpg-battle-inline`.
**Story panel (10, 11, 66):** `div#story_suite_v2_panel.story-suite-sheet` > `div.story-suite-sheet-head` (close `button.story-suite-sheet-close`),
`div.story-suite-sheet-body` > `div.story-suite-pane` > (first tab) `div.inv`, `nav.ss-screenbar.story-suite-sheet-bar` (`button.ss-screenbar-item.story-suite-tab`,
`.ss-screenbar-more`), `div.ss-screenbar-scrim`, `div.ss-screenbar-sheet` > `div.ss-screenbar-grid` > `button.ss-screenbar-tile`. Desktop: right-hand sheet 420 px;
phone: bottom sheet. First tab is Inventory.
**Game view (20-31, 6x):** `div.ss-gameview.ss-gameview-has-hero` (role dialog, fixed) > `div.ss-gameview-main` > `header.ss-gameview-bar`, `div.ss-gameview-hero`
(`section.ss-w-hero.ss-hero` > `.ss-hero-face | .ss-hero-main | .ss-hero-vitals`), `div.ss-gameview-body` (the scroller), `nav.ss-screenbar.ss-gameview-nav.ss-screenbar-row`
(`.ss-screenbar-item`, `.ss-screenbar-more` shown only when tabs overflow = phone), `div.ss-screenbar-sheet` (More menu).
- Home `div.home`: `ss-widget.rpg-start-slot`, `ss-widget.ready-slot`, `section.panel.scene` (`p.place`, `p.time`, `p.here`), `section.panel.purse`, `section.panel.quests`
  (`div.sb-cap`), `ss-widget.saves-slot > section.panel.saves`, `section.panel.mounts` (`ul.mount-list`, `p.mount-note`), `ss-widget.blocks-slot > div.ss-w-blocks-cards`.
- Inventory `div.inv` > `header.top` (`.wallet-and-add`, `.filter`), `div.groups > section.group`.
- Quests `div.sd-quests > section.ss-listcard.ss-glass > ul.sd-cards`.
- World `div.wv` > `header.wv-top` (`.wv-views` radios Now/Journal, `.wv-when`); Now `div.wv-now` > `section.wv-here | .wv-upcoming | .wv-news | .wv-factions` (`.sd-kind.ss-glass`);
  Journal `div.wv-journal` > `label.wv-find`, `ol.wv-days`.
- Map `div.atlas > ss-widget > div.sd-map.ss-glass`.
- Chronicle `div.ch` > `section.ch-events | .ch-factions` > `ul.ch-list`.
- Director `div.sd-director` > `header.sd-clock`, `ss-widget.sd-wide > section.sd-arc`, `section.sd-kind.ss-listcard` (Quests, Hooks), `ss-widget.sd-wide > div.sd-behind`
  (Reveal/Hide; revealed Clocks and Secrets are more `section.sd-kind`), `section.sd-problems-box > ol.sd-problems`.
- Dossiers `ss-widget > div.npc-state-delta-v2-cast-view > div.npc-state-delta-story-pane` x2 (list + detail); the open dossier is a separate full modal (NPC State Delta's own: title bar, Dossier/Map switch, Close).
- RPG Party `section.ss-w-rpg-party > div.rpg-main` (+ `div.rpg-sheet-host`), cards `.rpg-card`; Fight `section.ss-w-rpg-fight` > `.rpg-head`, `.rpg-foes`, `.rpg-fight-party`, `.rpg-fight-lasthead`, `.rpg-fight-last`.
**Settings window (50-59b):** `div.ss-settings` (fixed 896x624 on desktop, full screen on phone) > `button.ss-settings-close`, `div.ss-settings-side` (title, `div.ss-search`,
`div.ss-settings-rail > nav.ss-tabs > .ss-tabs-item`; a horizontal chip row on phone), `div.ss-settings-content` (scroller) > `section.ss-settings-page` x8 (Look, Features, Money, Assist,
Tabs & Packs, Blocks, Modules, Diagnostics; each `.ss-settings-page-head` + `div.ss-settings-pane > div.ss-form|.ss-features|.ss-tabspacks|.ss-blocks|.ss-modules|.ss-diagnostics`),
footer `button#story_suite_v2_footer.ss-settings-foot` ("What's sent each reply"). Features: `details.ss-features-group.ss-section-fold` x3 > `div.ss-features-grid` > `.ss-feature[data-feature]`
(`button.ss-switch[role=switch]`). Tabs & Packs: `ol.ss-tabrows > li.ss-tabrow[data-tab-id]` (up/down buttons + switch), then cards `.ss-packs-card`, `#ss-..-block-templates`, `.ss-dm-card` (Data modules), `#ss_prompt_card`.
Modules: `div.ss-modules > details.ss-module-card.ss-section-fold` x3 (NSD, Story Block, Story Director; each `.ss-module-description`, `button.ss-module-features`, `.ss-module-panel`, `.ss-module-form`,
nested `details`) + `section.ss-versions-card`.

## What looked crowded, duplicated or broken
Broken or clearly wrong
1. Director (27, 28): the 2-column card grid overlaps. The Hooks card is taller than its row and runs over the Behind-the-scenes box; after Reveal the Secrets card sits on top of Hooks. Phone 27-p/28-p stack but are very tall.
2. Dossier modal on phone (30-p): only ~310 px wide and not centred, the tab chips and Player relationship block are cut off or missing, the portrait overlays the header. Unusable at 390 px.
3. Status strip: `story-block.hud` is on but `div.ss-hud` is empty and hidden (height 0) in every state tried, RPG on or off. The feature switch promises "health, place..." and shows nothing.
4. RPG hero "vitals": `.ss-hero-vitals` and `.ss-hero-pools` exist but stay `hidden` with RPG on, so there is no bar row in the hero header (60-rpg-home); the bars only exist on Party and Fight.
5. Under replies there is no NPCs card: only "Changed this reply" and "Status". People appear as a chip inside Changed ("Fenna here now"). The brief's "NPCs card" does not exist in 2.11.3.
6. Game view is Glass by default: the chat shows through the panel and its text bleeds into Home, Director, Party (20, 27, 61 are hard to read where cards are thin). Cards have no opaque backing.
7. Light theme: the suite has no light style of its own. `theme.js` decides light/dark from ST's `--SmartThemeBodyColor` and `--SmartThemeBlurTintColor` (MutationObserver on the root). 8x shots use synthesized ST variables (no light ST theme ships with this ST), so they are approximate: the chat stays dark, the panel turns grey-glass with low contrast.
Crowded
- Phone Game view hero (20-p): time, place and weather are truncated ("CY 611, Goldwane 12, 1:...", "Bluewatch Vi...") and Wearing/Condition wrap onto 3 lines.
- Desktop tab bar with RPG off and leftover blocks (40-d): 15 tabs in one row. With RPG on and a fight, 10 tabs. Phone shows 4 + More, Map/Chronicle/Director/Dossiers hidden behind More (and Fight/Party reorder).
- Home on desktop is 5 equal cards in one row (Where, Purse and pack, Quests, Save points, Mounts); Save points is mostly an empty card; the quest card has an empty body below two lines.
- Settings: Tabs & Packs (53) is 7000+ px: tab order list, packs, then a Data modules card that dumps every field of every block, then the prompt budget. Modules (55, 56) nests folds three deep with hundreds of controls (arc planner prompt textarea, full calendar months list, scanner rules). Features (52) is 3 groups, 24 switches, each with 2 to 3 lines of help.
- Settings dialog on desktop is fixed 624 px tall, so every settings page except Look scrolls inside a small window.
Duplicated
- Place, time and weather appear five times: hero header, Home "Where" card, World Now "Here", Director clock line, Status card under replies.
- Quests appear on Home (Quests card), on the Quests tab, and on Director (Quests card). People present appear in Home "Here:", World "People here" and the Dossiers list.
- Hero header Wearing/Condition duplicate the Status card and the "Your look" fields. Inventory is a Story-panel tab and a Game view tab with the same content; the Story panel is effectively a second copy of the Game view tabs.
- With RPG off but RPG blocks in the chat, Character, Character 2, Character, Skills, Skills, Skills 2, Foes show as ordinary tabs in Game view and Tabs & Packs (shot 40, 53). Three entries are called "Character" and two "Skills"; the Tabs & Packs list cannot tell them apart. This comes from my test chat's accumulated blocks (earlier builds), but any chat that turns RPG off after play would look like this.
- Feature switches: "Status strip" and "Cards under replies" are separate switches, and each card also has its own on/off.
Other notes
- Fight is a tab that only exists while a fight is on (62); on phone it lives under More.
- The Suite button keeps its focus ring after the settings window closes (01-d, 71-d).
- Settings Features fold state is remembered between opens (the state in 51 vs 52 is forced by script).
- Test-only: the mock LLM answers NPC State Delta scans with a fixed JSON; Director "Problems" shows one "duplicate-add" from a repeated hook line (caused by my scripted reply, not a UI bug).
