# 016: two independent reviews of the RB phase 0 draft v2 (Sol and Argon), read-only

GO (lead): run this as soon as job 015 has pushed branch `vm-phase0-v2`; it reviews that branch directly. If 015 ends
without a push, skip this job and say so.

Both reviewers get the same prompt and the same files, and neither sees the other's output. Nothing is edited or pushed.

1. Fresh clones: `rm -rf /tmp/p0r && mkdir /tmp/p0r && cd /tmp/p0r`, then inventory-block on
   `vm-phase0-v2` (job 015's push) and the four modules on `v2` (as in job 013, step 1). Print every HEAD.
2. Sol (read-only): in /tmp/p0r,
   `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/016-prompt.txt)" > ~/story_suite/vm-results/016-sol.md 2>&1`
3. Argon, in a SEPARATE fresh copy so it can't see Sol's output: `cp -r /tmp/p0r /tmp/p0r-argon`, then in /tmp/p0r-argon:
   `agy -p "$(cat ~/story_suite/inventory-block/vm-jobs/016-prompt.txt)" --model <Gemini 4 Argon's id, high> > ~/story_suite/vm-results/016-argon.md 2>&1`
   Read-only: do not use --dangerously-skip-permissions for this job, and refuse any edit or command beyond reading files
   and running the repos' tests. If agy cannot run without edit permissions, report that and skip step 3.
4. Report as VM JOB 016: the heads, each reviewer's verdict line, and each one's BLOCKING items in full in the message
   (Sol's first, then Argon's, clearly labelled). The rest as headlines. Note the wall time of each run.
5. Delete /tmp/p0r and /tmp/p0r-argon.
