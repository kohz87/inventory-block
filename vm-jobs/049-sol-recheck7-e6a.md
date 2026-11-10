# 049: Sol re-checks: E6a round 8 (PR #195) + ctx-seams v3 (PR #197) (read-only)

Per QUEUE.md (reviews before writing). Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first.

1. `rm -rf /tmp/rev195h /tmp/rev197c && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195h && git -C /tmp/rev195h checkout -q track-e/e6a-timeline && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev197c && git -C /tmp/rev197c checkout -q track-e/ctx-seams`.
   Print both HEADs (4bf7e33 / e401b0d or later). `npm ci` in each.
2. In /tmp/rev195h: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/049-prompt.txt)" > ~/story_suite/vm-results/049-sol.md 2>&1`
   In /tmp/rev197c: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/049-prompt-seams.txt)" > ~/story_suite/vm-results/049-seams-sol.md 2>&1`
3. Report as VM JOB 049 (two verdicts), every BLOCKING item in full with both tags.
4. Delete both clones.
