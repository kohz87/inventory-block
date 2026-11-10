# 015: Sol revises the RB phase 0 draft (v2), from its own review in job 013

This job lifts the read-only rule for one clone and one branch: Codex may edit two files in /tmp/p0v2/inventory-block,
and you (not Codex) push branch `vm-phase0-v2` of kohz87/inventory-block. Nothing else: no PR, no merge, no other
branch or repo; the four code clones are read-only references.

1. Fresh clones side by side:
   `rm -rf /tmp/p0v2 && mkdir /tmp/p0v2 && cd /tmp/p0v2`
   `git clone -q -b claude/hopeful-babbage-tipaw8 https://github.com/kohz87/inventory-block.git && git -C inventory-block checkout -q -b vm-phase0-v2`
   `for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q -b v2 https://github.com/kohz87/$r.git; done`
   Print each HEAD (inventory-block 425ac0b or later; SB 47b2806, RB c24e93d, SD 8072d60, NSD b906544, or later).
   Copy the full 013 review next to the notes: `cp ~/story_suite/vm-results/013-sol.md /tmp/p0v2/013-sol.md`.
2. In /tmp/p0v2, no network needed:
   `codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/015-prompt.txt)" > ~/story_suite/vm-results/015-sol.md 2>&1`
3. Check it yourself, and report a failure rather than fixing it:
   - `git -C /tmp/p0v2/inventory-block status --short` shows only `suite-notes/RB_PHASE0.md` and, if made,
     `suite-notes/RB_PHASE0_APIS.md`;
   - `git -C /tmp/p0v2/<each code repo> status --short` prints nothing (they must be untouched);
   - `grep -n -i -E "gemini|codex|claude|sonnet|opus|haiku|gpt" suite-notes/RB_PHASE0*.md` prints nothing new.
4. Commit in /tmp/p0v2/inventory-block: `git add suite-notes/RB_PHASE0.md suite-notes/RB_PHASE0_APIS.md 2>/dev/null; git commit -m "RB phase 0 draft v2 (from the 013 review)"`
   (no trailer lines), then `git push -u origin vm-phase0-v2`. If the push is refused, say so and keep /tmp/p0v2.
5. Report as VM JOB 015: the heads, the pushed commit, the check results, and Sol's closing summary (what it changed per
   blocking item, and its list of proposals that need the user). Full output stays in the results file.
6. Delete /tmp/p0v2 only if the push worked.
