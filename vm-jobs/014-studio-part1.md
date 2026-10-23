# 014: Studio part 1, the pack engine (Codex monitors, Gemini Flash writes)

This job lifts the read-only rule for one work folder and one branch per repo: Codex and Antigravity may edit files in
/tmp/s1work, and the monitor may push branch `studio-1` of kohz87/Story_block and of kohz87/Story_studio. Nothing else:
no PR, no merge, no other branch or repo. The brief is `~/story_suite/inventory-block/suite-notes/STUDIO_BRIEF.md`;
read it first. It can take a few hours.

1. `git -C ~/story_suite/inventory-block pull -q` (the commit with this file or later).
2. Two clones side by side:
   `rm -rf /tmp/s1work && mkdir /tmp/s1work && cd /tmp/s1work`
   `git clone -q https://github.com/kohz87/Story_block.git && git -C Story_block checkout -q -b studio-1 origin/v2`
   `git clone -q https://github.com/kohz87/Story_studio.git && git -C Story_studio checkout -q -b studio-1 origin/main`
   Print both HEADs (Story Block 47b2806 or later, Story Studio 72db624 or later). In each: `npm ci` (or `npm install`),
   `npm run -s check`, `npm run -s test:dot` once as the baseline.
3. Find Gemini 3.8 Flash's model id as agy names it (agy's help or model list), and check that agy runs there:
   `cd /tmp/s1work/Story_block && agy -p "run: git status, then stop" --model <id>`. If it is refused, report and stop.
4. Run the monitor in /tmp/s1work. It needs network (agy calls the model; the pushes), so:
   `codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/014-prompt.txt)" > ~/story_suite/vm-results/014-codex.md 2>&1`
   (put the agy model id from step 3 into the prompt where it says <GEMINI_FLASH_ID>).
5. Check its work yourself, and report any failure rather than fixing it. In each repo: `git log --oneline` of
   `studio-1` against its base (`origin/v2` / `origin/main`); `npm run -s check` and `npm run -s test:dot`;
   `git diff --stat` against the base (only the brief's files); the `git grep` of the brief's last rule prints nothing;
   `git grep -n -i -E "gemini|codex|claude|antigravity" origin/studio-1 -- src tests docs` shows nothing new.
   In Story Studio: `cat vendor/story-block/VERSION` names Story Block's studio-1 head.
6. Report as VM JOB 014: both branch heads, the baseline and final test results, the check results, one line per task
   S1–S7 (done / left, with what is left), and anything the monitor stopped on. Full output stays in the results file.
7. Keep /tmp/s1work until the lead acknowledges 014.
