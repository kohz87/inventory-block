# GR-ST — real-SillyTavern check for the gear release (no repo changes)

Rules: X-COMMON.md hard rules (secrets — never open any secrets.json, never the USER's ST data; PID files only; never
pgrep -f/pkill -f; never `playwright install`; never rm -rf copied data — copy into a NEW empty folder). If any command
is denied, stop that step and report it; never re-run it in another form.

Copy $S/lvst (st-data, config.yaml, run/) into a NEW folder $S/grst/; ports ST 8270, mock 8370 (change dataRoot/port
and every path). Read run/lv.mjs (its reload reopens the chat by id; narrator XP grammar `+ dm character — why | kind:
add-xp | amount: N`). Checkout under test: make a worktree of $S/rel37/Story_block at origin/stage57/gear-int into
$S/grst/sb-gear (read-only). Import the checkout's examples/packs/ersveil.zip through the app's pack import (Settings →
Tabs & Packs) so the 2.5.0 pack with items and cast gear is installed; enable RPG and "Gear in fights" (Settings → RPG).
Write $S/grst/run/gr.mjs and run it; PASS/FAIL per check with detail, shots 1440 + 390 into $S/grst/shots/:
1. Gear OFF: Inventory tab and Party card look like 2.17.0 (no CARRY section, 3 card buttons); a fight's battle log
   has no gear words.
2. Gear ON: give items with narrator lines (read the gear grammar in the checkout's prompt — `+ item … | kind: weapon |
   rarity: rare | DEX: +2 | equipped: weapon`), Inventory shows CARRY first, sections, chips "Equipped · Astra",
   condition; Party card 4 equal buttons; Inventory button → 8 tiles.
3. A fight: the roll line names the gear "(… +2 DEX)"; a decisive hit taken → a wear line and the item's condition steps
   down; swipe the reply → the condition is back; Re-read and reload identical.
4. Encumbrance: carry exactly at capacity → red "Encumbered: AGI and DEX −2"; one below → yellow at ≥ 80 %.
5. Signature gear: a `+ party` join of Harrak (read the join grammar) → his three items arrive equipped on him; the
   NPC's gear line is in the prompt before he joins (check the prompt the mock received — prompts.jsonl) and gone after.
6. Gear on, RPG off → no gear words anywhere in the prompt.
Report each check, shot paths, and for any FAIL whether it is the harness or Story Block (with evidence). Stop ST and
the mock (PID files; ports closed). Short.
