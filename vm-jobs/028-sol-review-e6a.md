# 028: Sol review of Story Block PR #195, track E6a timeline and restore (read-only)

Run in the next free Codex window (account A, or B per the README), alongside job 027 if the quota allows. Sol at xhigh.
Nothing edited or pushed. Per the README test rule, don't run the whole SB suite first; CI covers it. One exception, step 2.

1. `rm -rf /tmp/rev195 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195 && git -C /tmp/rev195 checkout -q track-e/e6a-timeline`.
   Print HEAD (5a522ad or later). `npm ci` (or `npm install`). Clone kohz87/npc_state_delta (main) into /tmp/rev195-nsd.
2. The NSD question: the writer saw 5 NSD tests fail under load (ETIMEDOUT, a synthetic-host path) that pass alone. Run NSD's
   `npm run -s test:dot` once with its testkit synced from this branch (`node /tmp/rev195/scripts/sync-testkit.mjs /tmp/rev195-nsd`),
   then once synced from `origin/track-e/e5-evidence`, and report both summaries (pass/fail counts and failing test names only).
3. In /tmp/rev195: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/028-prompt.txt)" > ~/story_suite/vm-results/028-sol.md 2>&1`
4. Report as VM JOB 028: the head, the account, step 2's two summaries, the verdict, every BLOCKING item in full, and Sol's answer per decision.
5. Delete /tmp/rev195 and /tmp/rev195-nsd.
