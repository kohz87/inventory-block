# 097: Sol review of Studio parts 2.5 + 3 (read-only) — READY (A, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-st && mkdir /tmp/rev-st && cd /tmp/rev-st && git clone -q -b studio/part-3 https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_block.git && git clone -q --depth 1 -b release https://github.com/SillyTavern/SillyTavern.git 2>/dev/null || true`
2. In /tmp/rev-st: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/097-prompt.txt)" > ~/story_suite/vm-results/097-sol.md 2>&1`
3. Report as VM JOB 097. 4. Delete /tmp/rev-st.
