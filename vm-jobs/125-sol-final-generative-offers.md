# 125: Sol FINAL cross-repo review: generative offers (SB 329dede, RB 2456968, SD main, NSD main) (read-only) — READY — LEAD GO-AHEAD (first free account)
"Read-only" = nothing to GitHub; the workspace-write sandbox is for npm ci / tests in /tmp/go125 only.
1. `rm -rf /tmp/go125 && mkdir /tmp/go125 && cd /tmp/go125 && git clone -q -b stage8/generative-offers https://github.com/kohz87/Story_block.git && git clone -q -b stage8/generative-offers https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go125: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/125-prompt.txt)" > ~/story_suite/vm-results/125-codex.md 2>&1`
3. Report as VM JOB 125 (write vm-results/125.md). 4. Delete /tmp/go125.
