# 087: checks-flip blockers from 083 (Sol writes) — READY (B, BEFORE 082)
Lifts the read-only rule for /tmp/cf2 and the EXISTING PR branches: kohz87/Story_block stage5/checks-flip, kohz87/rpg_battle
track-b/checks-flip, kohz87/Story_director track-b/checks-flip. No new branches, no PR edits, no merge, never force-push. README test rule.
1. `rm -rf /tmp/cf2 && mkdir -p /tmp/cf2 && cd /tmp/cf2 && git clone -q -b stage5/checks-flip https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director; do git clone -q -b track-b/checks-flip https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git && cp ~/story_suite/vm-results/083.md /tmp/cf2/`
2. In /tmp/cf2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/087-prompt.txt)" > ~/story_suite/vm-results/087-codex.md 2>&1`
3. Check: per repo a lone `git clone` of the pushed branch → `npm test` green (CI). Report as VM JOB 087 with the three commits. 4. Delete /tmp/cf2.
