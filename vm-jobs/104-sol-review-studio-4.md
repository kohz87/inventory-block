# 104: Sol review of Studio part 4 (read-only) — READY (A, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-st4 && mkdir /tmp/rev-st4 && cd /tmp/rev-st4 && git clone -q -b studio/part-4 https://github.com/kohz87/Story_studio.git && for r in Story_block rpg_battle Story_director; do git clone -q https://github.com/kohz87/$r.git; done`
2. In /tmp/rev-st4: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/104-prompt.txt)" > ~/story_suite/vm-results/104-sol.md 2>&1`
3. Report as VM JOB 104. 4. Delete /tmp/rev-st4.
