# 059: Sol re-check of Story Studio PR #4 after the 058 fixes (read-only)

Per QUEUE.md (reviews before writing). Sol at xhigh. Nothing edited or pushed. README test rule: no suite run first;
single tests or small scripts only. Playwright is installed on the VM; opening the built file from file:// is allowed.

1. `rm -rf /tmp/rev-studio4b && git clone -q https://github.com/kohz87/Story_studio.git /tmp/rev-studio4b && git -C /tmp/rev-studio4b checkout -q studio-2`.
   Print HEAD (bf12771 or later). `npm ci`. For Playwright set `TMPDIR=/tmp/rev-studio4b-tmp` (mkdir it) so its profile is writable.
2. In /tmp/rev-studio4b: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/059-prompt.txt)" > ~/story_suite/vm-results/059-sol.md 2>&1`
3. Report as VM JOB 059: the head, the account, the verdict, and every BLOCKING item in full with both tags.
4. Delete /tmp/rev-studio4b.
