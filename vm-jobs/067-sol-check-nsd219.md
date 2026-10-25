# 067: Sol final check of NSD PR #219 against Story Block main (read-only)

Sol at xhigh. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-nsd219 && mkdir /tmp/rev-nsd219 && cd /tmp/rev-nsd219 && git clone -q https://github.com/kohz87/npc_state_delta.git nsd && git -C nsd checkout -q track-b/nsd-participant && git clone -q https://github.com/kohz87/Story_block.git sb`
   (NSD HEAD 34e67af or later; SB main fa1853d or later). `npm ci` in both. In a scratch COPY of nsd, re-vendor the testkit from sb (`node sb/scripts/sync-testkit.mjs --to <copy>`) to test against the merged host; never push it.
2. In /tmp/rev-nsd219: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/067-prompt.txt)" > ~/story_suite/vm-results/067-sol.md 2>&1`
3. Report as VM JOB 067. 4. Delete /tmp/rev-nsd219.
