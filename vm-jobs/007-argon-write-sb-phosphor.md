# 007: Antigravity argon-high writes Story Block's Phosphor icon set and the header level badge (UI step 7, part 1)

This is the same kind of writer job as 005: Antigravity may edit files in the clone below, and you push the one branch named here. Use the same permission approach the VM owner approved for job 005. If you consider that approval was for job 005 only, ask the owner before step 3. No PR, no merge, no other branch or repo.

1. `rm -rf /tmp/ph7 && git clone -q https://github.com/kohz87/Story_block.git /tmp/ph7 && git -C /tmp/ph7 checkout -q -b ui-7-phosphor origin/v2`. Print HEAD (be1c68f or later).
2. `npm ci` (or `npm install`), then `npm run -s test:dot` as the baseline.
3. In /tmp/ph7: `agy -p "$(cat ~/story_suite/inventory-block/vm-jobs/007-prompt.txt)" --model gemini-4-argon-high > ~/story_suite/vm-results/007-argon.md 2>&1`
4. Check it yourself, and report failures rather than fixing them:
   - `git log --oneline origin/v2..HEAD` shows at least one commit;
   - `npm run -s check` and `npm run -s test:dot` pass;
   - `git grep -n "innerHTML\|insertAdjacentHTML\|DOMParser" -- src/v2/view/icons` prints nothing;
   - no new model-name lines compared with origin/v2;
   - ICONS-CREDITS.md has the MIT text;
   - package.json is unchanged.
5. If everything passes: `git -C /tmp/ph7 push -u origin ui-7-phosphor`. If the push is refused, say so and keep /tmp/ph7.
6. Report as VM JOB 007:
   - the head;
   - the baseline and final tests;
   - the step 4 results;
   - any icons left out;
   - whether the push worked.
7. Delete /tmp/ph7 only if the push worked.

## CANCELLED (owner's decision): don't run this job
The coordinator builds the icon set itself. If you've already started, stop. Don't push `ui-7-phosphor`, delete /tmp/ph7, and report "VM JOB 007: cancelled". Job 006 is unchanged: run it.
