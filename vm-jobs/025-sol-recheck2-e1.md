# 025: Sol second re-check of Story Block PR #191 (E1), round 3 fixes (read-only)

Run now if Codex's window allows, alongside job 014; otherwise at the next window. Sol at xhigh. Nothing edited or
pushed. Per the README test rule: no suite run first (CI covers the head); run single tests only to reproduce a finding.

1. `rm -rf /tmp/rev191c && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191c && git -C /tmp/rev191c checkout -q track-e/e1-replay`.
   Print HEAD (f1d9eb5 or later). `npm ci` (or `npm install`).
2. In /tmp/rev191c: `codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/025-prompt.txt)" > ~/story_suite/vm-results/025-sol.md 2>&1`
3. Report as VM JOB 025: the head, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev191c.

SCHEDULE (USER: Codex has 6% of its 5-hour window left): don't start this now. Run it first thing at the next Codex reset, 22:22 SGT (14:22 UTC) today.
A Sol re-check of E5 (job 026) will follow in that same window, once E5 has merged E1.
