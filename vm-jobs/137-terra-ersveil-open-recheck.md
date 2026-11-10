# 137: Terra RE-CHECK of 136 on SB stage11/ersveil-open ee60c76 (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go137 && mkdir /tmp/go137 && cd /tmp/go137 && git clone -q -b stage11/ersveil-open https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go137: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/137-prompt.txt)" > ~/story_suite/vm-results/137-codex.md 2>&1`
3. Report as VM JOB 137 (write vm-results/137.md, commit it under vm-results/). 4. Delete /tmp/go137.
