# Story Suite v2 — break-testing round (F103)

The user froze features. This round tries to BREAK the suite with as many hostile, odd and
heavy inputs as possible, then proves each bug with a failing test. You are a breaker, not a
fixer: do not push to any repo and do not open PRs. Fixes come in the next phase from the owners.

## Setup (your own copies, never the shared worktrees)
Clone the latest `v2` of all four repos into `/home/user/_break/<your-id>/`:
    for r in Story_block rpg_battle Story_director npc_state_delta; do
      git clone -q -b v2 https://github.com/kohz87/$r.git /home/user/_break/<your-id>/$r; done
Run `npm ci` (or `npm install`) in each if it has a package.json. Note each HEAD sha in your report.

- Testkit: Story Block `src/v2/testkit/` (a fake SillyTavern context running the real runtime);
  module repos vendor it (`npm run sync-testkit`). Look at existing integration tests in each repo
  (`tests/v2/integration/`, `tests/v2/qa/`) to see how all modules are registered together.
- Live SillyTavern 1.19 + mock model: `bash <SP>/instance.sh <name> <st-port> <mock-port>
  Story_block=<path> rpg_battle=<path> Story_director=<path> npc_state_delta=<path> > <SP>/inst-<name>.env 2>&1; cat <SP>/inst-<name>.env`
  (do not wrap it in `eval $(...)`, it hangs). The mock model answers from files queued in
  MOCK_Q (see `<SP>/mock/queue.mjs` and `<SP>/smoke/st-v2int-combined2.mjs` for how replies are
  queued and how the browser is driven with Playwright; Chromium is preinstalled, never run
  `playwright install`). Use ONLY your assigned ports. Stop your instance when done.
- Spec: Story Block `docs/v2/SPEC.md`, `MODULES.md` (decisions §F), `REVIEW.md` (risky areas),
  and `<SP>/V2_LOG.md` (decisions F81–F103).

<SP> = <SP>

## Invariants every finding is judged against
1. Replaying the chat from scratch gives exactly the live state (store rebuild == incremental).
2. Swipe / delete / edit / regenerate / branch / rewind restore exactly the state of that point.
3. Code, not the model, sets numbers: no model text can mint coin, items, XP, HP or meter values
   beyond the rules (clamps, claims, per-reply caps).
4. Nothing throws to the reader: bad input becomes a Problem or a refusal, never an exception, a
   blank screen or a stuck generation.
5. The static prompt part is byte-identical reply to reply (unless settings/packs change); the
   tail stays within budget.
6. No markup, script or style from packs, templates, names or model text runs in the page.
7. Saves never lose a reply's state; a failed save never drops a turn.
8. Performance stays sane (no per-reply cost that grows without bound).

## Output
- `<SP>/break/<your-id>/REPORT.md`: every finding as
  `### B-<id>-<n> [severity: critical|high|medium|low] title` with repo, file:line, exact repro
  (input + steps), expected vs actual, the invariant broken, and a suggested fix (one paragraph).
- `<SP>/break/<your-id>/tests/<repo>/...test.js`: a failing `node:test` file per finding that can
  be dropped into that repo's `tests/v2/break/` (imports relative to the repo root as the repo's
  own tests do). Mark nothing as todo; they should fail now.
- Also list what you tried that held up (so the next round doesn't repeat it).
- Final reply: counts by severity, the top 10 findings in one line each, and the report path.
Do not reproduce sexual content involving minors in any test data. Hostile strings are fine.
