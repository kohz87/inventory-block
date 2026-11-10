# 006: Antigravity (Opus, high) reviews rpg_battle PR #126 (read-only)

PR: https://github.com/kohz87/rpg_battle/pull/126, head c75c8c1 or later. This is the hardest review of the UI stage, so it uses the limited Opus quota. If Opus is not available, run Codex as in job 003 and say so.

1. Make a fresh copy:
   `rm -rf /tmp/rev126 && git clone -q https://github.com/kohz87/rpg_battle.git /tmp/rev126 && git -C /tmp/rev126 fetch -q origin pull/126/head:pr126 && git -C /tmp/rev126 checkout -q pr126`
   Print its HEAD.
2. Run `npm ci` (or `npm install`), then `npm test` and `npm run -s check` in /tmp/rev126. Note the results.
3. Run the reviewer read-only in /tmp/rev126:
   `agy -p "$(cat ~/story_suite/inventory-block/vm-jobs/006-prompt.txt)" --model claude-opus-5-5-high > ~/story_suite/vm-results/006-review.md 2>&1`
   It only needs to read files. If it is blocked on permissions, don't widen them: fall back to `codex exec --sandbox read-only "$(cat ~/story_suite/inventory-block/vm-jobs/006-prompt.txt)"` and say which one ran.
4. Report as VM JOB 006:
   - the head, and the test and check results;
   - which reviewer ran;
   - the verdict and every BLOCKING item, in the message;
   - the rest, in the results file.
5. Delete /tmp/rev126.
