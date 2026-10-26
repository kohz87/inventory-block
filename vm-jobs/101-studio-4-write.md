# 101: Studio part 4 — settings defaults + screen builder (Sol writes) — READY (A)
Lifts the read-only rule for /tmp/st4 and NEW branch kohz87/Story_studio studio/part-4. No PRs, no merges, never force-push.
README test rule.
1. `rm -rf /tmp/st4 && mkdir /tmp/st4 && cd /tmp/st4 && git clone -q https://github.com/kohz87/Story_studio.git && git -C Story_studio checkout -q -b studio/part-4 && for r in Story_block rpg_battle Story_director; do git clone -q https://github.com/kohz87/$r.git; done`
2. In /tmp/st4: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/101-prompt.txt)" > ~/story_suite/vm-results/101-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 101. 4. Delete /tmp/st4.
