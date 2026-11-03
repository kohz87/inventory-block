# LV — Levels release (Story Block 2.17.0): shared contract for every LV agent

USER decisions (3 Nov): Soul Class I–IX is replaced by **Level 1–99** (no compatibility mode needed: the USER restarts;
stored data is never deleted, old chats keep their stored blocks and old rolls replay as recorded). 100 XP per level.
A level cap per story (default 99). Ranks are an optional pack table naming level bands (Ersveil F 1–9 … SSS 80–99).
Level drives the dice. Foes have a level, rolled inside a band. Fight XP follows the level gap. The RPG stays inside
Story Block (toggle). Fold in: slimmer stored rolls; RPG code loaded only when the feature is on.
UI (Party/Fight cards, battle log, settings rows, New character window) waits for the approved mockup — agents here
change data, rules, numbers and strings that existing views already print, NOT layouts.

## Names everyone codes against (do not rename)
- Character block (Standard and Classic templates, `src/v2/lean-rpg/templates.js`):
  `level` int 1..99 (label "Level", default 1), `xp` int 0..100 (label "XP"), `cap` int 1..99 (label "Level cap",
  default from the pack's `rpg.levelCap`, else the setting `rpgLevelCap`, else 99), `points` as today.
  Rule `level-up`: when xp ≥ 100 and level < cap → level +1, xp −100; when the new level is a multiple of 3 → points +1
  (`LEVEL.pointEvery = 3`). At level == cap xp holds at 100. No Soul Class field in new templates.
- Setting `rpgLevelCap` (Settings → RPG, int 1–99, default 99) — the row itself is UI: add the setting + schema; the
  view may show it with the existing int field type only.
- Roll term: `levelBonus(level, divisor) = Math.floor(level / divisor)`, `divisor` default 5 (`LEVEL.divisor`,
  Custom 3–8). It replaces `soulMul × Soul Class` on both formulas and on foes. Constants in `names.js` → `LEVEL`.
- Foe slot (Foes block): `level{n}` int 1..99 replaces `class{n}` in new templates. Standard Health blocks:
  `4 + Math.floor(level / 30)`. A foe line / planner line / narrator set-slot may give `level: N` or `rank: <name>`;
  `rank` → a seeded random level inside that rank's band; neither → seeded random within ±2 of the party's average
  level (held 1..99). Seed from the reply's dice source so swipe re-rolls and Re-read keeps it.
- Ranks: pack field `rpg.ranks: [{ name, from, to }]` (contiguous, ascending, covering 1..99 or a prefix, names ≤ 12
  chars, ≤ 20 entries) validated in packs/validate.js; query `rpg.rank` (`{ level }` → `{ name } | null`); helper
  `levelLabel(level, ranks)` → "Rank E · Lv 14" or "Lv 14" (in `src/v2/lean-rpg/levels.js`, new file, owned by LV-C).
- Fight XP (`fight.js`), per member per foe group: `base = count × Math.max(1, Math.ceil(foeLevel / 10)) × 2`,
  × `clamp(1 + 0.1 × (foeLevel − memberLevel), 0, 2)`; summed, floored; 0 → no XP, no line; else held to 1..60.
- Roll records gain `lv: 1` (version mark, like `flow: 2`); a record without it replays exactly as before.

## Shared rules (all LV agents)
cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone in $S/<letter>/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never deleted,
never weaken/skip/delete a test — pinned assertions/fixtures changed on purpose are named, a test per change run after
it, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only, never `pkill -f` /
`pgrep -f`, never `playwright install`). If any command is denied, stop that step and report it; never re-run it in
another form. No real-ST check (the lead runs it). Base: Story_block origin/main cea0b4b (2.16.10). Commit messages
end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu
Stay inside your files where you can; where you must touch a shared file (templates.js, resolve.js, names.js), keep the
edit small and say so in the report — the lead merges the branches. Report: branch + head, what changed, tests added,
pinned changes on purpose, counts, open questions. Short.

## Addendum (USER 3 Nov): player rank vs foe rank
- Foes (and any character with no player-rank source) show the level band: "Rank F · Lv 7".
- A pack may name a data-module field as the party's rank: `rpg.playerRank: { module: "<block slug>", field:
  "<field>", label: "<word>" }` (Ersveil: `{ module: "guild-membership", field: "letter", label: "Guild" }`). Party
  members then show "Lv 14 · Guild F" (the field's current value; "Lv 14" alone when the block is not pinned/empty).
  `levelLabel(level, ranks, { playerRank })` handles both; validated in packs/validate.js (owned by LV-C).

## Addendum 2 (USER 3 Nov): mockup approved (https://claude.ai/artifact/JvTspAVmk45sneUMhAR7M2 v2) + numbers
- Stat points +1 every 3 levels; foe Health 4 + floor(level/30) blocks; foe turn-order roll d20 + floor(level/5)
  (+ the same AGI/2 term where foes have none: 0), the party's d20 + floor(level/5) + AGI/2.
- **XP rate** setting `rpgXpRate` (Settings → RPG, "Levels and practice" card): 50–300 %, step 25, default 100. Every
  XP gain to a character (code's fight XP and the narrator's XP lines) is multiplied, floored, at least 1 when the gain
  was ≥ 1. Recorded per reply (like `practice`) so a later change never moves past replies. Owned by LV-C.
