# 133: Terra RE-CHECK of 132's six blockers: SB stage10/ui-size 7fa969f + SD stage10/ui-size 37aded1 (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub except committing the result files to inventory-block (vm-results/132.md, 133.md); the workspace-write sandbox is for npm ci / tests in /tmp/go133 only.
1. `rm -rf /tmp/go133 && mkdir /tmp/go133 && cd /tmp/go133 && git clone -q -b stage10/ui-size https://github.com/kohz87/Story_block.git && git clone -q -b stage10/ui-size https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go133: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/133-prompt.txt)" > ~/story_suite/vm-results/133-codex.md 2>&1`
3. Report as VM JOB 133 (write vm-results/133.md and commit it with 132.md to inventory-block claude/hopeful-babbage-tipaw8 under vm-results/). 4. Delete /tmp/go133.
