# 085: Sol short review of the pin flow (SB stage5/pin, RB stage5/pin) (read-only)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-pin && mkdir /tmp/rev-pin && cd /tmp/rev-pin && git clone -q -b stage5/pin https://github.com/kohz87/Story_block.git && git clone -q -b stage5/pin https://github.com/kohz87/rpg_battle.git` (SB 71ea5a3+, RB 69ef713+).
2. In /tmp/rev-pin: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/085-prompt.txt)" > ~/story_suite/vm-results/085-sol.md 2>&1`
3. Report as VM JOB 085. 4. Delete /tmp/rev-pin.
