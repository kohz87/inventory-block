# 116: Sol review — Studio 5a data-module authoring + simulator (read-only) — READY (first free account)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-5a && mkdir /tmp/rev-5a && cd /tmp/rev-5a && git clone -q -b studio/part-5a https://github.com/kohz87/Story_studio.git && git clone -q -b stage6/data-modules https://github.com/kohz87/Story_block.git`
2. In /tmp/rev-5a: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/116-prompt.txt)" > ~/story_suite/vm-results/116-sol.md 2>&1`
3. Report as VM JOB 116. 4. Delete /tmp/rev-5a.
