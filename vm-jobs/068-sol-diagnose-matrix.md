# 068: Sol diagnosis of the shared matrix failures (read-only)

Sol at high. Nothing edited or pushed.
1. `rm -rf /tmp/mx && mkdir /tmp/mx && cd /tmp/mx && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q https://github.com/kohz87/$r.git; done` (all main). `npm ci` in each.
2. In /tmp/mx: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/068-prompt.txt)" > ~/story_suite/vm-results/068-sol.md 2>&1`
3. Report as VM JOB 068. 4. Delete /tmp/mx.
