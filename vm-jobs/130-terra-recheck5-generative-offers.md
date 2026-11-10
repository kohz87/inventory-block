# 130: Terra FIFTH RE-CHECK of 129's 4 blockers: RB stage8/generative-offers e869c13, SB 899a3ee (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go130 only.
1. `rm -rf /tmp/go130 && mkdir /tmp/go130 && cd /tmp/go130 && git clone -q -b stage8/generative-offers https://github.com/kohz87/Story_block.git && git clone -q -b stage8/generative-offers https://github.com/kohz87/rpg_battle.git && git clone -q -b studio/generative-offers https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go130: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/130-prompt.txt)" > ~/story_suite/vm-results/130-codex.md 2>&1`
3. Report as VM JOB 130 (write vm-results/130.md). 4. Delete /tmp/go130.
