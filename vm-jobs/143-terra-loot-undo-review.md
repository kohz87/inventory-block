# 143: Terra REVIEW of Story Block 2.6.1 (loot-take undo fix) on stage13/loot-undo df16025 (read-only) — READY — LEAD GO-AHEAD (any account with credit; fresh session, fresh clone)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go143 && mkdir /tmp/go143 && cd /tmp/go143 && git clone -q -b stage13/loot-undo https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. `CODEX_HOME=<account with credit> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/143-prompt.txt)" > ~/story_suite/vm-results/143-codex.md 2>&1`
3. Report as VM JOB 143. Delete /tmp/go143.
