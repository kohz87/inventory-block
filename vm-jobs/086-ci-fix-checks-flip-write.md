# 086: CI fix for the checks flip (Sol writes; test-only) — READY (A, alongside 084/085)
Lifts the read-only rule for /tmp/cf and the EXISTING PR branches: kohz87/Story_block stage5/checks-flip, kohz87/rpg_battle
track-b/checks-flip, kohz87/Story_director track-b/checks-flip. No new branches, no PR edits, no merge, never force-push.
README test rule.
1. `rm -rf /tmp/cf && mkdir -p /tmp/cf/side /tmp/cf/lone && cd /tmp/cf/side && git clone -q -b stage5/checks-flip https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director; do git clone -q -b track-b/checks-flip https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/cf: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="medium" "$(cat ~/story_suite/inventory-block/vm-jobs/086-prompt.txt)" > ~/story_suite/vm-results/086-codex.md 2>&1` (it uses /tmp/cf/lone for the no-siblings run).
3. Check yourself: for each repo `git clone` the pushed branch alone into an empty folder and run `npm test` → all green (that is CI). Report as VM JOB 086 with the three commits. 4. Delete /tmp/cf.
