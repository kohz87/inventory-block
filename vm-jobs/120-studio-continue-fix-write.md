# 120: Studio 5a — Continue corrupts step snapshots (119 blocker) (Sol writes) — READY (first free account)
Lifts the read-only rule for /tmp/sf6 and the EXISTING branch kohz87/Story_studio studio/part-5a. No new branches, no PR edits,
no merges, never force-push. README test rule.
1. `rm -rf /tmp/sf6 && mkdir /tmp/sf6 && cd /tmp/sf6 && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_block.git && cp ~/story_suite/vm-results/119.md /tmp/sf6/`
2. In /tmp/sf6: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/120-prompt.txt)" > ~/story_suite/vm-results/120-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 120. 4. Delete /tmp/sf6.
