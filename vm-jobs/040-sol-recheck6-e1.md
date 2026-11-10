# 040: Sol re-check of Story Block PR #191 (E1), round 7 (read-only)

Per QUEUE.md. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests, small scripts or
`node scripts/fuzz-replay.mjs` only.

1. `rm -rf /tmp/rev191g && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191g && git -C /tmp/rev191g checkout -q track-e/e1-replay`.
   Print HEAD (f33167f or later). `npm ci` (or `npm install`).
2. In /tmp/rev191g: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/040-prompt.txt)" > ~/story_suite/vm-results/040-sol.md 2>&1`
3. Report as VM JOB 040: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full with both tags.
4. Delete /tmp/rev191g.
