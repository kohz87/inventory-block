# 096: open templates onto 2.0 main + fold templates into the Ersveil pack (Sol writes) — READY (B, now)
Lifts the read-only rule for /tmp/ot2 and the EXISTING branches stage5/open-templates in kohz87/Story_block, Story_director,
rpg_battle. No new branches, no PR edits, no merges, never force-push. README test rule.
1. `rm -rf /tmp/ot2 && mkdir /tmp/ot2 && cd /tmp/ot2 && for r in Story_block rpg_battle Story_director; do git clone -q -b stage5/open-templates https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git && cp ~/story_suite/vm-results/094.md /tmp/ot2/ && cp ~/story_suite/inventory-block/suite-notes/pack-drafting/check-pack.mjs /tmp/ot2/`
2. In /tmp/ot2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/096-prompt.txt)" > ~/story_suite/vm-results/096-codex.md 2>&1`
3. Check: lone clone of each pushed branch → `npm test` green. Report as VM JOB 096. 4. Delete /tmp/ot2.
