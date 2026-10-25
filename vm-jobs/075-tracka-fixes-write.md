# 075: Track A fixes from review 070 (Sol writes) — READY

Lifts the read-only rule for /tmp/afix and the `track-a` branches of kohz87/rpg_battle (PR #145) and kohz87/Story_director
(PR #134). No new PR, no merge, no other branch or repo, never force-push or rebase. README test rule. On a quota stop, commit
WIP ("WIP track A fixes <item>"), push, report.
1. `rm -rf /tmp/afix && mkdir /tmp/afix && cd /tmp/afix && git clone -q -b track-a https://github.com/kohz87/rpg_battle.git && git clone -q -b track-a https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/Story_block.git` (.git writable). `npm ci` where a lockfile exists.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/075-prompt.txt)" > ~/story_suite/vm-results/075-codex.md 2>&1`
3. Check each repo: `git log --oneline origin/main..track-a | head`, `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 075. Keep /tmp/afix until ACK.
