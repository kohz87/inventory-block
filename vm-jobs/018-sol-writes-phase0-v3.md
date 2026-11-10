# 018: Sol writes the RB phase 0 draft v3, from both reviews of v2 (job 016)

START TIME: not before 2026-10-23 23:45 SGT (15:45 UTC), when Codex's 5-hour window has reset. If you can schedule it,
schedule it for then; otherwise wait until then before step 2. When it pushes, start job 019 straight away.

This job lifts the read-only rule for one clone and one branch: Codex may edit two files in /tmp/p0v3/inventory-block,
and you (not Codex) push branch `vm-phase0-v3` of kohz87/inventory-block. Nothing else; the four code clones are
read-only references.

1. Fresh clones side by side:
   `rm -rf /tmp/p0v3 && mkdir /tmp/p0v3 && cd /tmp/p0v3`
   `git clone -q -b claude/hopeful-babbage-tipaw8 https://github.com/kohz87/inventory-block.git && git -C inventory-block checkout -q -b vm-phase0-v3`
   `for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q -b v2 https://github.com/kohz87/$r.git; done`
   Print each HEAD (inventory-block: the commit with this file or later; the code heads as in 016 or later).
   Copy the full reviews next to the notes: `cp ~/story_suite/vm-results/016-sol.md /tmp/p0v3/016-S.md; cp ~/story_suite/vm-results/016-argon.md /tmp/p0v3/016-A.md; cp ~/story_suite/vm-results/013-sol.md /tmp/p0v3/013.md`
2. In /tmp/p0v3, no network needed:
   `codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/018-prompt.txt)" > ~/story_suite/vm-results/018-sol.md 2>&1`
3. Checks, as in job 015 step 3 (only suite-notes/RB_PHASE0.md and suite-notes/RB_PHASE0_APIS.md changed; code repos
   untouched; no model or tool names in the files).
4. Commit "RB phase 0 draft v3 (from the 016 reviews)" (no trailer lines), `git push -u origin vm-phase0-v3`.
   If refused, say so, keep /tmp/p0v3, and do not start 019.
5. Report as VM JOB 018: heads, the pushed commit, the checks, and Sol's closing summary. Then start job 019.
6. Delete /tmp/p0v3 only if the push worked.
