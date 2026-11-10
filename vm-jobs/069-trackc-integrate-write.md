# 069: Track C (RB #139 rules screens) onto RB main + stub updates (Sol writes) — READY

Lifts the read-only rule for /tmp/c139 and branch `track-c/screens1` of kohz87/rpg_battle (PR #139). No new PR, no merge,
no other branch, never force-push or rebase. README test rule. On a quota stop, commit WIP ("WIP track C <step>"), push, report.
1. `rm -rf /tmp/c139 && mkdir /tmp/c139 && cd /tmp/c139 && git clone -q https://github.com/kohz87/rpg_battle.git && cd rpg_battle && git checkout -q track-c/screens1` (HEAD 54ea4a7 or later; .git writable). `npm ci`. Clone kohz87/Story_block main beside it for the testkit.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/069-prompt.txt)" > ~/story_suite/vm-results/069-codex.md 2>&1`
3. Check: `git log --oneline 54ea4a7..HEAD`, `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 069. Keep /tmp/c139 until ACK.
