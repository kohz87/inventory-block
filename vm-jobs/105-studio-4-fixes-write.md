# 105: Studio part 4 review blockers (Sol writes) — READY (A, now)
Lifts the read-only rule for /tmp/sf4 and the EXISTING branch kohz87/Story_studio studio/part-4. No new branches, no PR edits,
no merges, never force-push. README test rule.
1. `rm -rf /tmp/sf4 && mkdir /tmp/sf4 && cd /tmp/sf4 && git clone -q -b studio/part-4 https://github.com/kohz87/Story_studio.git && for r in Story_block rpg_battle Story_director; do git clone -q https://github.com/kohz87/$r.git; done && cp ~/story_suite/vm-results/104.md /tmp/sf4/`
2. In /tmp/sf4: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/105-prompt.txt)" > ~/story_suite/vm-results/105-codex.md 2>&1`
3. Check: lone clone → `npm test` (browser too if Chromium launches). Report as VM JOB 105. 4. Delete /tmp/sf4.
