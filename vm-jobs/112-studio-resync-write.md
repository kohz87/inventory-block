# 112: Studio 5a re-sync to the finished data-modules runtime (Sol writes) — READY (B, now)
Lifts the read-only rule for /tmp/rs and the EXISTING branch kohz87/Story_studio studio/part-5a. No new branches, no PR edits,
no merges, never force-push. README test rule.
1. `rm -rf /tmp/rs && mkdir /tmp/rs && cd /tmp/rs && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git`
2. In /tmp/rs: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/112-prompt.txt)" > ~/story_suite/vm-results/112-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 112. 4. Delete /tmp/rs.
