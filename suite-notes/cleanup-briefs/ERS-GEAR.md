# ERS-GEAR — Ersveil signature items (Ersveil 2.6.0 with Story Block 2.18.0; USER approved 3 Nov)

Rules: X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/ersg/, push only your branch,
never merge/PR/force/tag, no Story Block version bump, never weaken/skip/delete a test — pinned changes named,
`npm run check` + full `npm test` + `git diff --check` green before push; b1r2-capture timing tests fail under load —
re-run alone once and report). Never pgrep -f / pkill -f. If any command is denied, stop that step and report it;
never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage52/gear-inventory (2251cf3). Branch `stage56/ersveil-gear`. Edit ONLY
examples/packs/ersveil/pack.json `content.items` (add the list; leave cast entries alone — another agent is changing
cast levels and another adds the cast `gear` field), the zip (rebuild the repo's way; the lead regenerates it at merge),
docs/v2/ERSVEIL.md (a short "Signature gear" table), and Ersveil tests. Read src/v2/domains/gear.js, inventory.js def
checks and packs/validate.js for the exact item field names (slot, rarity, stats, kind equipment, value, about/look).

Items (name | owner (for the about text and a slug) | slot | rarity | stats):
Long Watch Great Axe | Harrak | weapon | legendary | STR +2, VIT +2
White-Fur Watch Cloak | Harrak | cloak | rare | VIT +2
Carved Beacon-Horn | Harrak | accessory | uncommon | CHA +1
Rain-Veil Hood | Hush | cloak | epic | AGI +2, LUK +1
Cell-Runner's Knives | Nysseth | weapon | epic | DEX +2, AGI +1
Rune-Collar Hammer | Ysmeth | weapon | rare | STR +1, INT +1
Iron Guard Plate | Sir Lothar | body | rare | VIT +2
Iron Guard Longsword | Sir Lothar | weapon | rare | STR +1, DEX +1
Gold-Thread Hooded Cloak | Asphodel | cloak | rare | CHA +1, AGI +1
Rune-Marked Dwarf Axe | Gorm Kettlebright | weapon | rare | STR +1, VIT +1
Atlantean Breathing Sheath | Nerissa | accessory | rare | VIT +1, AGI +1
Huge Spiked Club | Torka | weapon | uncommon | STR +1
Fang Charm | Torka | accessory | common | (none)
Startrace Travelling Coat | Rika | body | uncommon | INT +1
Three Walnut Shells | Barney Thimblewick | accessory | uncommon | LUK +1
Flame-Cross Pendant | Sister Temiwa | accessory | uncommon | CHA +1
Write a one-line about for each from the owner's cast look text (no new lore facts). Value: sensible by rarity, in the
pack currency. If the validator's stat budget or a field disagrees with this table, stop and report — do not change
the numbers. Tests: the pack validates; each item's slot/rarity/stats as above; budget respected.
Report: branch + head, field names used, tests, counts. Short.
