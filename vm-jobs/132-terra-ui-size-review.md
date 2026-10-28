# 132: Terra REVIEW of the UI release: SB stage10/ui-size 26c637f + SD stage10/ui-size 6a20553 (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go132 only.
1. `rm -rf /tmp/go132 && mkdir /tmp/go132 && cd /tmp/go132 && git clone -q -b stage10/ui-size https://github.com/kohz87/Story_block.git && git clone -q -b stage10/ui-size https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go132: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/132-prompt.txt)" > ~/story_suite/vm-results/132-codex.md 2>&1`
3. Report as VM JOB 132 (write vm-results/132.md). 4. Delete /tmp/go132.
