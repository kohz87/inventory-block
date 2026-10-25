# 079: stage 5 — a fresh chat can pin a rules pack (Sol writes) — READY (after 078 or in parallel)

Lifts the read-only rule for /tmp/pin and NEW branch `stage5/pin` in kohz87/rpg_battle (and kohz87/Story_block only if the
host needs a change — then the same branch name there). No PR, no merge, never force-push. README test rule.
1. `rm -rf /tmp/pin && mkdir /tmp/pin && cd /tmp/pin && for r in Story_block rpg_battle Story_director; do git clone -q https://github.com/kohz87/$r.git; done` (main; .git writable). `git -C rpg_battle checkout -b stage5/pin`.
2. In /tmp/pin: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/079-prompt.txt)" > ~/story_suite/vm-results/079-codex.md 2>&1`
3. Check: `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names. Report as VM JOB 079.

## Resume 1 (lead, 12:12 UTC, after "Selected model is at capacity" at 12:08)
WIP is pushed: rpg_battle stage5/pin 01599b8 (4 commits, unchecked). Fresh clone of that branch (.git writable), then re-run step 2 with 079-prompt.txt plus: "Resume 1: steps so far are pushed at 01599b8 but unchecked (the run stopped on model capacity). First run npm run check and the new pin tests, fix what fails, finish what's left of the design, then the final runs once." Commit author "xen" is the VM's normal identity: fine.
