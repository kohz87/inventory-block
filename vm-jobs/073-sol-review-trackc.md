# 073: Sol review of track C (RB #139, track-c/screens1) (read-only)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-c && git clone -q -b track-c/screens1 https://github.com/kohz87/rpg_battle.git /tmp/rev-c` (HEAD 17b5efe or later). `npm ci`.
2. In /tmp/rev-c: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/073-prompt.txt)" > ~/story_suite/vm-results/073-sol.md 2>&1`
3. Report as VM JOB 073. 4. Delete /tmp/rev-c.
