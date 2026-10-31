# To-do list (updated 31 Oct ~06:10 UTC)

State: Story Block main c438975 (2.7.2, Ersveil 2.1.0) is still the release. Two builds are in flight on branches;
no PRs opened yet.

## In progress
| # | Work | Where | State | Next |
|---|---|---|---|---|
| R | **RPG (Story Block 2.8.0)**, formerly "Lean RPG" | Story_block `stage16/lean-rpg` c9ba353 | Merged: C block engine, H templates, A automatic rolls, B screens, F fixes (one-save Spend points, plain budget message, role tabs), G wizard + Skills view + skill stats, R2 combat (Hit/Grazed/Blocked, stage colours, Fight tab, compact tail). Suite 3863 pass / 0 fail. Browser-checked: Party, Spend points, wizard → Create, Skills view. | Round 3 running (`stage16/rpg-r3`): rename to "RPG" (labels + stored ids), Settings → RPG page (mockup v8), foe pencil edits health. Then merge → **mark review 155 READY and tell the USER to start the VM** → fixes → PR → release 2.8.0 |
| T | **Timeline** (Story Director + Studio) | SD `stage16/chronicle-lasting` 632835c; Studio `stage16/timeline` 3b128bf | Built: `chronicle.lasting` (lock, keep in mind ≤2), `chronicle.passed` for delays; Studio Timeline view + event form, Lasting change, "N days after". Studio checked against mockup v3. | Review 154 running (Sonnet reviewer; the VM never picked it up) → fixes → PRs → releases |

Approved mockups: RPG https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R (v8: sections 0–6); Studio Timeline
https://claude.ai/artifact/AJZkpqZigE5TvZRRh4jrMK (v3).

## Waiting on the USER
1. **Timeline big beats** (option 3): what happens and roughly when (CY 611 onward). Comes after J2.
2. **UI redesign (P6)**: a direction (minimal/flat, classic RPG, MVU-style, mobile HUD, or a reference).
3. **Start the VM** for review 155 when the lead says so.

## Next, in order
| # | Work | Who | Size | Needs |
|---|---|---|---|---|
| J2 | AI writing help for timeline events (USER: after the Timeline is ready, before the big beats): Studio Timeline "Copy prompt for an AI" (the pack's calendar, regions, places, existing events and lore names) + "Paste the AI's answer" (checked, added as drafts); a plain prompt doc too. **Mockup first.** | lead + Sonnet | ~½–1 day | Timeline released |
| K | Ersveil 2.2.0: hidden timeline events from the big beats, plus the "Sealwarden recruit" RPG skill set | lead | ~½ day | J2, USER item 1 |
| P4 | P4 trim: lazy-load the pack checker, Diagnostics, UI sample | Haiku or Sonnet | ~½–1 day | Can run any time (separate files) |
| L | UI redesign mockups | lead / agents | — | USER item 2 |

## Small follow-ups (any time)
- RPG: a reply where the story changes nothing doesn't settle the death check (it waits for the next reply with lines).
- Block chooser says "1 buttons" (pre-existing in 2.7.2).
- Block prompts are stored on one line, so the RPG combat text loses its line breaks.
- Story Block keeps a pack enabled when a module capability it needs goes missing after install (events that call the missing command fail each reply); consider skipping such events with one Problems line.
- A merge-on-rename can drop "from the story" after an earlier reply is re-read (pre-existing; 151 note).
- Story Director clock editing (a pencil on the date and time).
- `b1r2-capture.test.js` 10 s backstop trips under heavy load (passes alone); watch it in CI.
- Re-sync the test copies after each release (Story Block 2.8.0, Story Director, Studio).

## Done 31 Oct
- RPG: stub + feature switch; agents C, A, H, B, F, G, R2 merged; mockups v3 → v8 approved (Party tab, stage bars,
  automatic rolls, Skills view, New character wizard, fixed skill stats, coloured mastery, combat + Fight tab,
  adjustable dice and prompts); the name "RPG".
- Timeline: lasting world changes and delays moved to Story Director's chronicle (no World state block); mockup v3
  approved; agents D and E done.

## Rules to keep in mind
- **Reviews:** Codex when available (fresh session); otherwise a Sonnet reviewer in a fresh session, or the USER's go.
- **Merges:** merge commits only, after green CI; agents never merge.
- **UI:** a mockup is approved before any UI is built.
