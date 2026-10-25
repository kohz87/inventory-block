# 072: NSD #219 fixes from check 067 (Sol writes) — WAITING until E6b merges into Story Block main

Lifts the read-only rule for /tmp/nsd219 and branch `track-b/nsd-participant` of kohz87/npc_state_delta (PR #219). No new PR,
no merge, no other branch or repo, never force-push or rebase. README test rule. On a quota stop, commit WIP, push, report.
1. `rm -rf /tmp/nsd219 && mkdir /tmp/nsd219 && cd /tmp/nsd219 && git clone -q https://github.com/kohz87/npc_state_delta.git && cd npc_state_delta && git checkout -q track-b/nsd-participant` (HEAD 34e67af or later; .git writable). `npm ci`. Clone kohz87/Story_block main beside it.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/072-prompt.txt)" > ~/story_suite/vm-results/072-codex.md 2>&1`
3. Check: `git log --oneline 34e67af..HEAD`, `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, PROMPTS byte-identical to NSD main, no model names.
4. Report as VM JOB 072. Keep /tmp/nsd219 until ACK.
