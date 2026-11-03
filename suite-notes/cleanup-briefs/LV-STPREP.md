# LV-STPREP — prepare the real-SillyTavern check for 2.17.0 (no repo changes)

Rules: X-COMMON.md hard rules (secrets — never open any secrets.json, never the USER's ST data; PID files only; never
`pkill -f`/`pgrep -f`; never `playwright install`; never `rm -rf` copied data — copy into a NEW empty folder). If any
command is denied, stop that step and report it; never re-run it in another form.

Copy $S/u12 (st-data, config.yaml, run/) into a NEW folder $S/lvst/. Set ST port 8260 and mock port 8360, change
dataRoot/port and every path in config.yaml and run/*.mjs. Read $S/u12/run/{lib,c1,c2,c3,m3}.mjs to learn the harness
(mock LLM replies, RPG on via extensionSettings.storySuite.features['story-block.rpg']=true, Ersveil chat, char import
from run/char.json). Write $S/lvst/run/lv.mjs that, given an SB checkout path (argument), installs it into the copy's
extension folder the same way u12 does, starts ST (`cd /home/user/st-smoke/SillyTavern && node server.js --configPath
$S/lvst/config.yaml`, PID file) and the mock, then scripts these checks with mocked replies and prints PASS/FAIL each,
plus shots (1440 and 390) into $S/lvst/shots/:
1. New character → Party card pill "Lv 1 · Guild F" only after registering (before: "Lv 1"), XP row "0 / 100 to Lv 2".
2. An ambush with `level` foes → Fight card "Rank F · Lv 7", turn-order chips with levels, a battle log whose why lines
   show "level ÷ 5".
3. Win → "Astra +N XP" with N per the contract formula; a reply giving +130 XP at 80 → Lv +2 overflow kept, "+1 point"
   on the 3rd level; Changed-this-reply line.
4. Settings → RPG: one Level cap row, Practice per use, XP rate (50–300 step 25); set XP rate 200 → next win doubles.
5. Swipe, Re-read and reload: pills, XP and battle log identical.
6. RPG off chat: no lean-rpg module requested in the network log (lazy load).
7. Export the character to a file and import it: level kept.
Use the existing u12 reply text style for mocked narrator lines; foe lines `level:`/`rank:` per LV-CONTRACT.md.
Dry-run it against Story_block origin/main (2.16.10) so the harness itself works (most checks FAIL there — expected;
report which steps ran end to end). Stop ST and the mock when done (PID files; check ports closed).
Report: script path, dry-run result per step, anything the harness could not reach. Short.
