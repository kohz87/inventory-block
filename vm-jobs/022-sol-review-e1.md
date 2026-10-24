# 022: Sol review of Story Block PR #191, track E1 replay core (read-only)

Run after job 014's current Codex work, or alongside it if Codex's window allows. Use Sol at xhigh. Nothing is edited
or pushed. If Codex stops on quota, schedule this for the next window and say so.

1. `rm -rf /tmp/rev191 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191 && git -C /tmp/rev191 checkout -q track-e/e1-replay`.
   Print HEAD (376634e or later). Clone kohz87/rpg_battle, Story_director, npc_state_delta (main) next to it in /tmp/rev191-mods/.
2. `npm ci` (or `npm install`), `npm run -s check`, `npm run -s test:dot` in /tmp/rev191.
3. In /tmp/rev191: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/022-prompt.txt)" > ~/story_suite/vm-results/022-sol.md 2>&1`
4. Report as VM JOB 022: the head, the check/test results, the verdict and every BLOCKING item in full in the message,
   the rest as headlines.
5. Delete /tmp/rev191 and /tmp/rev191-mods.
