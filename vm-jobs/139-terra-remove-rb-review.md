# 139: Terra REVIEW of the RB removal (SB f74bab2, SD b6201b9, Studio 4f2023b on stage12/remove-rb; read-only) — READY FROM 17:25 UTC 28 Oct ON ACCOUNT A — LEAD GO-AHEAD
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`. Account A (reviewer ≠ builder account B). Fresh clone, not /tmp/go138.
1. `rm -rf /tmp/go139 && mkdir /tmp/go139 && cd /tmp/go139 && for r in Story_block Story_director Story_studio; do git clone -q -b stage12/remove-rb https://github.com/kohz87/$r.git; done && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go139: `CODEX_HOME=<account A> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/139-prompt.txt)" > ~/story_suite/vm-results/139-codex.md 2>&1`
3. Report as VM JOB 139. Delete /tmp/go139. /tmp/go138 can be deleted now (the lead says so).
