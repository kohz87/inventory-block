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
