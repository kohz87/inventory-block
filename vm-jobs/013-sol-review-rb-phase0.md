# 013: Sol review of the RB rebuild phase 0 draft (read-only)

Use Sol 6.1 at xhigh, as in job 011. No code is written; this checks a design document against the code.

1. Fresh clones of the v2 heads, side by side:
   `rm -rf /tmp/p0 && mkdir /tmp/p0 && cd /tmp/p0 && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q -b v2 https://github.com/kohz87/$r.git; done`
   Print each HEAD (SB 47b2806, RB c24e93d, SD 8072d60, NSD b906544, or later).
2. `git -C ~/story_suite/inventory-block pull -q` so suite-notes/RB_PHASE0.md and V2_LOG.md are current (3ab00c3 or later).
3. In /tmp/p0: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/013-prompt.txt)" > ~/story_suite/vm-results/013-sol.md 2>&1`
4. Report as VM JOB 013: the four heads, the verdict, every BLOCKING item in full in the message, the rest as headlines.
5. Delete /tmp/p0.
