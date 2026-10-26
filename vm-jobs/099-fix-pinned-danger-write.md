# 099: fix — pinned-pack encounters ignore the danger label (Sol writes) — READY (B, now)
Lifts the read-only rule for /tmp/fd and NEW branch kohz87/rpg_battle fix/pinned-danger. No PRs, no merges, never force-push.
README test rule.
1. `rm -rf /tmp/fd && mkdir /tmp/fd && cd /tmp/fd && git clone -q https://github.com/kohz87/rpg_battle.git && git clone -q https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git && git -C rpg_battle checkout -q -b fix/pinned-danger && cp ~/story_suite/vm-results/098.md /tmp/fd/`
2. In /tmp/fd: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/099-prompt.txt)" > ~/story_suite/vm-results/099-codex.md 2>&1`
3. Check: lone clone of fix/pinned-danger → `npm test` green. Report as VM JOB 099. 4. Delete /tmp/fd.
