# 008: Codex review of Story Block PR #172 (read-only)

PR: https://github.com/kohz87/Story_block/pull/172 (ui-7-phosphor into v2), head a1d314d or later.

1. `rm -rf /tmp/rev172 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev172 && git -C /tmp/rev172 fetch -q origin pull/172/head:pr172 && git -C /tmp/rev172 checkout -q pr172`. Print HEAD.
2. `npm ci` (or `npm install`), then `npm run -s check` and `npm run -s test:dot`.
3. `codex exec --sandbox read-only "$(cat ~/story_suite/inventory-block/vm-jobs/008-prompt.txt)" > ~/story_suite/vm-results/008-codex.md 2>&1`
4. Report as VM JOB 008:
   - the head;
   - the check and test results;
   - the verdict and every BLOCKING item, in the message;
   - the rest, in the results file.
5. Delete /tmp/rev172.
