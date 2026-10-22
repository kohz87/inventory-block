# Breaker cell brief (shared by all 4 subagents)

You are a breaker for the Story Suite v2 beta (four SillyTavern extensions, branch v2:
Story_block, rpg_battle, Story_director, npc_state_delta). NEVER push to those repos, never open PRs,
never merge. Your clones have pushes disabled; keep it so. Do NOT git commit or push anywhere — the lead
commits your output.

Read: /home/user/inventory-block/harness/BREAK_BRIEF.md (invariants 1-8 and finding format; ignore its <SP> paths and
its SendMessage/owner-agent instructions), /home/user/inventory-block/harness/ROLLING_BRIEF.md (owner AREAS table only —
name the owner area per finding, do not message anyone), earlier rounds in /home/user/inventory-block/harness/break/
(b1-capture, b2-timeline, b5b-robust: REPORT.md + r2/r3 NOTES.txt — do not re-file what was fixed or held up),
Story_block docs/v2/SPEC.md §2.2 (bookkeeping, replay rules a/b/c) and §6 (modules, Features).

Testkit: Story_block src/v2/testkit/ (fake SillyTavern running the real runtime). See each repo's
tests/v2/integration and tests/v2/qa for how all four modules are registered together. No npm deps are
needed (package.json has none); run tests with `node --test`.

Machine: 4 cores, 15 GB, shared by 4 agents. Run at most ONE heavy (fuzz) process at a time yourself, under
`nice -n 10`, with a `timeout` so nothing runs away. Clean up big output files.

Output (lead dedupes and commits):
- Failing node:test files: /home/user/inventory-block/results/tests/<repo>/c<agent#>-<short-name>.test.js,
  droppable into that repo's tests/v2/break/ (imports relative to the repo root as the repo's own break tests do;
  look at an existing tests/v2/break/*.test.js for the import style). They must FAIL on current v2. No todo/skip.
  Verify by copying into your clone's tests/v2/break/ and running it, then remove the copy from your clone.
- /home/user/inventory-block/results/work/a<agent#>/REPORT.md: each finding as
  `### C<agent#>-<n> [severity: critical|high|medium|low] title` with repo, file:line, exact repro, expected vs actual,
  invariant broken, suggested fix (one paragraph), test path, owner area (from ROLLING_BRIEF's table). Plus a
  "Held up" section of what you tried that did not break.
- /home/user/inventory-block/results/work/a<agent#>/runs.md: fuzz counts per pass (pass #, heads shas, seeds x steps,
  ops/lines mixed in, alarms, classified signatures).
- Scripts you write: /home/user/inventory-block/results/work/a<agent#>/scripts/ (keep them small, no big outputs in the repo).
Before filing, rule out harness/oracle errors (earlier rounds lost time on strict oracles). A finding needs a
deterministic repro in a failing test.
Final reply to the lead: short — heads, counts run, findings (id, severity, one line, test path), what held.
Hostile strings fine; no sexual content involving minors in test data.
