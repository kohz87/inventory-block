# 111: Sol full review — data-defined modules v1 runtime (SB stage6/data-modules 1e8ade4) (read-only) — READY (A, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-dm && mkdir /tmp/rev-dm && cd /tmp/rev-dm && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done`
2. In /tmp/rev-dm: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/111-prompt.txt)" > ~/story_suite/vm-results/111-sol.md 2>&1`
3. Report as VM JOB 111. 4. Delete /tmp/rev-dm.
