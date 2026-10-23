# 012: Sol review of Story Block PR #176 (read-only)

Use Sol 6.1 at xhigh, as in job 011.

1. `rm -rf /tmp/rev176 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev176 && git -C /tmp/rev176 fetch -q origin pull/176/head:pr176 && git -C /tmp/rev176 checkout -q pr176`. Print HEAD (bea0d90 or later).
2. `npm ci` (or `npm install`), then `npm run -s check` and `npm run -s test:dot`.
3. `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/012-prompt.txt)" > ~/story_suite/vm-results/012-sol.md 2>&1` (run it inside /tmp/rev176).
4. Report as VM JOB 012:
   - the head;
   - the check and test results;
   - the verdict and every BLOCKING item in full, in the message;
   - the rest as headlines.
5. Delete /tmp/rev176.
