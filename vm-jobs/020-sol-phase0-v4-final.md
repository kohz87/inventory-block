# 020: Sol's last pass on the phase 0 draft (v4): seams only, internals to a track B backlog

The last document pass before the freeze: after this the lead checks it and freezes it; no further review round.
This job lifts the read-only rule for one clone and one branch: Codex may edit three files in /tmp/p0v4/inventory-block,
and you (not Codex) push branch `vm-phase0-v4` of kohz87/inventory-block. Nothing else; the code clones are read-only.

1. Fresh clones side by side (as job 018 step 1, folder /tmp/p0v4, new branch `vm-phase0-v4` off
   `claude/hopeful-babbage-tipaw8`, which now carries draft v3). Copy the review:
   `cp ~/story_suite/vm-results/019-sol.md /tmp/p0v4/019.md`
2. In /tmp/p0v4, no network needed:
   `codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/020-prompt.txt)" > ~/story_suite/vm-results/020-sol.md 2>&1`
3. Checks as job 018 step 3, except the allowed files are `suite-notes/RB_PHASE0.md`, `suite-notes/RB_PHASE0_APIS.md`
   and the new `suite-notes/RB_TRACK_B_DESIGN.md`.
4. Commit "RB phase 0 draft v4 (seams fixed; internals moved to the track B backlog)" (no trailer lines),
   `git push -u origin vm-phase0-v4`. If refused, say so and keep /tmp/p0v4.
5. Report as VM JOB 020: heads, the pushed commit, the checks, Sol's closing summary. No review job follows.
6. Delete /tmp/p0v4 only if the push worked.
