# 108: Sol early review — data-module checker (SB step 1) + Studio 5a build/scan (read-only) — READY (A, now)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-dm1 && mkdir /tmp/rev-dm1 && cd /tmp/rev-dm1 && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git`
2. In /tmp/rev-dm1: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/108-prompt.txt)" > ~/story_suite/vm-results/108-sol.md 2>&1`
3. Report as VM JOB 108. 4. Delete /tmp/rev-dm1.
