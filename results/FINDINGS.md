# Beta final break cell — findings (newest first)

Format: `[severity] repo: title — test path — owner area`
Full write-ups: REPORT.md. Tests drop into `<repo>/tests/v2/break/`; each one was re-run by the lead on the heads below and fails.

## Pass 1 — 2026-10-22 — heads SB 81b5da3, RB 3510b50, SD f18d77c, NSD 1156fd7
Totals: critical 0 · high 2 · medium 6 · low 6 (one low is docs only, one is live only; 12 failing tests).

- [high] Story_block: live templates lose `type`/`maxlength`/`rows` under SillyTavern's DOMPurify (PURIFY_CONFIG ALLOWED_URI_REGEXP), so checkboxes and radios become text boxes; RB race/talent pickers dead, with no pack a character can't be made and the story stays held — results/tests/Story_block/a3-purify-drops-input-type.test.js — SB-view (template sanitize) / RB-screens2
- [high] Story_block: Re-read after a story-vouched click pays the reply's coin budget twice (400 budget → 800); cold rebuild agrees, storyBudget still says 400 — results/tests/Story_block/a2-reread-after-vouched-click.test.js — SB-inv / SB-storage
- [medium] Story_block: a late timed-out save overwrites the newer save once the reader has switched chat (#115 read-back only checks the open chat) — results/tests/Story_block/a1-late-save-chat-switch.test.js — SB-storage
- [medium] Story_block: same, after a reload of the same chat (check() says "gone", the read-back is skipped) — results/tests/Story_block/a1-late-save-reload.test.js — SB-storage
- [medium] Story_block: same, when the stale request lands just before a rename (suspect.chatId not moved by renamed()) — results/tests/Story_block/a1-late-save-rename.test.js — SB-storage
- [medium] Story_block: closing the page while a save is still waiting: the keepalive unload save queues behind it and never goes; the reader is not asked (also: >60 KiB keepalive dropped, no pagehide) — results/tests/Story_block/a1-unload-behind-hung-save.test.js — SB-storage
- [medium] rpg_battle: the boss is the foe that hangs back when an encounter has more foes than fit (fielded() drops the last rows) — results/tests/rpg_battle/a2-boss-held-back.test.js — RB-balance2
- [medium] rpg_battle: built-in shop prices and story-item worth ignore the pack money scale (F104): Ersveil spear 135 at the pack forge, 18 off-map; ~8× gear through the goods budget — results/tests/rpg_battle/a2-prices-ignore-money-scale.test.js — RB-gear / SB-packs2
- [low] Story_block: a rescue write that timed out lands late and overwrites a newer save of that chat (#115 guard watches only the open chat's saves) — results/tests/Story_block/a1-late-rescue-write.test.js — SB-storage
- [low] rpg_battle: a boss with a written rank is labelled below strong (rank: F → "even"/"trivial") — results/tests/rpg_battle/a2-ranked-boss-below-strong.test.js — RB-balance2 / RB-party2
- [low] Story_director: map "Centre on where you are" is enabled but does nothing until a place is known — results/tests/Story_director/a3-map-centre-me-dead.test.js — SD (atlas; owner to name, see V2_LOG)
- [low] Story_director: in a non-RPG game (SB + SD only) the Day digest feature description still says "fights" — results/tests/Story_director/a3-alone-digest-says-fights.test.js — SD-digest
- [low] npc_state_delta: every new chat logs a 404 for its per-chat file; an empty dossier side answer logs console.error with a stack; Cast tab hides meters set by change lines until a scan succeeds — live only: results/scripts/a3/scen.mjs s4 — NSD-meters2 / NSD-prompts
- [low] Story_block (docs): PACKS.md money-scale example is inverted (0.01 for "one coin is a copper"; needs 100) — docs/v2/PACKS.md:66, :341 — SB-packs2
- [medium] ~~Story_block: a timed-out save that reaches the server late overwrites a newer save~~ FIXED in SB 264e81c (#115) — results/tests/Story_block/f1-late-save-overwrites-newer.test.js — SB-storage

Still open from earlier cells (17, re-checked on these heads, not refiled): see REPORT.md table.

## Pass 0 — BLOCKED (code run refused; lifted by the session owner, then pass 1 ran)
