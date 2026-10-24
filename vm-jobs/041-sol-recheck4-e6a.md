# 041: Sol re-check of Story Block PR #195 (E6a), round 5 (read-only)

Per QUEUE.md. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev195e && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195e && git -C /tmp/rev195e checkout -q track-e/e6a-timeline`.
   Print HEAD (29011bf or later). `npm ci` (or `npm install`).
2. In /tmp/rev195e: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/041-prompt.txt)" > ~/story_suite/vm-results/041-sol.md 2>&1`
3. Report as VM JOB 041: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full with both tags.
4. Delete /tmp/rev195e.
