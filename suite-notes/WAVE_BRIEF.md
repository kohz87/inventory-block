# Story Suite v2 — beta build waves (B–E), parallel. Shared rules for every feature agent.
Read first: <SP>/V2_BRIEF.md (trailers, PR attribution, no model names), the decisions log <SP>/V2_LOG.md
(F81–F103 + the morning decisions near the end), Story Block docs/v2/SPEC.md (§2.2 bookkeeping + replay
rules a/b/c, §5 prompt, §6 modules incl. `requires` + Features API, §7 domains), MODULES.md §F.
<SP> = <SP>

Non-negotiables (from the break rounds — every PR must keep them):
1. Code sets numbers; the story proposes. Clamp, cap per reply, claim once. Model text never mints value.
2. Bookkeeping that later replies write: keyed by carrier sid / id with add-only ops (or derived); never
   positional list appends or replace of another reply's fields (SPEC §2.2). Prune with key removes.
3. Replay == live after swipes, middle deletes, rewinds, reloads. Your repo's fuzz-delete CI test must pass,
   and add your new kinds/commands to the fuzz generator if the repo has one.
4. Static prompt part byte-identical reply to reply; new static lines only via a feature (F100) or settings.
   Keep tail additions short and within budget.
5. Every optional mechanic is a Feature (F100): declare `features: [{ id, label, describe, default }]` and
   tag kinds/commands/queries/context/hooks/screens with `feature:`. Check `ctx.feature(id)` where needed.
   If Story Block's Features PR has not merged yet, still declare them (older hosts warn-and-ignore) and
   treat `ctx.feature` as absent → on.
6. Story-driven, no action buttons for story actions (F95/F96). Bag management buttons are fine.
7. No markup/script from text; use the template/widget system; names flattened; cut by code points.
8. Tests for every rule (user, 2026-10-22: check ONCE, after the fix only; do not re-run tests on old code to prove they fail, and skip before/after comparisons), `npm test` + `npm run check` green; docs (SPEC/GUIDE/MODULES or
   the repo's README/CHANGELOG) updated; module repos re-sync the Story Block testkit before the final push.
9. File ownership: stay in your listed files. Shared files (module.js, index.js registration) — minimal
   edits, rebase often, keep both sides on conflicts.
10. PR into `v2` with the GitHub MCP tools (load via ToolSearch). Do NOT merge your own PR (changed 2026-10-22):
    when CI is green, SendMessage `main` with the PR link and a 3-line summary; main reviews and merges, or replies
    with changes. Report: PR links, API/kinds added, feature ids, tests, choices.
11. Modules stand alone (user, 2026-10-22): Story Director must work without RPG Battle (e.g. a dating sim or
    mystery with no fights, stats or levels), RPG Battle without Story Director, NPC State Delta alone. Never a
    hard dependency: read other modules only through tryQuery / optional commands, degrade to a sensible default
    (no level → lowest rank, no clock → no story time), and say so plainly. Every PR tests its module with each
    other module absent.
12. Quota saving (user, 2026-10-22): message `main` ONCE per PR, when CI is green, with the link and at most 3 lines.
    No interim status or heads-up messages, no long final reports. Don't poll in background loops. Keep test runs to
    what proves the change (one full npm test). Finish your task, then stop.
