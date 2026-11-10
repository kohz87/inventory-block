# 106: design doc — data-defined modules (Studio part 5 stage 1) (Sol writes docs only) — READY (A)
Lifts the read-only rule for /tmp/dm and NEW branch kohz87/Story_block design/data-modules (docs only). No PRs, no merges,
never force-push.
1. `rm -rf /tmp/dm && mkdir /tmp/dm && cd /tmp/dm && for r in Story_block rpg_battle Story_director Story_studio; do git clone -q https://github.com/kohz87/$r.git; done && git -C Story_block checkout -q -b design/data-modules`
2. In /tmp/dm: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/106-prompt.txt)" > ~/story_suite/vm-results/106-codex.md 2>&1`
3. Report as VM JOB 106 with the open questions. 4. Delete /tmp/dm.
