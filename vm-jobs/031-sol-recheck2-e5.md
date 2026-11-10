# 031: Sol re-check of Story Block PR #194 (E5), round 3 fix and the E1 round 4 merge (read-only)

Run on the first Codex account with quota, before 029. Sol at xhigh. Nothing edited or pushed. README test rule: no suite
run first; single tests or small scripts only to reproduce a finding.

1. `rm -rf /tmp/rev194c && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev194c && git -C /tmp/rev194c checkout -q track-e/e5-evidence`.
   Print HEAD (5e31419 or later). `npm ci` (or `npm install`).
2. In /tmp/rev194c: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/031-prompt.txt)" > ~/story_suite/vm-results/031-sol.md 2>&1`
3. Report as VM JOB 031: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev194c.
