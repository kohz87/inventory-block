# 026: Sol re-check of Story Block PR #194 (E5) after round 2 and the E1 merge (read-only)

Run right after job 025, in the same Codex window: on account B if it's set up, otherwise at the 22:22 SGT reset. Sol at
xhigh. Nothing edited or pushed. Per the README test rule: no suite run first (CI covers the head); run single tests or
small scripts only to reproduce a finding.

1. `rm -rf /tmp/rev194b && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194b && git -C /tmp/rev194b checkout -q track-e/e5-evidence`.
   Print HEAD (4f5b434 or later). `npm ci` (or `npm install`).
2. In /tmp/rev194b: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/026-prompt.txt)" > ~/story_suite/vm-results/026-sol.md 2>&1`
3. Report as VM JOB 026: the head, which account ran it, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev194b.
