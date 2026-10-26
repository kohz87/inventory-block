# 090: merge main into RB release/native-death (Sol writes) — READY (first free slot)
Lifts the read-only rule for /tmp/nd2 and kohz87/rpg_battle branch release/native-death (existing; PR #150). No new branches,
no PR edits, no merge of the PR, never force-push. README test rule.
1. `rm -rf /tmp/nd2 && mkdir /tmp/nd2 && cd /tmp/nd2 && for r in Story_block rpg_battle npc_state_delta; do git clone -q -b release/native-death https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/Story_director.git`
2. In /tmp/nd2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/090-prompt.txt)" > ~/story_suite/vm-results/090-codex.md 2>&1`
3. Check: a lone `git clone -b release/native-death` of rpg_battle → `npm test` green. Report as VM JOB 090. 4. Delete /tmp/nd2.
