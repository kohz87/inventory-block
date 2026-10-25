# 084: release must-have — native-death recovery (Sol writes) — READY (on A at 16:39 UTC)
Lifts the read-only rule for /tmp/nd and NEW branch `release/native-death` in kohz87/rpg_battle (and kohz87/npc_state_delta /
kohz87/Story_block only if needed — same branch name there). No PR, no merge, never force-push. README test rule.
1. `rm -rf /tmp/nd && mkdir /tmp/nd && cd /tmp/nd && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done` (main; .git writable). `git -C rpg_battle checkout -b release/native-death`.
2. In /tmp/nd: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/084-prompt.txt)" > ~/story_suite/vm-results/084-codex.md 2>&1`
3. Check: `npm run -s check`/validate, `npm run -s test:dot` once per touched repo, `git diff --check origin/main HEAD`, no model names; the matrix once. Report as VM JOB 084.
