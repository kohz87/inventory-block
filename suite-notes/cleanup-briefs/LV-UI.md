# LV-UI — the approved Levels screens (Story Block 2.17.0)

Read LV-CONTRACT.md (all addenda) first. Approved mockup: https://claude.ai/artifact/JvTspAVmk45sneUMhAR7M2 (v2);
its shots are in $S/lvm/shots/ (`lv-after-*-{d,p}.png`) — build exactly that. Rules as in LV-CONTRACT.md (shared rules).
Base: Story_block origin/main cea0b4b. Branch `stage51/lv-ui`, clone $S/lvu/. The data/rules agents (LV-A character,
LV-B foes, LV-C ranks/XP/XP rate) are working in parallel and are not merged yet: code your views against the
contract's names (Character `level`/`xp`/`cap`, foe `level{n}`, `levelLabel(level, ranks, { playerRank })` in
src/v2/lean-rpg/levels.js, settings `rpgLevelCap`, `rpgPracticePerUse` (exists on main), `rpgXpRate`). If a function is
not on your base yet, add a minimal local shim with the same signature in a clearly marked spot and say so — the lead
merges and removes shims. Keep view changes in view files (src/v2/lean-rpg/view/*, settings view, the Party/Fight
cards, battle log, New character window, strings); do not edit resolve.js, precall.js, open.js, fight.js, templates.js.

## Screens (as the mockup)
1. Party card: pill on the name row, right, `ss-pill` at 12px/20px: "Lv 14 · Guild F" (playerRank) | "Lv 14". XP row
   "24 / 100 to Lv 15"; the hero XP line the same.
2. Fight card: foe pill "Rank F · Lv 7" inline right of the foe name; help "Foe Health grows with level. A hit takes 1
   block, a Decisive hit 2."; turn-order chips "Astra (Lv 14)" / "Mud-Scale Crawlers (Lv 7)"; note "(d20 + level ÷ 5 +
   AGI/2; foes the same with their own level)".
3. Battle log: turn order with levels; Status "Mud-Scale Crawlers ×6 · Rank F · Lv 7: Down"; the per-roll why lines show
   the level ÷ 5 term (the mock left "Class II 4" unpatched — do it).
4. Changed this reply: "Astra reached Lv 15 (+1 point to spend)" (the +1 only when a point is given).
5. Settings → RPG: card "Levels and practice": Level cap (1–99), Practice per skill use (1–5, move it here from the
   Rolls card), **XP rate** (50–300 %, step 25, default 100 — added after the mockup, same row style); roll table text
   "level ÷ 5"; tiles: points "1 per 3 levels", foe base "4 + level ÷ 30".
6. New character window: "Starting level" (default 1), header "Lv 1", import text says level.
Phone 390 and desktop 1440 both; no horizontal scroll; light/dark tokens as the app's.

## Tests
View tests for each screen's text and pill class; settings rows and ranges; New character default; a story with no
ranks/playerRank. Report: branch + head, shims left, tests, pinned changes, counts. Short.
