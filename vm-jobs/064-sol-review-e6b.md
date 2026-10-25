# 064: Sol review of Story Block track E6b (branch track-e/e6b-history) (read-only)

Per QUEUE.md (reviews before writing). Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first;
single tests or small scripts only.

1. `rm -rf /tmp/rev-e6b && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev-e6b && git -C /tmp/rev-e6b checkout -q track-e/e6b-history`.
   Print HEAD (f4214f4 or later). `npm ci`. Also clone kohz87/rpg_battle main (febdef5 or later) into /tmp/rev-e6b-rb for item 4.
2. In /tmp/rev-e6b: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/064-prompt.txt)" > ~/story_suite/vm-results/064-sol.md 2>&1`
3. Report as VM JOB 064: the head, the account, the verdict, and every BLOCKING item in full with both tags.
4. Delete both clones.
