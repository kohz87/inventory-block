# 091: release prep 2.0.0 (Sol writes; docs + version) — READY (after 090, or in parallel on the other account)
Lifts the read-only rule for /tmp/rel and NEW branches `release/2.0.0` in kohz87/Story_block, rpg_battle, Story_director,
npc_state_delta. No PRs, no merges, no tags, never force-push. README test rule.
1. `rm -rf /tmp/rel && mkdir /tmp/rel && cd /tmp/rel && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git && git -C $r checkout -q -b release/2.0.0; done && git clone -q -b claude/hopeful-babbage-tipaw8 https://github.com/kohz87/inventory-block.git`
2. In /tmp/rel: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="medium" "$(cat ~/story_suite/inventory-block/vm-jobs/091-prompt.txt)" > ~/story_suite/vm-results/091-codex.md 2>&1`
3. Report as VM JOB 091 with the four commits. 4. Delete /tmp/rel.
