# 080: stage 5 — the checks flip (Sol writes) — READY (on B at ≈12:40, or after 078/079)

Lifts the read-only rule for /tmp/flip and the branches `track-b/checks-flip` in kohz87/rpg_battle and kohz87/Story_director,
plus NEW branch `stage5/checks-flip` in kohz87/Story_block (for the E7b patch). No PR, no merge, never force-push or rebase.
README test rule. On a quota stop, commit WIP, push, report.
1. `rm -rf /tmp/flip && mkdir /tmp/flip && cd /tmp/flip && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done` (.git writable).
   `git -C rpg_battle checkout -q track-b/checks-flip && git -C Story_director checkout -q track-b/checks-flip && git -C Story_block checkout -q -b stage5/checks-flip`.
2. In /tmp/flip: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/080-prompt.txt)" > ~/story_suite/vm-results/080-codex.md 2>&1`
3. Check in each repo: `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names; the matrix once. Report as VM JOB 080.
