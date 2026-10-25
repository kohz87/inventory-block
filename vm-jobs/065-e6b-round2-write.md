# 065: E6b round 2 fixes from review 064 (Sol writes) — READY

Lifts the read-only rule for /tmp/e6bfix and branch `track-e/e6b-history` of kohz87/Story_block. No PR, no merge, no other
branch or repo, never force-push. Sol writes it itself. README test rule (no baseline; revert-to-fail on the new tests only;
full runs once at the end). On a quota stop, commit WIP ("WIP E6b round 2 <item>", no trailer lines), push, report.

1. `rm -rf /tmp/e6bfix && mkdir /tmp/e6bfix && cd /tmp/e6bfix && git clone -q https://github.com/kohz87/Story_block.git && cd Story_block && git checkout -q track-e/e6b-history`
   (HEAD f4214f4 or later; .git writable for the codex sandbox). `npm ci`. Clone rpg_battle, Story_director, npc_state_delta (main) into /tmp/e6bfix/mods.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/065-prompt.txt)" > ~/story_suite/vm-results/065-codex.md 2>&1`
3. Check: `git log --oneline f4214f4..HEAD`, `npm run -s check`, `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 065. Keep /tmp/e6bfix until ACK.
