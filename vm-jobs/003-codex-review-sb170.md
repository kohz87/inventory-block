# 003: Codex review of Story Block PR #170 (read-only)

PR: https://github.com/kohz87/Story_block/pull/170, branch `ui-5-gameview` into `v2`, head 4808057 or later. This is UI step 5: the game view header (src/v2/view/game-header.js, mounts/screen.js), the desktop tab row, the `.ss-section-label` block and the `--ss-rule` token, Home without its hero and Packs cards, equal-height rows with a "Show all" cap (screens/show-more.js), and denser phone glass.

1. Make a fresh review copy without touching ~/story_suite/Story_block:
   `rm -rf /tmp/rev170 && git clone -q https://github.com/kohz87/Story_block.git /tmp/rev170 && git -C /tmp/rev170 fetch -q origin pull/170/head:pr170 && git -C /tmp/rev170 checkout -q pr170`
   Print `git -C /tmp/rev170 log -1 --format=%h`.
2. Run `npm run -s check` and `npm run -s test:dot` in /tmp/rev170. Note pass/fail.
3. Run Codex read-only in /tmp/rev170 and save its output to ~/story_suite/vm-results/003-codex.md:
   `cd /tmp/rev170 && codex exec --sandbox read-only "$(cat ~/story_suite/inventory-block/vm-jobs/003-prompt.txt)" > ~/story_suite/vm-results/003-codex.md 2>&1`
   If that exact syntax fails, check `codex exec --help` and use the read-only equivalent. Never give Codex write or network-write access.
4. Report as VM JOB 003: the head reviewed, check and test results, and Codex's full findings. Paste them all; if they're very long, send the verdict and the BLOCKING items in the message and point to the file.
5. Delete /tmp/rev170.
