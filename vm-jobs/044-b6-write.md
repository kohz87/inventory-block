# 044: track B6, death, return and wipe batches in RPG Battle (Sol writes) — WAITING until E6a (SB #195) merges

Lifts the read-only rule for /tmp/b6work and branch `track-b/death-return` of kohz87/rpg_battle (based on the newest
track-b slice branch the lead names in QUEUE.md when this job goes READY). No PR, no merge, no other branch or repo. Sol writes
it itself. README test rule. On a quota stop, commit WIP ("WIP B6 <part>", no trailer lines), push, report.

1. Clone RB, check out the base branch named in QUEUE.md, `git checkout -b track-b/death-return`. Clone Story_block main
   (with E1, E5, E6a) and re-sync RB's testkit from it (`node <SB>/scripts/sync-testkit.mjs <RB>`; vendor-only commit).
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/044-prompt.txt)" > ~/story_suite/vm-results/044-codex.md 2>&1`
3. Check: `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names. Report as VM JOB 044.

## Resume 1 (lead, 02:16 UTC, after A ran out at 02:12)
WIP is pushed: rpg_battle track-b/death-return at 836ac61 (from rules-slice4 c4c4efd, testkit from SB main c36b355).
- On account B, after or alongside 043's Resume 1: clone that branch into /tmp/b6work (fresh), make sure .git is writable for the codex sandbox (043 Resume 1 step 3), then re-run step 2 with 044-prompt.txt plus this line appended: "Resume 1: a partial WIP is pushed at 836ac61 (10 src/v2 files, src/v2/death/, tests/v2/death/), unchecked — no tests were run after the stop. First run the new death tests and npm run check, review the WIP against the brief and fix it, then finish the remaining B6 parts, committing and pushing after each green part (no force)."
