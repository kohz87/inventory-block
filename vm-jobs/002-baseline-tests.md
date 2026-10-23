# 002: update the repos and run all four test suites (no pushes)

1. Update each module repo to the latest v2. This is a read-only update; never commit or push:
   `for r in Story_block rpg_battle Story_director npc_state_delta; do git -C ~/story_suite/$r fetch -q origin v2 && git -C ~/story_suite/$r checkout -q v2 && git -C ~/story_suite/$r reset -q --hard origin/v2; done`
   Print each repo's short HEAD afterwards.
   If a repo has local changes or commits that `reset --hard` would lose, STOP and report instead.
2. Run each repo's suite, one at a time (not in parallel), timing each:
   - Story_block: `npm run -s check` then `npm run -s test:dot`
   - rpg_battle, Story_director: `npm run -s test:dot` (also `npm run -s check` if the script exists)
   - npc_state_delta: `npm run -s validate` then `npm run -s test:dot`
   No `npm install` is needed; these repos have no dependencies. If one says otherwise, report it.
3. Run the four again with the module testkits taken from the live Story Block, to catch drift:
   - Copy each module to /tmp/vm-sync/<name> (`cp -a`).
   - Run `node ~/story_suite/Story_block/scripts/sync-testkit.mjs /tmp/vm-sync/<name>` on the copy.
   - Run `npm run -s test:dot` in the copy, then delete /tmp/vm-sync.
   Never sync into the real checkouts.
4. Report as VM JOB 002:
   - per repo: HEAD, pass/fail, the test counts if printed, and the time taken;
   - the names of any failing tests with the first error line;
   - known noise you can ignore: rpg_battle's "1 crowns" todo, and the repeated "'features' is not a module field" warning.
   Do not start SillyTavern for this job.
