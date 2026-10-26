# 117: Studio 5a — the three 116 blockers (Sol writes) — READY (first free account)
Lifts the read-only rule for /tmp/sf5 and the EXISTING branch kohz87/Story_studio studio/part-5a. No new branches, no PR edits,
no merges, never force-push. README test rule.
1. `rm -rf /tmp/sf5 && mkdir /tmp/sf5 && cd /tmp/sf5 && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && cp ~/story_suite/vm-results/116.md /tmp/sf5/`
2. In /tmp/sf5: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/117-prompt.txt)" > ~/story_suite/vm-results/117-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 117. 4. Delete /tmp/sf5.
