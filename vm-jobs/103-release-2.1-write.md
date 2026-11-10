# 103: release prep 2.1.0 (Sol writes; docs + version) — WAITING (after 102 merges; lead flips READY)
Lifts the read-only rule for /tmp/rel21 and NEW branches release/2.1.0 in kohz87/Story_block, rpg_battle, Story_director
(npc_state_delta only if changed since v1.3.0). No PRs, merges or tags; never force-push. README test rule.
1. `rm -rf /tmp/rel21 && mkdir /tmp/rel21 && cd /tmp/rel21 && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git && git -C $r checkout -q -b release/2.1.0; done && git clone -q -b claude/hopeful-babbage-tipaw8 https://github.com/kohz87/inventory-block.git`
2. In /tmp/rel21: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="medium" "$(cat ~/story_suite/inventory-block/vm-jobs/103-prompt.txt)" > ~/story_suite/vm-results/103-codex.md 2>&1`
3. Report as VM JOB 103. 4. Delete /tmp/rel21.
