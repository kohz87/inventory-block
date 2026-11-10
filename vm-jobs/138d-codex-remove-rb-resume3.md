# 138d: Codex BUILD RESUME 3 — finish removing RPG Battle support (stage12/remove-rb) — READY — LEAD GO-AHEAD (ACCOUNT B, USER: B has full quota; SAME clone /tmp/go138)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. cd /tmp/go138 (do NOT re-clone; Story_block has 21 and Story_studio 14 uncommitted files from 138c to keep). git fetch in each repo; pushed heads SB 1640b69, SD 3b96dd6, Studio de809bb.
2. `CODEX_HOME=<account B> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/138d-prompt.txt)" > ~/story_suite/vm-results/138d-codex.md 2>&1`
3. Report as VM JOB 138d (vm-results/138d.md committed to inventory-block). Keep /tmp/go138 until the lead says.
