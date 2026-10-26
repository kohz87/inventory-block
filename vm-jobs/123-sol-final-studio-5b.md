# 123: Sol FINAL review: Studio 5b code-module scaffolding (studio/part-5b 9efc215) (read-only) — READY — LEAD GO-AHEAD (first free account)
"Read-only" = nothing to GitHub. The workspace-write sandbox is for npm ci / tests in /tmp/s5b123 only.
1. `rm -rf /tmp/s5b123 && mkdir /tmp/s5b123 && cd /tmp/s5b123 && git clone -q -b studio/part-5b https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/Story_block.git && git -C Story_block checkout -q a482fd0`
2. In /tmp/s5b123: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/123-prompt.txt)" > ~/story_suite/vm-results/123-codex.md 2>&1`
3. Report as VM JOB 123 (write vm-results/123.md). 4. Delete /tmp/s5b123.
