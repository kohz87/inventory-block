# 055: ctx-seams round 5 fixes (Sol writes) — READY (run alongside 053/029 on A)

This job lifts the read-only rule for one work folder and one branch: Codex may edit /tmp/s197work and push branch
`track-e/ctx-seams` of kohz87/Story_block (PR #197). No new PR, no merge, no other branch or repo, never force-push.
Sol writes it itself (no agy). README test rule (no baseline; revert-to-fail on the new tests only; full runs once at the end).
On a quota stop, commit WIP ("WIP seams round 5", no trailer lines), push, report.

1. `rm -rf /tmp/s197work && mkdir /tmp/s197work && cd /tmp/s197work && git clone -q https://github.com/kohz87/Story_block.git && cd Story_block && git checkout -q track-e/ctx-seams`
   (print HEAD: 60d5677 or later). `npm ci`. Clone kohz87/rpg_battle, Story_director, npc_state_delta (main) into /tmp/s197work/mods for the module suites.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/055-prompt.txt)" > ~/story_suite/vm-results/055-codex.md 2>&1`
3. Check its work yourself and report failures rather than fixing them: `git log --oneline 60d5677..HEAD`, `npm run -s check`, `npm run -s test:dot` once (summary + failures), `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 055: head, results, what was fixed, anything Sol stopped on. Keep /tmp/s197work until ACK.
