# After the reset: to-do list (written 31 Oct ~02:30 UTC)

State: Story Block main c438975 (2.7.2, Ersveil 2.1.0). Story Director, Studio and NPC State Delta test copies are at
2.7.x. Nothing is in flight; no open PRs.

## Waiting on the USER (answers unblock the rest)
1. ~~**Studio Timeline mockup**~~ approved 31 Oct (v3, https://claude.ai/artifact/AJZkpqZigE5TvZRRh4jrMK); build J in progress.
2. **Timeline big beats** (option 3): what happens and roughly when (CY 611 onward). The lead fills in the dates, the
   build-up and how the news spreads.
3. ~~**Lean RPG mockups**~~ approved 31 Oct (v3). Build in progress.
4. **UI redesign (P6)**: a direction (minimal/flat, classic RPG, MVU-style, mobile HUD, or a reference).

## Ready to start now (no answers needed)
| # | Work | Who | Size | Notes |
|---|---|---|---|---|
| A | ~~Lean RPG mockups~~ done 31 Oct (Gn22FRyEzDvufqZDgdbR4R) | lead | — | Awaiting approval (item 3) |
| B | ~~Lean RPG code stubs~~ done 31 Oct (stage16/lean-rpg f50ad31) | lead | — | Agents C, A, B, H launched |
| C | RPG agent C, block engine (prompt 1200, display names, Card and reply-end functions, hidden fields) | Sonnet | ~1 day | After B |
| D | RPG agent A, rolls (prelude list, plan, `rpg.resolve`, optional pre-call) | Sonnet | ~1–1½ days | After B, parallel with C |
| E | RPG agent H, templates + docs (Character, Skills, Foes, Combat rules) | Haiku | ~½ day | After B, parallel |
| F | P4 trim: lazy-load the pack checker, Diagnostics, UI sample | Haiku or Sonnet | ~½–1 day | Separate files, can run beside the RPG work |

## After the USER answers
| # | Work | Who | Size | Needs |
|---|---|---|---|---|
| G | RPG agent B, screens (battle log D, Roll form, stats screen) | Sonnet | ~1 day | item 3 |
| H | RPG integration, browser check, review rounds, release Story Block 2.8.0 | lead + reviewer | ~2 days | C, D, E, G |
| I | Studio Timeline (the Events → Timeline view and form) | Sonnet + lead | ~1–1½ days | item 1 |
| J | SD chronicle command for pack events (lock + Keep in mind); Studio Lasting change picker and "N days after" (a chronicle-based condition, no SB change) | Sonnet + lead | ~1 day | item 1 approval |
| J2 | AI writing help for timeline events (USER, 31 Oct: after J is ready, before the big beats): Studio Timeline "Copy prompt for an AI" (fills the pack's calendar, regions, places, existing events and lore names) + "Paste the AI's answer" (checked, added as drafts to review); a plain prompt doc too. Mockup first. | lead + Sonnet | ~½–1 day | J |
| K | Ersveil hidden timeline events (pack 2.2.0) | lead | ~½ day | item 2 (+ J for lasting changes) |
| L | UI redesign mockups | lead / agents | — | item 4 |

## Small follow-ups (any time)
- A merge-on-rename can drop "from the story" after an earlier reply is re-read (pre-existing; 151 note).
- Story Director clock editing (a pencil on the date and time).
- Re-sync the test copies after each Story Block release (a Haiku or Sonnet agent, like 30 Oct).

## Rules to keep in mind
- **Reviews:** Codex when available (fresh session); otherwise a Sonnet reviewer in a fresh session, or the USER's go.
- **Merges:** merge commits only, after green CI; agents never merge.
- **UI:** a mockup is approved before any UI is built.
