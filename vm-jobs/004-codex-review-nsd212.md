# 004: Codex review of npc_state_delta PR #212 (read-only)

PR: https://github.com/kohz87/npc_state_delta/pull/212, branch `ui-4c-screens` into `v2`, head 6d69e31 or later. This is UI step 4c for Delta: the Dossiers browser (id `npc-state-delta/cast`, page API `globalThis.NPCStateDeltaCast`), compact present cards for Story Director's World → Here, the meters screen, social check modifier lines, and the notice, all on Story Block's glass design.

1. Make a fresh copy:
   `rm -rf /tmp/rev212 && git clone -q https://github.com/kohz87/npc_state_delta.git /tmp/rev212 && git -C /tmp/rev212 fetch -q origin pull/212/head:pr212 && git -C /tmp/rev212 checkout -q pr212`
   Print its HEAD.
2. Run `npm run -s validate` and `npm run -s test:dot` in /tmp/rev212.
3. Run Codex read-only in /tmp/rev212 with the prompt file vm-jobs/004-prompt.txt, the same way as job 003. Save the output to ~/story_suite/vm-results/004-codex.md.
4. Report as VM JOB 004: the head, validate and test results, and the Codex findings (the verdict and all BLOCKING items in the message, the rest in the file).
5. Delete /tmp/rev212.
