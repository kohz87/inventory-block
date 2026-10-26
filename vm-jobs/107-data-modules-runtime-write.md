# 107: data-defined modules v1 — Story Block runtime (Sol writes) — READY (first free account)
Lifts the read-only rule for /tmp/dmr and NEW branch kohz87/Story_block stage6/data-modules. No PRs, no merges, never force-push.
README test rule. Large job: push WIP at clean step boundaries if a limit stops you.
1. `rm -rf /tmp/dmr && mkdir /tmp/dmr && cd /tmp/dmr && for r in Story_block rpg_battle Story_director npc_state_delta Story_studio; do git clone -q https://github.com/kohz87/$r.git; done && git -C Story_block checkout -q -b stage6/data-modules && git -C Story_block fetch -q origin design/data-modules`
2. In /tmp/dmr: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/107-prompt.txt)" > ~/story_suite/vm-results/107-codex.md 2>&1`
3. Check: lone clone of the pushed branch → `npm test` green. Report as VM JOB 107 (steps done). 4. Delete /tmp/dmr.
