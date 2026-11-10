# GRM — mockup: Gear in fights (USER 3 Nov; for Story Block 2.18.0 and Story Studio)

Mockup only: no repo changes, no pushes. Rules: cleanup-briefs/X-COMMON.md hard rules (secrets, user data, PID files,
never `pkill -f`/`pgrep -f`, never `playwright install`, never `rm -rf` on copied data — copy into a new empty folder).
If any command is denied, stop that step and report it; never re-run it in another form.

## Setup
Copy $S/u12 into a NEW folder $S/grm/ (st-data, config.yaml, run/). ST port 8290, mock 8390; change dataRoot/port
and all paths. ST: `cd /home/user/st-smoke/SillyTavern && node server.js --configPath $S/grm/config.yaml` (PID file).
Reuse $S/u12/run/m3.mjs (RPG on, Ersveil chat, character import, an ambush with a battle log, Game view tabs).
Give Astra a few items first with a reply: `+ item Cane Sword | kind: weapon | rarity: rare`, `+ item Boiled Leather
Jerkin | kind: armour`, `+ item Travel Pack | kind: bag`, and equip them if the Inventory supports it.
Story Studio: clone https://github.com/kohz87/Story_studio (main) into $S/grm/studio; open dist/story-studio.html in
Playwright (file://), open examples/packs/ersveil (or its zip) and go to Items.
Shots desktop 1440×900 + phone 390×844 into $S/grm/shots/: before-* and after-* (patched DOM using the apps' own
classes; inline CSS only where needed).

## What "after" shows
One toggle **Gear in fights** (Settings features list): gear bonuses + wear + encumbrance together. Rarity is common /
uncommon / rare / epic / legendary → bonus +0 / +1 / +2 / +3 / +4.
1. **Inventory tab**: equipped rows show slot (weapon/armour/shield/bag), a rarity colour on the name (common grey,
   uncommon green, rare blue, epic purple, legendary orange), the bonus ("+2 attack", "+1 defense", "+6 carry"), and a
   small condition word/bar ("Worn", "Broken — no bonus").
2. **Encumbered**: the carry line "Carry 18 / 34" on the Party card; over the limit "Encumbered: AGI and DEX −2".
3. **Battle log**: the roll line shows gear ("Astra uses Iaijutsu (Cane Sword +2) …"); a wear line after a decisive
   hit taken ("Boiled Leather Jerkin is worn (Torn)").
4. **Party card**: an "Equipped" mini-row (weapon · armour · shield) with bonuses.
5. **Story Studio → Items**: the item form gains Slot (select), Rarity (select, the five), optional Bonus override
   (0–6, "leave empty to use the rarity"), Carry (exists?).
Show the feature OFF state too (Inventory as today).

## Deliver
$S/grm/mockup.html: one self-contained page (shots as data URIs), Today / Proposed pairs per screen, desktop and phone,
short "what changes" per screen; title "Gear in Fights". Theme tokens for light/dark, 16px gutter, no horizontal
scroll (pattern: $S/u12/mockup.html). Stop ST and the mock at the end.
Report: shots, HTML path, what you could not show, open questions. Short.
