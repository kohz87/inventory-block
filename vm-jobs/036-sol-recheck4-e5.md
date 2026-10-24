# 036: Sol re-check of Story Block PR #194 (E5), round 5 (read-only)

Run first on account B after its reset (16:25 UTC), or alongside 027 on A if A has room. Sol at xhigh. Nothing edited or
pushed. README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev194e && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194e && git -C /tmp/rev194e checkout -q track-e/e5-evidence`.
   Print HEAD (134c4dd or later). `npm ci` (or `npm install`).
2. In /tmp/rev194e: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/036-prompt.txt)" > ~/story_suite/vm-results/036-sol.md 2>&1`
3. Report as VM JOB 036: the head, the account, the verdict, each item's HOLDS/NOT FIXED, every BLOCKING item in full, and each finding's tag.
4. Delete /tmp/rev194e.
