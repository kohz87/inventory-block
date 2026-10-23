# 014: Studio part 1, the pack engine (Codex monitors, Gemini Flash writes)

This job lifts the read-only rule for one clone and one branch: Codex and Antigravity may edit files in /tmp/studio1, and
the monitor may push branch `studio-1` of kohz87/Story_block. Nothing else: no PR, no merge, no other branch or repo.
The brief is `~/story_suite/inventory-block/suite-notes/STUDIO_BRIEF.md`; read it first. It can take a few hours.

1. `git -C ~/story_suite/inventory-block pull -q` (859f199 or later, with STUDIO_BRIEF.md and RB_PHASE0.md).
2. `rm -rf /tmp/studio1 && git clone -q https://github.com/kohz87/Story_block.git /tmp/studio1 && git -C /tmp/studio1 checkout -q -b studio-1 origin/v2`.
   Print HEAD (47b2806 or later). `npm ci`, then `npm run -s check` and `npm run -s test:dot` once as the baseline.
3. Find Gemini 3.8 Flash's model id as agy names it (agy's help or model list), and check that agy runs in /tmp/studio1:
   `agy -p "run: git status, then stop" --model <id>`. If it is refused, report and stop.
4. Run the monitor in /tmp/studio1. It needs network (agy calls the model; the push), so:
   `codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/014-prompt.txt)" > ~/story_suite/vm-results/014-codex.md 2>&1`
   (put the agy model id from step 3 into the prompt where it says <GEMINI_FLASH_ID>).
5. Check its work yourself, and report any failure rather than fixing it: `git log --oneline origin/v2..origin/studio-1`;
   `npm run -s check` and `npm run -s test:dot`; `git diff --stat origin/v2...origin/studio-1` (only the brief's folders);
   the `git grep` of the brief's last rule prints nothing; `git grep -n -i -E "gemini|codex|claude|sol\b|flash|antigravity" origin/studio-1 -- src tests docs` shows nothing new.
6. Report as VM JOB 014: the branch head, the baseline and final test results, the check results, one line per task S1–S7
   (done / left, with what is left), and anything the monitor stopped on. Full output stays in the results file.
7. Keep /tmp/studio1 until the lead acknowledges 014.
