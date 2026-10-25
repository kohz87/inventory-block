# 082: stage 5 — open quest templates and foe variants (Sol writes) — READY (after 080, or in parallel if quota)

Lifts the read-only rule for /tmp/open and NEW branches `stage5/open-templates` in kohz87/Story_block, kohz87/rpg_battle and
kohz87/Story_director (push those only; no PR, no merge, never force-push). README test rule. On a quota stop, commit WIP, push, report.
1. `rm -rf /tmp/open && mkdir /tmp/open && cd /tmp/open && for r in Story_block rpg_battle Story_director; do git clone -q https://github.com/kohz87/$r.git; git -C $r checkout -q -b stage5/open-templates; done` (.git writable).
2. In /tmp/open: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/082-prompt.txt)" > ~/story_suite/vm-results/082-codex.md 2>&1`
3. Check each repo: `npm run -s check` (NSD-style repos: validate), `npm run -s test:dot` once, `git diff --check origin/main HEAD`, no model names; the matrix once. Report as VM JOB 082.
