# 014: Studio part 1, the pack engine (Codex monitors, Gemini Flash writes)

This job lifts the read-only rule for one work folder and one branch per repo: Codex and Antigravity may edit files in
/tmp/s1work, and the monitor may push branch `studio-1` of kohz87/Story_block and of kohz87/Story_studio. Nothing else:
no PR, no merge, no other branch or repo. The brief is `~/story_suite/inventory-block/suite-notes/STUDIO_BRIEF.md` (its "Frozen contract first" section
wins over the rest), with the frozen contract `suite-notes/RB_PHASE0.md` sections 7 and 10 D; read them first.
UNBLOCKED (lead, after the phase 0 freeze ff30f81). Permissions (USER): the VM's SillyTavern is a throwaway, so agy may run
with --dangerously-skip-permissions for this job; the writer still never pushes (the monitor pushes only `studio-1`).
Delete the old /tmp/studio1 first. It can take a few hours.

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

## Resume (lead, after the Codex credit stop at 01:04 UTC on 2026-10-24)
- Now, before waiting: in /tmp/s1work/Story_block commit the unfinished S2 as
  "WIP Studio part 1 S2: unreviewed, syntax error at rules-v2.js:667" (no trailer lines) and
  `git push -u origin studio-1`, so S1 and the WIP are safe off the VM. Keep /tmp/s1work. Check that ~/.gemini is
  writable for the user running agy (the read-only file system errors).
- Resume NOT BEFORE 2026-10-24 04:15 UTC (12:15 SGT), when Codex has credits again. Re-run step 4 with the same prompt
  plus this line appended: "Resume: S1 is committed (73bc880) and S2 is a pushed WIP commit with a syntax error at
  rules-v2.js:667. Start by reviewing S1 and the S2 WIP against the frozen contract, fix S2 with the writer, then
  continue with S3–S7. The WIP commit stays in the history; later commits fix it."
- Then steps 5–7 as written.

## Resume 2 (lead, after the S2 stall; USER: Studio stays with Sol and Gemini)
- First: in /tmp/s1work/Story_block commit the uncommitted S2 repairs as "WIP Studio part 1 S2: repairs, 2 tests failing"
  (no trailer lines) and push `studio-1`.
- S2 changes writer: Sol writes S2 itself (Codex is the writer for S2; no agy for S2), because the checker is exact,
  rule-heavy core code shared by Story Block's import, RPG Battle's activation and Studio. Gemini stays the writer for
  S3–S7 under Sol as monitor, as before.
- Note: v2 is now main in every repo (beta.2). Story Block's `studio-1` stays based where it is; it will be proposed
  into `main`, not v2. Story_studio is unchanged.
- Run step 4 again with 014-prompt.txt plus 014-resume2.txt appended (the second file says what changes).
- Then steps 5–7 as written. Report as VM JOB 014.

## Resume 3 (lead, after S3 stalled at its third writer round)
- First: in /tmp/s1work/Story_studio commit the uncommitted S3 work as "WIP Studio part 1 S3: 1 test failing" (no
  trailer lines) and push `studio-1` there (with the two vendor commits). The lead opens Story Block's S1–S2 PR now.
- S3 is close (one failing depth fixture, case-sensitive route reference indexing): Sol finishes S3 itself, like S2.
- Then S4–S7: Gemini writes, Sol monitors, as before.
- Run step 4 again with 014-prompt.txt plus 014-resume2.txt plus this line appended: "Resume 3: S1 and S2 are done and
  pushed; S3 is a pushed WIP on Story_studio studio-1 with one failing test (depth-16 primitive leaves under the shared
  safety checker) and case-sensitive route reference indexing. You finish S3 yourself (no agy), then S4-S7 with Gemini
  as writer and you as monitor."
- Then steps 5–7 as written. Report as VM JOB 014.
- Quota fallback (USER, Codex at 41% of its window): run resume 3 now. If Codex stops on quota or credits again, don't
  retry in a loop: keep /tmp/s1work as it is, push what's committed, and schedule the resume to start at 16:45 SGT
  (08:45 UTC) today, when Codex's window resets; then continue from where it stopped.

## Resume 4 (lead, after S4 stalled at Gemini's third round)
- The fixed checker is on Story Block main (f0bc3a1; PR #192 superseded #188). Its result fields changed: `hash` is gone,
  replaced by `rulesHash` (the contract's H) and `packHash` (the whole pack); rules packs must declare `rb-rules-v2`.
- First: in /tmp/s1work/Story_studio commit the uncommitted S4 work as "WIP Studio part 1 S4: 1 test failing" and push
  `studio-1` (with 431c1ea). Then re-vendor Story Block from main: in /tmp/s1work/Story_block `git fetch -q origin main &&
  git checkout -q origin/main`, then in Story_studio `npm run sync-sb -- --from /tmp/s1work/Story_block` and commit
  "Vendor Story Block main f0bc3a1"; fix S3's code and tests for the `hash` → `rulesHash`/`packHash` rename and the
  capability rule (Sol does this directly), keep everything green.
- S4: Sol finishes it directly (the failing cascade regression test, and the identity-guard bypass through numeric-string
  paths), like S2 and S3.
- S5–S7: Gemini writes, Sol monitors, as before. If Gemini stalls at round 3 on any of them, Sol finishes that task
  directly too, then carries on.
- Push Story_studio studio-1 after S7 (and after S4 if the run is long). Story Block's studio-1 is done (merged).
- Run step 4 with 014-prompt.txt + 014-resume2.txt + this section as the resume note. Quota fallback as in resume 3.
- SCHEDULE (USER: Codex has 5% left for 138 minutes): don't start resume 4 now. Start it at 17:19 SGT (09:19 UTC) today,
  right after job 022 (Sol's review of Story Block #191), which goes first because track E waits on it.
- CHANGE (USER, after the S2–S4 stalls; Codex has 70% of its weekly quota, only the 5-hour window is tight): Sol
  writes S4, S5, S6 and S7 itself, directly (no agy for this resume). Same rules, tests and checks. If the 5-hour window
  runs out mid-way: stop at a clean point, commit (WIP if needed), push Story_studio studio-1, and schedule the rest for
  the start of the next window; carry on from there without waiting for the lead.
