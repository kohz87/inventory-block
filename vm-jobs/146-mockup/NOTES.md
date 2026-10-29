# Mockups: edit in place, custom blocks (no repo changes, nothing committed or pushed)

Open `index.html`. The pictures are in `shots/` (desktop `-d` is 1280x900, phone `-p` is 390x844).

## How they were made
- Private SillyTavern 1.19.0 on port 8154 (`live/config.yaml`, `--configPath`), data root `st-data/`: a copy of /home/user/st-smoke/data without
  `secrets.json`, backups, chats, caches. The shared smoke config and data were only read, never changed.
- Extensions in the copy: fresh clones of Story_block (main, 2.6.0, 74ff72d) and Story_director (main, 2.2.0, 1b763cb). No rpg_battle.
- Mock model on port 5005 (`scripts/mock.mjs`, replies in `scripts/script.json`; same mock as the textsize smoke).
- The Ersveil open-world pack (2.0.0, examples/packs/ersveil/pack.json) was imported through Settings, Tabs & Packs, Import pack file (`scripts/step1.mjs`).
- `scripts/step2.mjs`: new chat, enable the three Ersveil data modules (Settings, Tabs & Packs, Enable for this chat, then confirm), then four scripted turns:
  Bedroll and Torch x2, register at the Guild (Standing, Guild membership), walk to Bluewatch Village (Coil of Rope), barge-crew rescue (fame, coin).
  Resulting state: Bedroll, Coil of Rope, Torch x2; purse 3 silver 8 copper (38 copper); Bluewatch Village; cold drizzle, low fog; Standing Adventurer Guild 2.
- Shots: `scripts/mk-inv.mjs` (01), `mk-home.mjs` (02, 03), `mk-dm.mjs` (04), `mk-card.mjs` (05, 09), `mk-blocks.mjs` (06 to 08). Each opens the real
  screen with Playwright, injects static DOM, takes the picture, then puts the screen back. Helpers in `mk-common.mjs` and `lib.mjs`.
  Run order from scratch: start ST and the mock, `step1`, `step2`, then the `mk-*` scripts with `d` or `p`.
- Look: only layout CSS is injected (`MOCK_CSS` in mk-common.mjs). Buttons, inputs, selects, chips, pills, icon buttons, glass cards and icons are the app's own
  classes (`ss-button`, `ss-button-primary`, `ss-button-danger`, `ss-input`, `ss-select`, `ss-chip`, `ss-pill`, `ss-iconbutton`, `ss-glass`, `ss-section-label`, Phosphor icons from the app's icon set).

## Choices and where the mock departs from the app
- Pencil = the app's `ss-iconbutton` shrunk to 28px with no border, so it stays quiet until hovered.
- "+ Add item" sits in the Inventory header, right after the purse, so it is above the list and does not push the list down.
- Purse and Where edits are on Home (that is where the wallet line "3 silver 8 copper" and the place/time/weather live in the Game view). The Inventory header's purse has a pencil too.
- Standing is in the Story panel under More (the pack does not put the data-module tabs in the Game view), so shot 4 is the Story panel.
  The Fame tab shows only dashes for the current state, so Standing was used.
- Standing value shown is the real one, Adventurer Guild 2, so the Changed card says "Standing (Adventurer Guild) 2 -> 5" rather than "0 -> 5"
  (the request's "(Guild) 0 -> 5" example). Torch is really 2 (edited to 3); the purse is really 38 copper (edited to 50).
- In the Changed card, the "You set" lines are drawn full width (the real tiles cut long text to two lines). The real card is a grid of small tiles.
- Custom blocks: a new "Blocks" tab in the Game view (8th item after Director on desktop; on a phone it is under More, so More shows as current).
  Reason: the form and the cards need the full width and the height; Home's three small tiles would cramp them.
- Shot 7 pictures are taller than the usual window (desktop 1280x1150, phone 390x1500) so the whole form shows in one picture.
- Extra pictures beyond the list: 01c (empty Add item form), 06 phone, 08b (the "..." menu open; 08 has it closed so every pencil shows).
- Shot 3's first half (pencils on place, weather, time) is the same picture as 02a.

## Section 3 (added later): own tabs and functions (shots 10 to 13)
- Same private ST (port 8154) and mock (5005) restarted from the same data copy and chat; both stopped again by PID at the end. Scripts: `mk-tabs.mjs` (10), `mk-tabs2.mjs` (11, 12), `mk-card2.mjs` (13).
- 10: Notes and Skills items are clones of the Director tab item with the app's own Phosphor icons (bookmark, lightning). The Notes page buttons (Rest, Steady breath) are plain `ss-button`s.
  On a phone the tabs are added to the More sheet (opened in 10b); the Notes page (10a-p) shows More as the current item.
- 11: "Show as" is three `ss-chip`s (Own tab lit); icon picker is a row of `ss-iconbutton`s with one lit. Function cards are bordered boxes with `ss-pill` kind tag, selects and number inputs.
  Fields are folded to single lines to save height. The desktop picture is 1280x1700 and the phone one 390x2150 (the game window's height cap was lifted for the capture, so it reads as one picture).
- 12: the chooser and the menu are drawn as popups under the button (same look as the earlier "..." menu). Template names and counts (Wessel's Notes 4 fields, 2 buttons, 1 rule, 1 timer; Survival 3 fields, 1 timer) are made up.
- 13: lines drawn full width, as in shot 5. Example A uses the last reply; B shows the story moving Fatigue 8 to 10 and the rule line after it.
- Unchanged from before: nothing here is interactive, drop-downs are drawn closed, and the block, button and rule names are the mock's own wording.

## Things seen in the real app (not changed)
- On a phone the Story panel (Standing, Fame, Guild tabs) is a see-through sheet over the chat, so its small text is hard to read (see 04a/04b phone).
- The Changed card's wallet tile shows a doubled coin icon in the real app (visible under "Wallet: now ..." in the unedited tile).
- The Fame screen shows dashes for all regions after the scripted rescue (the `dm fame` line was applied but no value shows); not investigated.

## Not captured
- Nothing from the list was skipped. Nothing is interactive: the pencils, Save buttons and menus do nothing.
- The select drop-downs (Type) are drawn closed; headless screenshots do not draw their popup.

## Processes
SillyTavern (PID in `live/st.pid`) and the mock (`live/mock.pid`) were stopped by PID at the end of each round; no pkill/pgrep patterns used.
