# GR-UI — gear screens (Story Block 2.18.0; USER approved mockup round 6 on 3 Nov)

Approved mockup: https://claude.ai/artifact/DE52d6FCt7Zijwn1R1wKqc (v6). Local copy and its notes:
$S/grm/mockup.html; shots $S/grm/shots/after-{settings-on,settings-off,inventory,inventory-heavy,inventory-enc,
inventory-cats,party,party-encumbered,gearcard,gearcard-enc,gearcard-broken}-{d,p}.png. Build exactly that, with ONE
change the USER asked for at approval: on phone (390) the "+ Add item" button must be the same slim pill as on desktop
(one line, ss-pill height, not a tall block) — it currently wraps into a big square on phone.

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/gru/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a
test — pinned changes named, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only,
never `pkill -f`/`pgrep -f`, never `playwright install`; Chromium /opt/pw-browsers/chromium). If any command is
denied, stop that step and report it; never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage52/gear-inventory (2251cf3: gear.js, stat bonuses, carry, condition, repair,
item.equip, inventory.gear/statBonus). Branch `stage55/gear-ui`. The levels release is being merged in parallel and
edits the Party card, the Settings → RPG view and the battle log: keep your edits in those shared view files small
and self-contained (new helpers in new files where you can) so the lead's merge is easy. NOT in scope: roll files
(resolve.js, precall.js, open.js, fight.js, formula.js, standard.js), battle-log gear lines (part 2b), Story Studio.

## Screens (only when the `story-block.gear` feature is on; off = today's screens byte-identical)
1. Settings → RPG: the "Gear in fights" toggle row, as the mockup.
2. Inventory tab: CARRY section first, its content inside a row-style card (li.item.ss-glass, one-column grid) —
   "58 / 74 · state", full-width bar, breakdown; colours: normal < 80 %, yellow "Heavy load" 80–99 %, red
   "Encumbered: AGI and DEX −2" ≥ 100 %. Then sections EQUIPMENT, CONSUMABLES, GOODS, QUEST ITEMS with the heading
   style and spacing as the mockup. Rows: rarity colour on the name, rarity word, slot chip, "Equipped · Astra" chip,
   stat bonus ("+2 DEX"), condition bar + word (Good/Worn/Torn/Broken — "no bonus" when broken). Filters as the
   mockup. Slim "+ Add item".
3. Party card: an Inventory button so the card's buttons are 4 in one row (desktop and phone). It opens the slot card:
   only the 8 equal slot tiles (Head, Body, Cloak, Feet, Weapon, Off-hand, Accessory 1, Accessory 2), each with a 3px
   bottom condition line; no carry on this card.
4. Item Edit: Slot select (the 8 slots, or none) and "Equipped by" (party member or none) → item.equip; the bag is not
   a slot (carry only).
Phone 390 and desktop 1440; no horizontal scroll; light/dark tokens as the app's.

## Tests
View tests per screen (text, classes, the 80/100 % colour bands, broken → no bonus, equipped chip owner, 4 buttons,
8 tiles), feature-off byte-identical render, Edit → item.equip round trip with replay (Re-read, rebuild, reload).
Shots of your build at 1440 and 390 into $S/gru/shots/ via a private ST copy (copy $S/u12 into a NEW folder $S/gru/st,
ports 8250/8350, PID files) so the lead can compare with the mockup; stop ST when done.

## Report
Branch + head; what changed; tests; pinned changes; shot paths; counts. Short.
