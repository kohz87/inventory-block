# 043: track E6b, active history and boundaries (Sol writes) — WAITING until E6a (SB #195) merges

USER: more writing moves to the VM. This job lifts the read-only rule for one work folder and one branch: Codex may edit
/tmp/e6bwork and push branch `track-e/e6b-history` of kohz87/Story_block. No PR, no merge, no other branch or repo. Sol
writes it itself (no agy). README test rule (no baseline; revert-to-fail on new test files only; full runs once at the end).
On a quota stop, commit WIP ("WIP E6b <part>", no trailer lines), push, report.

1. `rm -rf /tmp/e6bwork && mkdir /tmp/e6bwork && cd /tmp/e6bwork && git clone -q https://github.com/kohz87/Story_block.git && cd Story_block && git checkout -q -b track-e/e6b-history origin/main`
   (main must contain E1, E5 and E6a; print HEAD and `git log --oneline -5`; if E6a isn't in main yet, stop and report).
   `npm ci`. Clone kohz87/rpg_battle, Story_director, npc_state_delta (main) into /tmp/e6bwork/mods for the module suites.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/043-prompt.txt)" > ~/story_suite/vm-results/043-codex.md 2>&1`
3. Check its work yourself and report failures rather than fixing them: `git log --oneline origin/main..track-e/e6b-history`, `npm run -s check`, `npm run -s test:dot` once (summary + failures), `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 043: head, results, per part done/left, anything Sol stopped on. Keep /tmp/e6bwork until ACK.

## Reconcile + Resume 1 (lead, 02:15 UTC, after A ran out at 02:11)
LEAD DECISION: keep origin/track-e/e6b-history as is (5494fd9 part 1 active history, e31667b part 2 head selection + callback bounds: the job's own per-part pushes). Do not push WIP 07d8b93; never force-push.
1. Save the WIP's difference from the PUSHED head (not from main): `git diff e31667b 07d8b93 > ~/story_suite/vm-results/043-wip-vs-e31667b.patch` and its `--stat`; report the stat. Point the local branch at the remote: `git checkout -B track-e/e6b-history origin/track-e/e6b-history` (tag the WIP locally `wip-e6b-07d8b93`).
2. Resume 1 on account B (now): re-run step 2 with 043-prompt.txt plus this line appended: "Resume 1: parts 1 (5494fd9) and 2 (e31667b) are pushed. A local WIP diff from the stopped run is at ~/story_suite/vm-results/043-wip-vs-e31667b.patch: read it, keep only hunks for parts 3–5 that aren't already in e31667b, drop the rest. First merge origin/main into the branch (merge commit, no rebase): ctx-seams is now on main. Then continue with part 3 (ctx.clockBoundary), part 4 (savepoint.contract), part 5 (E6a follow-ups), and part 6 (small, from the RB slice 1 merge): a replay guard that throws — e.g. it calls a query its module did not declare in replayQueries — must still fail closed but record a store Problem naming the module, the guard kind and the refused query, instead of silently retiring the block; test it. Commit and push after each green part."
3. Recurring problem (029, 058, 060, 062, 043): the codex checkout's .git turns read-only, so commits get pushed from a side copy and the checkout's HEAD goes stale. Before Resume 1, make the work folder's .git writable for the codex sandbox (e.g. keep the clone under the workspace-write root, or add `-c sandbox_workspace_write.writable_roots=[...]` for the .git path), and check `git -C <work> log -1` matches origin after each push.
