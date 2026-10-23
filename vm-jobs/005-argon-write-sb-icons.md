# 005: Antigravity argon-high writes Story Block's icon set (UI step 7)

This job lifts the read-only rule for Antigravity in one place: it may edit files in the clone below, and you may push the one branch named here. Nothing else changes: no PR, no merge, no comments, no other branch, no other repo.

The job can take a while. If you can, run step 3 in the background and carry on with later jobs, then finish steps 4–7 when it returns.

1. Make a fresh copy:
   `rm -rf /tmp/icons7 && git clone -q https://github.com/kohz87/Story_block.git /tmp/icons7 && git -C /tmp/icons7 checkout -q -b ui-7-icons origin/v2`
   Print its HEAD. It should be 69c6145 or later.
2. Run `npm ci` (or `npm install` if there is no lockfile) and `npm run -s test:dot` once, and note the result as the baseline.
3. In /tmp/icons7, run Antigravity as the writer:
   `agy -p "$(cat ~/story_suite/inventory-block/vm-jobs/005-prompt.txt)" --model gemini-4-argon-high > ~/story_suite/vm-results/005-argon.md 2>&1`
   It needs network access to github.com to fetch the game-icons SVGs. If agy asks for approval to edit files or run npm in /tmp/icons7, allow it there only.
4. Check its work yourself in /tmp/icons7. Report any failure rather than fixing it:
   - `git log --oneline origin/v2..HEAD` (at least one commit);
   - `npm run -s test:dot` and the repo's check or lint script both pass;
   - `git grep -n "innerHTML\|insertAdjacentHTML\|DOMParser" -- src/v2/view/icons` prints nothing;
   - `git grep -n -i "gemini\|claude\|opus\|sonnet\|haiku\|argon" -- . ':!node_modules'` shows no new lines from this branch (compare against origin/v2);
   - `ICONS-CREDITS.md` exists and names the authors.
5. If every check passes: `git -C /tmp/icons7 push -u origin ui-7-icons`. If the push is refused (no credentials), don't work around it. Say so in the report and keep /tmp/icons7.
6. Report as VM JOB 005:
   - the head SHA;
   - the baseline and final test results;
   - the check results from step 4;
   - the list of icon ids with their authors;
   - whether the push worked.
   Put the full argon output in the results file, not the message.
7. Delete /tmp/icons7 only if the push worked.

## Update (after the first VM report)
- Correct call: don't use --dangerously-skip-permissions. Wait for the VM owner to add a narrow allow rule for agy's command tool, scoped to /tmp/icons7. Then re-run step 3.
- Commit trailer: the prompt no longer asks for one, so leave commit messages without trailer lines.
- GO (the VM owner granted agy's command permission, 23 Oct ~11:40 SGT): re-run step 3 in the existing /tmp/icons7 now, then do steps 4–7.
- GO 2 (the VM owner has added Antigravity's permissions.allow rules, ~12:10 SGT):
  - First a quick check in /tmp/icons7: `agy -p "run: npm --version and git status, then stop"`. If it is still refused, report that and stop.
  - If it works, re-run step 3, then do steps 4–7.
  - Antigravity must not push. You do the push in step 5, after the checks.
