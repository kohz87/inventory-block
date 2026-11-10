# 030: Sol third re-check of Story Block PR #191 (E1), round 4 fixes (read-only)

Run in the next free Codex window, before 027 and 029 (028 and 030 can run side by side: separate clones). Sol at xhigh.
Nothing edited or pushed. README test rule: no suite run first; single tests or small scripts only to reproduce.

1. `rm -rf /tmp/rev191d && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev191d && git -C /tmp/rev191d checkout -q track-e/e1-replay`.
   Print HEAD (03c3ca0 or later). `npm ci` (or `npm install`).
2. In /tmp/rev191d: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/030-prompt.txt)" > ~/story_suite/vm-results/030-sol.md 2>&1`
3. Report as VM JOB 030: the head, the account, the verdict, each item's HOLDS/NOT FIXED, and every BLOCKING item in full.
4. Delete /tmp/rev191d.
