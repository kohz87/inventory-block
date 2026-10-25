# 077: Sol re-check of track A after the 075 fixes (RB #145, SD #134) (read-only)

Sol at xhigh. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-a2 && mkdir /tmp/rev-a2 && cd /tmp/rev-a2 && git clone -q -b track-a https://github.com/kohz87/rpg_battle.git && git clone -q -b track-a https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/Story_block.git` (RB 2132a8d+, SD d4b5e03+, SB main). `npm ci` in each.
2. In /tmp/rev-a2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/077-prompt.txt)" > ~/story_suite/vm-results/077-sol.md 2>&1`
3. Report as VM JOB 077. 4. Delete /tmp/rev-a2.
