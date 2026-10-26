# 100: Studio review blockers (Sol writes) — READY (A, now)
Lifts the read-only rule for /tmp/sf and the EXISTING branches kohz87/Story_studio studio/part-2.5 and studio/part-3. No new
branches, no PR edits, no merges into main, never force-push. README test rule.
1. `rm -rf /tmp/sf && mkdir /tmp/sf && cd /tmp/sf && git clone -q https://github.com/kohz87/Story_studio.git && git -C Story_studio checkout -q studio/part-2.5 && git clone -q https://github.com/kohz87/Story_block.git && cp ~/story_suite/vm-results/097.md /tmp/sf/`
2. In /tmp/sf: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/100-prompt.txt)" > ~/story_suite/vm-results/100-codex.md 2>&1`
3. Check: lone clones of both branches → `npm test` (browser tests too if the VM can launch Chromium). Report as VM JOB 100. 4. Delete /tmp/sf.
