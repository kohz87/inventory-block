# 010: Codex review of Story Block PR #173 (read-only)

PR: https://github.com/kohz87/Story_block/pull/173 (ui-7-nav into v2), head f3b91ae or later.

1. `rm -rf /tmp/rev173 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev173 && git -C /tmp/rev173 fetch -q origin pull/173/head:pr173 && git -C /tmp/rev173 checkout -q pr173`. Print HEAD.
2. `npm ci` (or `npm install`), then `npm run -s check` and `npm run -s test:dot`.
3. `codex exec --sandbox read-only "$(cat ~/story_suite/inventory-block/vm-jobs/010-prompt.txt)" > ~/story_suite/vm-results/010-codex.md 2>&1`
4. Report as VM JOB 010:
   - the head;
   - the check and test results;
   - the verdict and every BLOCKING item, in the message;
   - the rest, in the results file.
5. Delete /tmp/rev173.
