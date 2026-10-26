# 114: Sol re-check — data-modules fixes (SB stage6/data-modules be84639) (read-only) — READY (A, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rck && mkdir /tmp/rck && cd /tmp/rck && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done && cp ~/story_suite/vm-results/111.md /tmp/rck/`
2. In /tmp/rck: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/114-prompt.txt)" > ~/story_suite/vm-results/114-sol.md 2>&1`
3. Report as VM JOB 114. 4. Delete /tmp/rck.
