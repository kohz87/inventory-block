# 136: Terra REVIEW of Story Block 2.5.3 (Ersveil 2.0.0 open world): SB stage11/ersveil-open f93e342 (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go136 && mkdir /tmp/go136 && cd /tmp/go136 && git clone -q -b stage11/ersveil-open https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go136: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/136-prompt.txt)" > ~/story_suite/vm-results/136-codex.md 2>&1`
3. Report as VM JOB 136 (write vm-results/136.md, commit it to inventory-block claude/hopeful-babbage-tipaw8 under vm-results/). 4. Delete /tmp/go136.
