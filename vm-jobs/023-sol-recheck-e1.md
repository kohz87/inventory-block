# 023: Sol re-check of Story Block PR #191 (E1) after job 022's fixes (read-only)

Run now, alongside job 014 and job 024 if Codex's window allows; otherwise right after 024. Use Sol at xhigh. Nothing
is edited or pushed. If Codex stops on quota, stop cleanly, say so, and resume in the next window.

1. `rm -rf /tmp/rev191b && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191b && git -C /tmp/rev191b checkout -q track-e/e1-replay`.
   Print HEAD (3509636 or later). Clone kohz87/rpg_battle, Story_director, npc_state_delta (main) into /tmp/rev191b-mods/.
2. `npm ci` (or `npm install`), `npm run -s check`, `npm run -s test:dot` in /tmp/rev191b.
3. In /tmp/rev191b: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/023-prompt.txt)" > ~/story_suite/vm-results/023-sol.md 2>&1`
4. Report as VM JOB 023: the head, the check/test results, the verdict and every BLOCKING item in full in the message,
   the rest as headlines.
5. Delete /tmp/rev191b and /tmp/rev191b-mods.
