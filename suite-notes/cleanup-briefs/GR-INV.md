# GR-INV — Gear, inventory side (Story Block 2.18.0 part 1; runs in parallel with the levels agents)

USER 3 Nov: gear in fights after levels; one toggle for gear (bonuses + wear + encumbrance); rarity is the classic
common / uncommon / rare / epic / legendary (already `RARITIES` in src/v2/domains/inventory.js). Plan A: stats stay
1–20, the level term is floor(level/5), so gear bonuses stay small.

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone in $S/gri/, push
only your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never
deleted, never weaken/skip/delete a test — pinned changes named, a test per change run after it, `npm run check` +
full `npm test` + `git diff --check` green before push, PID files only, never `pkill -f`/`pgrep -f`, never
`playwright install`). If any command is denied, stop that step and report it; never re-run it in another form.
No real-ST check. NO UI changes (no new rows/cards/layout; strings in existing receipt/summary text are fine).
NOT in scope (the levels agents are changing these files now): src/v2/lean-rpg/resolve.js, precall.js, open.js,
fight.js, formula.js, standard.js — the roll wiring comes later in part 2. Base: Story_block origin/main cea0b4b.
Branch `stage52/gear-inventory`. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

## Build
1. **Feature `story-block.gear` ("Gear in fights")**, off by default, one toggle (features list like the others).
2. **Item combat fields** on defs (validated in inventory.js def checks, packs/validate for pack items): `slot`
   (`weapon` | `armour` | `shield` | `bag`), optional `carry` (exists), and derived numbers — never typed by the
   narrator: `gearBonus(def)` = by rarity common 0, uncommon 1, rare 2, epic 3, legendary 4 (constants `GEAR` in a new
   src/v2/domains/gear.js); a pack item may override with an explicit `bonus` 0..6 (Studio/pack only).
   Query `inventory.gear` (`{ owner }` → `{ on, weapon: { name, bonus, cond, broken }, armour: {…}, shield: {…},
   carry: { load, capacity, encumbered, penalty } }`) — the API part 2 will read for rolls.
3. **Generated items get numbers**: an `item.define` hook (exists, unused) fills `slot` from the line's `kind:`
   (weapon/armour/shield/bag) or the name (sword, axe, bow, dagger, spear, staff → weapon; mail, leather, plate,
   cuirass, robe → armour; shield, buckler → shield; pack, satchel, bag → bag; else none) and `rarity` from the line's
   `rarity:`/`quality:` word (crude/common → common, fine → uncommon … map the five words + synonyms), default common.
   Numbers on the line are ignored. Legendary only when the line also names a quest/boss reason? — keep simple: any
   rarity word is accepted, held to at most `epic` unless the item comes from a pack or a quest reward receipt; note it.
4. **Carry capacity answers `items.carry`** (today nothing does, so encumbrance never fires): capacity per member =
   `10 + 2 × STR` (Standard/Classic STR 1–20; constant) + equipped bags' `carry`; load = item count by qty (weights are
   not modelled: 1 per item unit, coins free) — say if a `weight` field already exists and use it. Only while the gear
   feature is on (off → no answer, today's behaviour exactly). The existing encumbrance path then fires (−2 AGI/DEX).
5. **Wear API** for part 2: `gear.wear(owner, slot, step)` command (cause system) using the existing condLog events
   (`wear: scuff|tear|ruin` exists — reuse), and `broken` when cond ≤ 0 (broken gear gives no bonus).
6. Docs: docs/v2/SPEC.md inventory section + a short docs/v2/GEAR.md.

## Tests
Bonus by rarity and override; slot from kind/name; rarity words; numbers ignored; legendary held; carry capacity and
encumbrance firing only with the feature on (off: byte-identical prompts/receipts vs main); wear → broken → bonus 0;
replay equality (swipe, Re-read, delete, rebuild, reload).

## Report
Branch + head; what changed; tests; pinned changes; counts; open questions. Short.
