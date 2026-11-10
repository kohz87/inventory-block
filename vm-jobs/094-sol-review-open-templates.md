# 094: Sol review of open templates (SB #204, SD #136, RB #151) (read-only) — READY (parallel with 093)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-ot && mkdir /tmp/rev-ot && cd /tmp/rev-ot && for r in Story_block rpg_battle Story_director; do git clone -q -b stage5/open-templates https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/rev-ot: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/094-prompt.txt)" > ~/story_suite/vm-results/094-sol.md 2>&1`
3. Report as VM JOB 094. 4. Delete /tmp/rev-ot.
