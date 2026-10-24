# 035: Sol re-check of Story Block PR #195 (E6a), round 3 (read-only)

Run alongside 027 on account A if its window has room (separate clone, read-only, short); otherwise first on account B after
its reset. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev195c && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195c && git -C /tmp/rev195c checkout -q track-e/e6a-timeline`.
   Print HEAD (0e01674 or later). `npm ci` (or `npm install`).
2. In /tmp/rev195c: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/035-prompt.txt)" > ~/story_suite/vm-results/035-sol.md 2>&1`
3. Report as VM JOB 035: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev195c.
