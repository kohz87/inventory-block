# 024: Sol review of Story Block PR #194, track E5 proof and evidence (read-only)

Run now, alongside job 014 (USER: Sol has 66% of its 5-hour window; Studio is at S6). Use Sol at xhigh. Nothing is
edited or pushed. If Codex stops on quota, stop cleanly, say so, and resume in the next window. Job 023 (the E1
re-check) is separate and comes later, when the lead adds its GO.

1. `rm -rf /tmp/rev194 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194 && git -C /tmp/rev194 checkout -q track-e/e5-evidence`.
   Print HEAD (d042c7f or later). Clone kohz87/rpg_battle, Story_director, npc_state_delta (main) into /tmp/rev194-mods/.
2. `npm ci` (or `npm install`), `npm run -s check`, `npm run -s test:dot` in /tmp/rev194.
3. In /tmp/rev194: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/024-prompt.txt)" > ~/story_suite/vm-results/024-sol.md 2>&1`
4. Report as VM JOB 024: the head, the check/test results, the verdict and every BLOCKING item in full in the message,
   the rest as headlines.
5. Delete /tmp/rev194 and /tmp/rev194-mods.
