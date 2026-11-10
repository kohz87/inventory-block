# 029: Studio part 2, the pack editor app (Sol monitors, Gemini writes)

USER: Studio is a standalone local app, part 2 = the pack editor only. Brief: `~/story_suite/inventory-block/suite-notes/STUDIO_PART2_BRIEF.md`
(read it first, in full), mocks in `suite-notes/studio-mocks/`. This job lifts the read-only rule for one work folder and
one branch: Codex and agy may edit /tmp/s2work, and Sol may push branch `studio-2` of kohz87/Story_studio. Nothing else: no
PR, no merge, no other branch or repo. agy may run with --dangerously-skip-permissions (VM ST is a throwaway); the writer
never pushes. Test rule per the README (no baseline; post-fix runs only).

PRIORITY (Codex quota): 028 (E6a review) first, then 027 (track A), then this. Run this one only when 027 is running and
the window has room, or after it; on a quota stop, commit WIP ("WIP Studio part 2 <task>: <state>", no trailer lines),
push `studio-2` and report so the lead can write a resume.

1. `rm -rf /tmp/s2work && mkdir /tmp/s2work && cd /tmp/s2work && git clone -q https://github.com/kohz87/Story_studio.git && git -C Story_studio checkout -q -b studio-2 origin/main`.
   Print HEAD (319ffaa or later). If branch `assets/icons` exists on origin, note its head (the icon PR; it merges first; bring
   main in with a merge commit once the lead says it's merged — never rebase).
2. `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/029-prompt.txt)" > ~/story_suite/vm-results/029-codex.md 2>&1`
   (agy's Gemini Flash model id where the prompt says <GEMINI_FLASH_ID>, as in job 014).
3. Check its work yourself and report failures rather than fixing them: `git log --oneline origin/main..studio-2`; `npm run -s check`,
   `npm test` (dot), `npm run build` leaves no diff; `git diff --check origin/main HEAD` clean; open `dist/story-studio.html`
   from file:// in Chromium with the network blocked and confirm it loads the golden pack; `git grep -n -i -E "gemini|codex|claude|antigravity|gpt" studio-2 -- src tests docs scripts` shows nothing new.
4. Report as VM JOB 029: the head, test/build/check results, one line per brief section (done / left), the file size of
   dist/story-studio.html, and anything Sol stopped on. Keep /tmp/s2work until the lead acknowledges 029.

## Resume 1 (lead, after both accounts ran out at 13:10 UTC)
- On account A after its reset (USER: about 14:25 UTC), and only after any Sol re-check jobs waiting in the queue (reviews first).
- Main already contains the icons (Story_studio #3, 59f5353): `git -C /tmp/s2work/Story_studio fetch -q && git merge -q origin/main` (merge commit, no rebase) if studio-2 doesn't contain 59f5353 yet.
- Re-run step 2 with 029-prompt.txt plus this line appended: "Resume 1: T1 is done (7f1230f). T2 is a pushed WIP (ffa2c42: src/screens/classes.js, tests/classes.test.js, tests/helpers/, screens/index.js, studio.css), unreviewed. Review T2 against the brief and the Studio mock first, fix it with the writer, then T3–T7."
- Then steps 3–4. Report as VM JOB 029.

## Resume 2 (lead, after T2 at 2aba688)
- After any READY re-check jobs in QUEUE.md. Re-run step 2 with 029-prompt.txt plus this line appended: "Resume 2: T1 (7f1230f) and T2 (2aba688) are done and pushed. Continue with T3 (skill paths), T4 (schema forms), T5 (problems, open/export/autosave), T6 (part 1 follow-ups), T7 (browser tests, CI, docs), in that order."
- Then steps 3–4. Report as VM JOB 029.

## Resume 3 (lead, after T3 at WIP c6c7c2a, 20:28 UTC)
- After 049 on whichever account has quota. Re-run step 2 with 029-prompt.txt plus this line appended: "Resume 3: T1 (7f1230f) and T2 (2aba688) are done. T3 (skill paths) is a pushed WIP at c6c7c2a, verified (skills 17 tests, full 272/0) but unreviewed. Review T3 against the brief and the StudioSkill mock first (12 forms in base/step 1/step 2 columns, generated forms dashed and read-only, budget bar flags budget-closure, lower tiers as a list), fix it with the writer, then T4 (schema forms), T5 (problems, open/export/autosave), T6 (part 1 follow-ups), T7 (browser tests, CI, docs), in that order."

## Reconcile + Resume 4 (lead, 23:25 UTC, after B ran out at ≈23:20)
LEAD DECISION: keep origin/studio-2 as is (T3 2229973, T4 ecfdcb1, T5 0e24901 — the job's own per-task commits). Do not push WIP 9dbcc03, and never force-push.
1. Save the WIP's difference from the remote head: `git diff 0e24901 9dbcc03 > ~/story_suite/vm-results/029-wip-9dbcc03.patch` (also `git diff --stat`). Then point the local branch at the remote: `git checkout -B studio-2 origin/studio-2` (local only; the WIP stays reachable as 9dbcc03, and you can tag it locally `wip-9dbcc03`).
2. Report the patch's --stat in 029.md. If it's empty or only duplicates T3–T5, say so.
3. Resume 4 (whichever account has quota, after any READY reviews): re-run step 2 with 029-prompt.txt plus this line appended: "Resume 4: T1–T5 are pushed (head 0e24901). A local WIP diff from the stopped run is at ~/story_suite/vm-results/029-wip-9dbcc03.patch: read it, take only hunks that belong to T6/T7 and aren't already in 0e24901, and drop the rest. Then T6 (part 1 follow-ups) and T7 (browser tests, CI, docs). The WIP run's `npm test` exited 1: the final full runs must be green, so find and fix any failure."
