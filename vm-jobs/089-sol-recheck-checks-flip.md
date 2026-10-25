# 089: Sol re-check of the checks-flip fixes (SB #201 1309def, RB #148 91c63a2, SD #135 224cc79) (read-only) — READY (A, parallel with 088 on B)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-flip2 && mkdir /tmp/rev-flip2 && cd /tmp/rev-flip2 && git clone -q -b stage5/checks-flip https://github.com/kohz87/Story_block.git && for r in rpg_battle Story_director; do git clone -q -b track-b/checks-flip https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git && cp ~/story_suite/vm-results/083.md ~/story_suite/vm-results/087-codex.md /tmp/rev-flip2/ 2>/dev/null; true`
2. In /tmp/rev-flip2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/089-prompt.txt)" > ~/story_suite/vm-results/089-sol.md 2>&1`
3. Report as VM JOB 089. 4. Delete /tmp/rev-flip2.
