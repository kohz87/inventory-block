# 083: Sol review of the checks flip (SB #201, RB #148, SD #135) (read-only)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-flip && mkdir /tmp/rev-flip && cd /tmp/rev-flip && git clone -q -b stage5/checks-flip https://github.com/kohz87/Story_block.git && git clone -q -b track-b/checks-flip https://github.com/kohz87/rpg_battle.git && git clone -q -b track-b/checks-flip https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git` (SB d300339+, RB 4e8220a+, SD a7e0b99+; the last commit on each is the test-only CI fix — vendored SD in RB tests, sibling-or-skip cross-repo test in SB/SD; review product code).
2. In /tmp/rev-flip: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/083-prompt.txt)" > ~/story_suite/vm-results/083-sol.md 2>&1`
3. Report as VM JOB 083. 4. Delete /tmp/rev-flip.
