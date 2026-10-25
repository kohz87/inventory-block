# 070: Sol review of track A (RB #145, SD #134) (read-only)

Sol at xhigh. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-a && mkdir /tmp/rev-a && cd /tmp/rev-a && git clone -q -b track-a https://github.com/kohz87/rpg_battle.git && git clone -q -b track-a https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/Story_block.git` (RB 55df021+, SD b518b47+, SB main). `npm ci` in each.
2. In /tmp/rev-a: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/070-prompt.txt)" > ~/story_suite/vm-results/070-sol.md 2>&1`
3. Report as VM JOB 070. 4. Delete /tmp/rev-a.
