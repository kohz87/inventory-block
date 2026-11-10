# 046: Sol re-check of Story Block PR #194 (E5), round 7 (read-only)

Per QUEUE.md. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only.

1. `rm -rf /tmp/rev194g && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194g && git -C /tmp/rev194g checkout -q track-e/e5-evidence`.
   Print HEAD (3467c97 or later). `npm ci` (or `npm install`).
2. In /tmp/rev194g: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/046-prompt.txt)" > ~/story_suite/vm-results/046-sol.md 2>&1`
3. Report as VM JOB 046: the head, the account, the verdict, every BLOCKING item in full with both tags, and — if you can — the exact chat/record sequence of your earlier swap repro (blocker A from job 039), since the writer could not reproduce it.
4. Delete /tmp/rev194g.
