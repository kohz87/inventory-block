# 088: Sol short review of native-death recovery (SB #203, RB #150, NSD #220) (read-only) — READY (first free slot)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-nd && mkdir /tmp/rev-nd && cd /tmp/rev-nd && for r in Story_block rpg_battle npc_state_delta; do git clone -q -b release/native-death https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/Story_director.git && mkdir main && cd main && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done` (the main/ folder is for item 3).
2. In /tmp/rev-nd: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/088-prompt.txt)" > ~/story_suite/vm-results/088-sol.md 2>&1`
3. Report as VM JOB 088. 4. Delete /tmp/rev-nd.
