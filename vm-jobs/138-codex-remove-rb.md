# 138: Codex BUILD — remove RPG Battle support from SB, SD, Studio (branches stage12/remove-rb) — WAITING (USER go-ahead pending: Codex builds this time)
Model (USER): Terra 6.1 at max effort: `-m gpt-6.1-terra -c model_reasoning_effort="max"`.
1. `rm -rf /tmp/go138 && mkdir /tmp/go138 && cd /tmp/go138 && git clone -q https://github.com/kohz87/Story_block.git && git clone -q https://github.com/kohz87/Story_director.git && git clone -q https://github.com/kohz87/Story_studio.git && git clone -q https://github.com/kohz87/npc_state_delta.git`
2. In /tmp/go138: `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.1-terra -c model_reasoning_effort="max" "$(cat ~/story_suite/inventory-block/vm-jobs/138-prompt.txt)" > ~/story_suite/vm-results/138-codex.md 2>&1` (needs push access for the three branches).
3. Report as VM JOB 138. Keep /tmp/go138 until the lead says (review 139 follows on the OTHER account).
