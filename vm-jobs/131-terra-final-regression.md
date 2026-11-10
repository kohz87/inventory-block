# 131: Terra FINAL REGRESSION CHECK after the scope cut: RB stage8/generative-offers ea346c6, SB 899a3ee (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go131 only.
1. `rm -rf /tmp/go131 && mkdir /tmp/go131 && cd /tmp/go131 && git clone -q -b stage8/generative-offers https://github.com/kohz87/Story_block.git && git clone -q -b stage8/generative-offers https://github.com/kohz87/rpg_battle.git && git clone -q -b studio/generative-offers https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go131: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/131-prompt.txt)" > ~/story_suite/vm-results/131-codex.md 2>&1`
3. Report as VM JOB 131 (write vm-results/131.md). 4. Delete /tmp/go131.
