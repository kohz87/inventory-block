# 098: balance/regression check — level-1 vs 6 weak Cellar Rat Swarm (Sol, read-only + /tmp scripts) — READY (B)
Sol at high. Nothing pushed. README test rule.
1. `rm -rf /tmp/bal && mkdir /tmp/bal && cd /tmp/bal && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git`
2. In /tmp/bal: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/098-prompt.txt)" > ~/story_suite/vm-results/098-sol.md 2>&1` (workspace-write only for /tmp/bal scripts; no git push).
3. Report as VM JOB 098. 4. Delete /tmp/bal.
