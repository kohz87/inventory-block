# 021: Sol's scoped check of phase 0 v4 before the freeze (read-only)

A narrow check of what changed in v4, not a full review. Nothing is edited or pushed. Findings go to the lead, who fixes
them during the freeze; no further review round follows.

1. Fresh clones in /tmp/p0c: inventory-block on `claude/hopeful-babbage-tipaw8` (ccbce81 or later) and the four
   modules on `v2` (as job 013, step 1). Print every HEAD. `cp ~/story_suite/vm-results/019-sol.md /tmp/p0c/019.md`
2. In /tmp/p0c: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/021-prompt.txt)" > ~/story_suite/vm-results/021-sol.md 2>&1`
3. Report as VM JOB 021: the heads, the verdict line, every MUST-FIX item in full in the message, the rest as
   headlines, and the wall time.
4. Delete /tmp/p0c.
