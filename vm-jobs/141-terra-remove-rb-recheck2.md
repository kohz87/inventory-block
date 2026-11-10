# 141: Terra RE-CHECK of 140 on stage12/remove-rb (SB d3413fe, SD a124165, Studio 2e0a4d2, NSD 42ad1c4; read-only) — READY — LEAD GO-AHEAD (any account with credit; fresh session, fresh clone)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go141 && mkdir /tmp/go141 && cd /tmp/go141 && for r in Story_block Story_director Story_studio npc_state_delta; do git clone -q -b stage12/remove-rb https://github.com/kohz87/$r.git; done`
2. `CODEX_HOME=<account with credit> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/141-prompt.txt)" > ~/story_suite/vm-results/141-codex.md 2>&1`
3. Report as VM JOB 141. Delete /tmp/go141.
