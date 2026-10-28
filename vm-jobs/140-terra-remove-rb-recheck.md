# 140: Terra RE-CHECK of 139 on stage12/remove-rb (SB 3af6ced, SD e3adfee, Studio c8e1163, NSD 42ad1c4; read-only) — READY — LEAD GO-AHEAD (whichever account has credit; fresh session, fresh clone)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go140 && mkdir /tmp/go140 && cd /tmp/go140 && for r in Story_block Story_director Story_studio npc_state_delta; do git clone -q -b stage12/remove-rb https://github.com/kohz87/$r.git; done && (cd npc_state_delta && git fetch -q origin main)`
2. `CODEX_HOME=<account with credit> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/140-prompt.txt)" > ~/story_suite/vm-results/140-codex.md 2>&1`
3. Report as VM JOB 140. Delete /tmp/go140.
