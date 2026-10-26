# 110: Sol review — RB perf/danger-calibration (lean Auto player) (read-only) — READY (B, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-perf && mkdir /tmp/rev-perf && cd /tmp/rev-perf && git clone -q -b perf/danger-calibration https://github.com/kohz87/rpg_battle.git && for r in Story_block Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done`
2. In /tmp/rev-perf: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/110-prompt.txt)" > ~/story_suite/vm-results/110-sol.md 2>&1`
3. Report as VM JOB 110. 4. Delete /tmp/rev-perf.
