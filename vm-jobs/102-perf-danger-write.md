# 102: speed up pinned danger calibration (Sol writes) — WAITING (after RB #153 merges; lead flips READY)
Lifts the read-only rule for /tmp/pdc and NEW branch kohz87/rpg_battle perf/danger-calibration. No PRs, no merges, never force-push.
1. `rm -rf /tmp/pdc && mkdir /tmp/pdc && cd /tmp/pdc && for r in rpg_battle Story_block Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done && git -C rpg_battle checkout -q -b perf/danger-calibration`
2. In /tmp/pdc: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/102-prompt.txt)" > ~/story_suite/vm-results/102-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 102. 4. Delete /tmp/pdc.
