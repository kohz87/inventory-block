# 033: Sol re-check of Story Block PR #194 (E5), round 4 fixes (read-only)

Run on account A right after 032 (reviews before writing). Sol at xhigh. Nothing edited or pushed. README test rule: no
suite run first; single tests or small scripts only to reproduce.

1. `rm -rf /tmp/rev194d && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194d && git -C /tmp/rev194d checkout -q track-e/e5-evidence`.
   Print HEAD (d23ab1f or later). `npm ci` (or `npm install`).
2. In /tmp/rev194d: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/033-prompt.txt)" > ~/story_suite/vm-results/033-sol.md 2>&1`
3. Report as VM JOB 033: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev194d.
