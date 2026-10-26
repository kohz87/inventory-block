# 093: Studio part 2.5 (Sol writes) — READY
Lifts the read-only rule for /tmp/st25 and NEW branches: kohz87/Story_studio studio/part-2.5, kohz87/Story_block studio/limits.
No PRs, no merges, never force-push. README test rule.
1. `rm -rf /tmp/st25 && mkdir /tmp/st25 && cd /tmp/st25 && git clone -q https://github.com/kohz87/Story_studio.git && git clone -q -b v2.0.0 https://github.com/kohz87/Story_block.git && git -C Story_studio checkout -q -b studio/part-2.5 && git -C Story_block checkout -q -b studio/limits`
2. In /tmp/st25: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/093-prompt.txt)" > ~/story_suite/vm-results/093-codex.md 2>&1`
3. Check: lone clone of each pushed branch → `npm test` green. Report as VM JOB 093. 4. Delete /tmp/st25.
