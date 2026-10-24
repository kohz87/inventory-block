# 047: Sol re-checks: E6a round 7 (PR #195) + ctx-seams v2 (PR #197) (read-only)

Per QUEUE.md. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev195g /tmp/rev197b && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195g && git -C /tmp/rev195g checkout -q track-e/e6a-timeline && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev197b && git -C /tmp/rev197b checkout -q track-e/ctx-seams`.
   Print both HEADs (7884e27 / 1b15c6c or later). `npm ci` in each.
2. In /tmp/rev195g: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/047-prompt.txt)" > ~/story_suite/vm-results/047-sol.md 2>&1`
   In /tmp/rev197b: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/047-prompt-seams.txt)" > ~/story_suite/vm-results/047-seams-sol.md 2>&1`
3. Report as VM JOB 047 (two verdicts), every BLOCKING item in full with both tags.
4. Delete both clones.
