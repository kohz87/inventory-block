# 078: stage 5 — make the shared matrix green (Sol writes) — READY

Lifts the read-only rule for /tmp/mx2 and NEW branches `stage5/matrix` in kohz87/Story_block and kohz87/rpg_battle (push those
only; no PR, no merge, never force-push). README test rule. On a quota stop, commit WIP, push, report.
1. `rm -rf /tmp/mx2 && mkdir /tmp/mx2 && cd /tmp/mx2 && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done` (all main; .git writable). In Story_block and rpg_battle: `git checkout -b stage5/matrix`.
2. In /tmp/mx2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/078-prompt.txt)" > ~/story_suite/vm-results/078-codex.md 2>&1`
3. Check: the matrix once (summary), `npm run -s check` and `npm run -s test:dot` once in SB and RB, `git diff --check origin/main HEAD`, no model names. Report as VM JOB 078.
