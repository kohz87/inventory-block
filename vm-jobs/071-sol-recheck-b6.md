# 071: Sol re-check of RPG Battle B6 after the review fixes (PR #146) (read-only)

Per QUEUE.md (reviews before writing). Sol at xhigh. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-b6b && git clone -q https://github.com/kohz87/rpg_battle.git /tmp/rev-b6b && git -C /tmp/rev-b6b checkout -q track-b/death-return`. Print HEAD (98dfc16 or later). `npm ci`.
2. In /tmp/rev-b6b: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/071-prompt.txt)" > ~/story_suite/vm-results/071-sol.md 2>&1`
3. Report as VM JOB 071: head, account, verdict, every BLOCKING item in full with both tags. 4. Delete the clone.
