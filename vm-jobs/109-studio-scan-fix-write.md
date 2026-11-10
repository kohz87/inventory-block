# 109: Studio 5a — throwing offline shims + dist-scan without exemptions (Sol writes) — READY (A or B, now)
Lifts the read-only rule for /tmp/scan and the EXISTING branch kohz87/Story_studio studio/part-5a. No new branches, no PR edits,
no merges, never force-push. README test rule.
1. `rm -rf /tmp/scan && mkdir /tmp/scan && cd /tmp/scan && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && cp ~/story_suite/vm-results/108.md /tmp/scan/`
2. In /tmp/scan: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/109-prompt.txt)" > ~/story_suite/vm-results/109-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 109. 4. Delete /tmp/scan.
