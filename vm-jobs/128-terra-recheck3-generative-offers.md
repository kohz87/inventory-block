# 128: Terra THIRD RE-CHECK (after the redesign) of 127's 8 blockers: RB stage8/generative-offers 9c2202e, SB 899a3ee (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go128 only.
1. `rm -rf /tmp/go128 && mkdir /tmp/go128 && cd /tmp/go128 && git clone -q -b stage8/generative-offers https://github.com/kohz87/Story_block.git && git clone -q -b stage8/generative-offers https://github.com/kohz87/rpg_battle.git && git clone -q -b studio/generative-offers https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go128: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/128-prompt.txt)" > ~/story_suite/vm-results/128-codex.md 2>&1`
3. Report as VM JOB 128 (write vm-results/128.md). 4. Delete /tmp/go128.
