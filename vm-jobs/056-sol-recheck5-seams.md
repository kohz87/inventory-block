# 056: Sol re-check of Story Block PR #197 (ctx-seams), round 5 (read-only)

Per QUEUE.md (reviews before writing): run it now on A, in parallel with whatever runs. Sol at xhigh. Nothing edited or pushed.
README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev197e && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev197e && git -C /tmp/rev197e checkout -q track-e/ctx-seams`.
   Print HEAD (2fbe8d0 or later). `npm ci` (or `npm install`).
2. In /tmp/rev197e: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/056-prompt.txt)" > ~/story_suite/vm-results/056-sol.md 2>&1`
3. Report as VM JOB 056: the head, the account, the verdict, and every BLOCKING item in full with both tags.
4. Delete /tmp/rev197e.
