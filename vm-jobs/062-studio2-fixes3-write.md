# 062: Studio PR #4 fix from re-check 061 (Sol writes) — READY

This job lifts the read-only rule for one work folder and one branch: Codex may edit /tmp/s2fix3 and push branch `studio-2`
of kohz87/Story_studio (PR #4). No new PR, no merge, no other branch or repo, never force-push. Sol writes it itself (no agy).
README test rule (no baseline; revert-to-fail on the new tests only; full runs once at the end).
On a quota stop, commit WIP ("WIP Studio part 2 fixes: <state>", no trailer lines), push, report.

1. `rm -rf /tmp/s2fix3 && mkdir /tmp/s2fix3 && cd /tmp/s2fix3 && git clone -q https://github.com/kohz87/Story_studio.git && cd Story_studio && git checkout -q studio-2`
   (print HEAD: d40d51e or later). `npm ci`. Make sure .git is writable before starting (029 hit a read-only .git).
   For Playwright, set `TMPDIR=/tmp/s2fix3/tmp` (mkdir it) so its browser profile is writable (057 hit EROFS).
2. `TMPDIR=/tmp/s2fix3/tmp CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/062-prompt.txt)" > ~/story_suite/vm-results/062-codex.md 2>&1`
3. Check its work yourself and report failures rather than fixing them: `git log --oneline d40d51e..HEAD`, `npm run -s check`, `npm test` once (summary + failures), `npm run build` gives no diff, `git diff --check origin/main HEAD`, no model names.
4. Report as VM JOB 062: head, results, what was fixed, anything Sol stopped on. Keep /tmp/s2fix3 until ACK.
