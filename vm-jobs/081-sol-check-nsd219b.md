# 081: Sol short final check of NSD #219 after its fixes (read-only)
Sol at high. Nothing edited or pushed. README test rule.
1. `rm -rf /tmp/rev-nsd2 && mkdir /tmp/rev-nsd2 && cd /tmp/rev-nsd2 && git clone -q -b track-b/nsd-participant https://github.com/kohz87/npc_state_delta.git nsd && git clone -q https://github.com/kohz87/Story_block.git sb` (NSD e13fe51+, SB main 5043028+).
2. In /tmp/rev-nsd2: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/081-prompt.txt)" > ~/story_suite/vm-results/081-sol.md 2>&1`
3. Report as VM JOB 081. 4. Delete /tmp/rev-nsd2.
