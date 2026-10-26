# 113: data-modules v1 — the two 111 blockers (Sol writes) — READY (A, now)
Lifts the read-only rule for /tmp/dmf and the EXISTING branch kohz87/Story_block stage6/data-modules. No new branches, no PR
edits, no merges, never force-push. README test rule.
1. `rm -rf /tmp/dmf && mkdir /tmp/dmf && cd /tmp/dmf && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done && cp ~/story_suite/vm-results/111.md /tmp/dmf/`
2. In /tmp/dmf: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/113-prompt.txt)" > ~/story_suite/vm-results/113-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 113. 4. Delete /tmp/dmf.
