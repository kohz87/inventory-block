# 095: Studio part 3 — card + lore maker (Sol writes) — WAITING (after 093 pushes)
Lifts the read-only rule for /tmp/st3 and NEW branch kohz87/Story_studio studio/part-3 (from studio/part-2.5). No PRs, no merges,
never force-push. README test rule.
1. `rm -rf /tmp/st3 && mkdir /tmp/st3 && cd /tmp/st3 && git clone -q -b studio/part-2.5 https://github.com/kohz87/Story_studio.git && git clone -q -b v2.0.0 https://github.com/kohz87/Story_block.git && git -C Story_studio checkout -q -b studio/part-3`
2. In /tmp/st3: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/095-prompt.txt)" > ~/story_suite/vm-results/095-codex.md 2>&1`
3. Check: lone clone → `npm test` green. Report as VM JOB 095. 4. Delete /tmp/st3.
