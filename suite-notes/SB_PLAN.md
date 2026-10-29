# Story Block — consolidated work plan (29 Oct)

Base: Story Block main 74ff72d (2.6.0). Only Story Block work is listed; changes other extensions need are noted as "outside SB".
Every UI change gets a mockup approved first; every release gets a Codex review before its PR.

## P0 — Done: 2.6.1 loot-undo fix (merged, main d5fdb46)
A loot take goes away with the reply that offered it (delete, edit + Re-read, swipe), live = rebuild = reload.
- `src/v2/domains/inventory.js` — `? loot` offer is a reply-bound guarded block; `lootTake` attaches a `loot.take` guard;
  `lootTakeGuard` matches names with the inventory's own `resolveDef` (plural, case, portion words, word order).
- `src/v2/domains/index.js` — core guard dispatcher routes `loot.offer` / `loot.take`.
- `src/v2/store.js` — `carriedTo` replays deleted leading replies whole, past checkpoints.
- `src/v2/runtime.js`, `src/v2/packs/validate.js`, manifest/package — version 2.6.1.
- Docs: SPEC §2.2/§7, REPLAY.md "Loot take guards", CHANGELOG. Tests: `tests/v2/loot-undo.test.js` (38), QA oracle.
- Status: Codex 145 HOLDS; kohz87/Story_block#221 merged 29 Oct 03:15 UTC → main d5fdb46.
- Outside SB afterwards: vendored copies re-synced — SD#142, Studio#16, NSD#223 (merge on green).

## P1 — Small fixes (~½ day; can ride with P2)
| Fix | File(s) |
|---|---|
| Doubled coin icon on the purse tile in "Changed this reply" | `src/v2/screens/changes-card.js` |
| Phone Story panel sheet is see-through, small text hard to read | `src/v2/view/mounts.css` (sheet background), `src/v2/view/theme.js` (token) |
| Authored `<mark role="button">` (and similar) can stay under 44 px on phones | `src/v2/view/size.css` |
| Studio-made standalone layouts never become host tabs (registers only pack and data-module screens) | `src/v2/ui-host.js` (~line 237), `src/v2/view/tab-order.js` — done inside P3 |
| 3-second capture timing tests flaky on slow machines (decide: keep, or widen with a measured baseline) | `tests/v2/break/b1r2-capture*.test.js` |

## P2 — Inline editing of everything that's already there (mockup sections 1; ~1.5–2 days incl. reviews)
A pencil on every value; tap → inline form → Save; saved on the latest reply (a swipe/delete takes it back);
shown in "Changed this reply" as "You set: …".
| Part | File(s) |
|---|---|
| Inventory: edit name / count / note, add item, remove | `src/v2/domains/inventory.js` (reader commands), `src/v2/screens/inventory.js` |
| Purse: set amount (recorded as an adjustment) | `src/v2/domains/money.js`, `src/v2/screens/home.js`, `src/v2/screens/inventory.js` |
| Scene: place, weather, who's present | `src/v2/domains/scene.js`, `src/v2/screens/home.js`, `src/v2/screens/scene.js` |
| Data-module fields: a generic "set" for every field | `src/v2/data-modules/interpreter.js`, `part.js`, `schema.js`, `check.js` |
| Free-text values (text labels up to 240 chars) for the AI and the reader | `src/v2/data-modules/schema.js`, `check.js`, `grammar.js` |
| Editable value widget used by all screens | new `src/v2/view/widgets/editable.js`, `src/v2/view/widgets/index.js`, `src/v2/view/render-screen.js` |
| "You set …" lines + hint in the reply card | `src/v2/screens/changes-card.js`, `src/v2/reply-cards.js` |
| Words | `src/v2/strings.js` |
| Docs / tests | `docs/v2/SPEC.md`, `DATA_MODULES.md`, `REPLAY.md`, `GUIDE.md`; `tests/v2/...` |
- Outside SB: Story Director's clock (date/time edit) is SD's — a separate small SD change.

