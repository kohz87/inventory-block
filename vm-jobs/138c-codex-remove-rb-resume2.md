# 138c: Codex BUILD RESUME 2 — finish removing RPG Battle support (stage12/remove-rb) — READY — LEAD GO-AHEAD (account A, same clone /tmp/go138)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`. Account A (it holds the context-free clone with Studio's uncommitted files; B also fine if A lacks credit, but use the same /tmp/go138).
1. cd /tmp/go138 (do NOT re-clone; Story_studio has 49 uncommitted files to keep). git fetch in each repo; SB/SD should be at cbcb075 / d5d435c.
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/138c-prompt.txt)" > ~/story_suite/vm-results/138c-codex.md 2>&1`
3. Report as VM JOB 138c. Keep /tmp/go138 until the lead says.
