# 017: Argon reviews the phase 0 draft v1 (the same task as job 013), read-only

A side-by-side trial: Argon gets exactly job 013's prompt on exactly the files Sol reviewed, so the two reviews can be
compared directly. It can run now, alongside job 015. Nothing is edited or pushed.

1. Fresh clones: `rm -rf /tmp/p0a && mkdir /tmp/p0a && cd /tmp/p0a && for r in Story_block rpg_battle Story_director npc_state_delta; do git clone -q -b v2 https://github.com/kohz87/$r.git; done`
   Pin them to the heads Sol saw: `git -C Story_block checkout -q 47b2806`, `git -C rpg_battle checkout -q c24e93d`,
   `git -C Story_director checkout -q 8072d60`, `git -C npc_state_delta checkout -q b906544`.
   The notes as Sol saw them: `git clone -q -b claude/hopeful-babbage-tipaw8 https://github.com/kohz87/inventory-block.git notes && git -C notes checkout -q 4116ddb`.
2. The prompt is 013's, pointed at this copy: `sed 's#~/story_suite/inventory-block#/tmp/p0a/notes#g' ~/story_suite/inventory-block/vm-jobs/013-prompt.txt > /tmp/p0a/prompt.txt`
3. In /tmp/p0a: `agy -p "$(cat /tmp/p0a/prompt.txt)" --model <Gemini 4 Argon's id, high> > ~/story_suite/vm-results/017-argon.md 2>&1`
   Read-only: no --dangerously-skip-permissions; refuse any edit or command beyond reading files and running the repos'
   tests. If agy cannot run without edit permissions, report that and stop.
4. Report as VM JOB 017: the verdict line, every BLOCKING item in full in the message, the rest as headlines, and the
   wall time. Do not compare it with 013 yourself; the lead does that.
5. Delete /tmp/p0a.
