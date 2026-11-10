# 127: Terra SECOND RE-CHECK (USER-approved exception) of 126's 7 blockers: RB stage8/generative-offers 1617742 (read-only) — READY — LEAD GO-AHEAD (first free account)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go127 only.
1. `rm -rf /tmp/go127 && mkdir /tmp/go127 && cd /tmp/go127 && git clone -q -b stage8/generative-offers https://github.com/kohz87/Story_block.git && git clone -q -b stage8/generative-offers https://github.com/kohz87/rpg_battle.git && git clone -q -b studio/generative-offers https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go127: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/127-prompt.txt)" > ~/story_suite/vm-results/127-codex.md 2>&1`
3. Report as VM JOB 127 (write vm-results/127.md). 4. Delete /tmp/go127.
