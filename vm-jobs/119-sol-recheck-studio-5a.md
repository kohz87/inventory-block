# 119: Sol re-check — Studio 5a fixes (studio/part-5a 73aeefd) (read-only) — READY (first free account)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rck5 && mkdir /tmp/rck5 && cd /tmp/rck5 && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git && cp ~/story_suite/vm-results/116.md /tmp/rck5/`
2. In /tmp/rck5: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/119-prompt.txt)" > ~/story_suite/vm-results/119-sol.md 2>&1`
3. Report as VM JOB 119. 4. Delete /tmp/rck5.
