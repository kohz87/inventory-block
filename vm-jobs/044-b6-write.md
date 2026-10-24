# 044: track B6, death, return and wipe batches in RPG Battle (Sol writes) — WAITING until E6a (SB #195) merges

Lifts the read-only rule for /tmp/b6work and branch `track-b/death-return` of kohz87/rpg_battle (based on the newest
track-b slice branch the lead names in QUEUE.md when this job goes READY). No PR, no merge, no other branch or repo. Sol writes
it itself. README test rule. On a quota stop, commit WIP ("WIP B6 <part>", no trailer lines), push, report.

1. Clone RB, check out the base branch named in QUEUE.md, `git checkout -b track-b/death-return`. Clone Story_block main
   (with E1, E5, E6a) and re-sync RB's testkit from it (`node <SB>/scripts/sync-testkit.mjs <RB>`; vendor-only commit).
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/044-prompt.txt)" > ~/story_suite/vm-results/044-codex.md 2>&1`
3. Check: `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names. Report as VM JOB 044.
