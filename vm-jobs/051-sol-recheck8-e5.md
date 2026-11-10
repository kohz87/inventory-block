# 051: Sol re-check of Story Block PR #194 (E5), round 9 (read-only)

Per QUEUE.md (reviews before writing: run it alongside 049 on B, before 029 Resume 3). Sol at xhigh. Nothing edited or pushed.
README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev194i && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194i && git -C /tmp/rev194i checkout -q track-e/e5-evidence`.
   Print HEAD (6ece80c or later). `npm ci` (or `npm install`).
2. In /tmp/rev194i: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/051-prompt.txt)" > ~/story_suite/vm-results/051-sol.md 2>&1`
3. Report as VM JOB 051: the head, the account, the verdict, and every BLOCKING item in full with both tags.
4. Delete /tmp/rev194i.
