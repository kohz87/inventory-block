# 032: Sol re-check of Story Block PR #195 (E6a), round 2 fixes (read-only)

Run on account A after its reset (about 14:22 UTC), FIRST in that window (reviews before writing). Sol at xhigh. Nothing
edited or pushed. README test rule: no suite run first; single tests or small scripts only to reproduce.

1. `rm -rf /tmp/rev195b && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev195b && git -C /tmp/rev195b checkout -q track-e/e6a-timeline`.
   Print HEAD (098d2b2 or later). `npm ci` (or `npm install`).
2. In /tmp/rev195b: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/032-prompt.txt)" > ~/story_suite/vm-results/032-sol.md 2>&1`
3. Report as VM JOB 032: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev195b.