## P3 — Custom blocks made in the chat (mockup sections 2–3; ~2.5–3 days incl. reviews)
Megumin-style blocks with no pack: own fields, own prompt text ("What it is for"), own functions, own tab and/or card,
stored in the chat, reusable as a template or exported as a pack. Limits from data modules v1: 8 blocks per chat,
32 fields, prompt text ≤ 2000 chars, values ≤ 100 tokens per reply.
| Part | File(s) |
|---|---|
| Chat-scoped block definitions (pinned with the chat, same validator) | `src/v2/data-modules/setup.js`, `part.js`, `schema.js`, `check.js` |
| Functions → existing machinery: Button = UI kind, Rule = rules, Timer = timers | `src/v2/data-modules/interpreter.js` (no new engine) |
| Prompt text per block + current values | `src/v2/data-modules/part.js` (static + tail) |
| Show as own tab / card / both (also fixes the Studio-tab follow-up) | `src/v2/ui-host.js`, `src/v2/view/tab-order.js`, `src/v2/view/mounts/` |
| Blocks tab, block editor (fields, Show as, Functions), New block chooser | new `src/v2/screens/blocks.js`, `src/v2/view/form/`, `src/v2/strings.js` |
| Save as template / Export as pack | `src/v2/packs/index.js`, `src/v2/view/settings/tabs-packs.js` |
| Docs / tests | `docs/v2/DATA_MODULES.md`, `GUIDE.md`, `SPEC.md`; `tests/v2/...` |
- P2 + P3 built in one go, in layers (P2 first), one review cycle: ~4–5 days. If P3 stalls, P2 ships alone.

## P4 — Trim: load rarely used parts only when first opened (~½–1 day)
- Pack checker / importer, Diagnostics page, UI sample: switch to dynamic `import()` at first use.
- File(s): `src/v2/host-ui.js`, `src/v2/ui-host.js`, `src/v2/view/settings/diagnostics-page.js`, `src/v2/screens/ui-sample.js`,
  `src/v2/packs/index.js`. Measure startup files/size before and after.

## P5 — Lean RPG on top of P2/P3 (later; spec: scratchpad/spec-rpg/SPEC.md; ~6 days)
- Character / Skills / Combat as pack data modules (words for health/mana/stamina, stats 1–20, Soul Class + XP,
  skills with ranks, foe slots, Down + death rule, the combat prompt).
- New code: confirm cards (class/rank up), pre-call (`src/v2/assist/`), opposed rolls (`dm.resolve`),
  several exchanges per reply, inline battle log (`src/v2/reply-notes.js` + view), death end card.
- Open decisions: A — combat code in SB core or an optional module; B — long or short narrator lines;
  roll trigger — Roll button or AI pre-call.

## P6 — UI redesign (waiting on a direction)
- CSS-only reskin (~2–4 days): `src/v2/view/theme.js`, `glass.css`, `mounts.css`, `controls.css`, `host.css`.
- Full redesign (~1–2 weeks): plus every template in `src/v2/screens/*.js`, `src/v2/view/game-header.js`,
  `screen-bar.js`, `tab-order.js`, `reply-cards-ui.js`.
- Optional "UI packs" (swappable designs): +2–3 days groundwork in `ui-host.js` / `view/screens.js`.

## Suggested order
P0 (done) → P1 + P2 + P3 (one build; postponed until after the reset, Sat 31 Oct 11:00 SGT) → P4 → P5 → P6 when a direction is chosen.

## Waiting on the user
1. Approve the editing / custom-block mockup (https://claude.ai/artifact/BbfrQUEdAWhbX9aswEyN4d).
2. P6 direction (minimal/flat, classic RPG, MVU-style, mobile HUD, or a reference).
3. P5 decisions A, B and the roll trigger (before P5 starts).
