# 122: Sol quick review: authoring kit (SB + Studio `authoring-kit`) (read-only) — READY — LEAD GO-AHEAD (first free account)
1. `rm -rf /tmp/kit122 && mkdir /tmp/kit122 && cd /tmp/kit122 && git clone -q -b authoring-kit https://github.com/kohz87/Story_block.git && git clone -q -b authoring-kit https://github.com/kohz87/Story_studio.git`
2. In /tmp/kit122: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="medium" "$(cat ~/story_suite/inventory-block/vm-jobs/122-prompt.txt)" > ~/story_suite/vm-results/122-codex.md 2>&1`
3. Report as VM JOB 122 (write vm-results/122.md). 4. Delete /tmp/kit122.
