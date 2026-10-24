# 037: Sol fifth re-check of Story Block PR #191 (E1), round 6 (read-only)

Per QUEUE.md. Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only.
The replay fuzz is now in the repo: `scripts/fuzz-replay.mjs` (usage in its header).

1. `rm -rf /tmp/rev191f && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191f && git -C /tmp/rev191f checkout -q track-e/e1-replay`.
   Print HEAD (95955ca or later). `npm ci` (or `npm install`).
2. In /tmp/rev191f: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/037-prompt.txt)" > ~/story_suite/vm-results/037-sol.md 2>&1`
3. Report as VM JOB 037: the head, the account, the verdict, each item's HOLDS/NOT FIXED, every BLOCKING item in full, and each finding's tag.
4. Delete /tmp/rev191f.
