# VM queue (the lead keeps this current; the VM polls it every 30 minutes — USER, 25 Oct)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER, ≈12:45 UTC): A resets 16:39 UTC (use from 16:40), B resets 17:21 UTC (use from 17:22) (stated by USER). 079 MOVED TO CLAUDE (do not re-run). If 080 stopped on B's quota, push its WIP and report; it resumes on A at 16:39. 082 runs on A at 16:39 (or after 080).
A's FREE RESET ACTIVATED by USER at ≈01:16 UTC: A has a fresh window (DOUBLE 5-hour quota, weekly reset too). Earlier note: A's window (from ≈00:28 UTC) has DOUBLE 5-hour quota (USER's free reset, which also resets A's weekly quota). Order: 053 + 054 + 029 (Reconcile + Resume 4) as three parallel threads, then 043/044 as soon as the lead flips them READY (check QUEUE.md between jobs).
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

**LEAD GO-AHEAD 17:15 UTC — RUN NOW, no further confirmation needed:** on A, 084 + 085 + 086 as three parallel threads; on B from 17:22, 083 first, then 082 (083 may overlap 086: 086 is test-only). Standing rule: any job marked "READY — LEAD GO-AHEAD" in this file is cleared to run; the lead cannot message the VM session directly, so this file is the go-ahead.

**STUDIO PHASE (26 Oct, USER: "queue the jobs"):** 2.0 is released. Run 093 + 094 in parallel (one per account); 095 after 093 pushes.

Order (run top to bottom):
ST1. 093 — DONE 04:18 UTC on A (Studio studio/part-2.5 779cd34, SB studio/limits 708e2ae; draft PRs Studio #5, SB #206). WAS: STOPPED 01:45 on A (workspace out of credits; WIP pushed studio/part-2.5 4e663af, SB studio/limits 708e2ae). RESUME on B (see RESUME in 093 file). 01:57 rerun stopped on 'model at capacity' (no commits). RETRY on B from 02:30 UTC (or whichever account has quota/credits first); if capacity stops twice more, try again an hour later. Then 096.
ST2b. 096 — DONE 05:12 UTC on B → MERGED (SB #204 cc0b793, SD #136 b6fad56, RB #151 81cb400). WAS: open templates onto 2.0 main (merge main, resolve, re-vendor) + fold the 12 templates into Ersveil pack 1.5.0. SOL WRITES. READY — LEAD GO-AHEAD: on B AFTER the 093 resume (or on A when A has credits again).
ST2. 094 — DONE 01:38 UTC on B (HOLDS; conflicts SB clean, SD low, RB moderate). WAS: Sol review: open quest templates (SB #204, SD #136, RB #151) incl. conflicts with 2.0 main (read-only). READY — LEAD GO-AHEAD: NOW, parallel with 093.
ST9. 103 — release prep 2.1.0 (docs + version). SOL WRITES. WAITING (lead flips READY after 102 merges; runs on whichever account has credits).
ST8. 102 — MOVED TO CLAUDE 09:16 UTC (B out of credits at 09:14; WIP perf/danger-calibration 0f09336; Sonnet finishing). Do not run.
ST11. 107 — DATA MODULES v1: Story Block runtime (checker → runtime → replay → tests). SOL WRITES. READY — LEAD GO-AHEAD: on the FIRST FREE account (A now; B after 102).
ST10. 106 — DONE 08:50 UTC on A (design approved by USER with 7 decisions, 073404f). WAS: Studio part 5 stage 1 DESIGN DOC: data-defined modules (docs only, SB design/data-modules). SOL WRITES. READY — LEAD GO-AHEAD: NOW on A.
ST7c. 105 — DONE 08:18 UTC on A → STUDIO PART 4 MERGED (Studio #7 420c9ea). WAS: Studio part 4 blockers (preview must run SB's own validation/evaluator/envelope). SOL WRITES. READY — LEAD GO-AHEAD: NOW on A.
ST7b. 104 — DONE 08:03 UTC on A (BLOCK, 4 preview mismatches) → 105.
ST7. 101 — DONE 07:51 UTC on A (studio/part-4 207e082) → review 104. WAS: Studio part 4: settings defaults + screen builder. SOL WRITES. READY — LEAD GO-AHEAD: NOW on A.
ST6. 099 — DONE 07:32 UTC on B (RB fix/pinned-danger cd64f0e → PR #153). WAS: FIX (player-facing, hotfix): pinned-pack encounters ignore the danger label (6 weak rats = 0% wins at level 1). SOL WRITES on RB fix/pinned-danger. READY — LEAD GO-AHEAD: NOW on B.
ST5. 098 — DONE 06:16 UTC on B (no regression; pinned 'weak' = 0% wins). WAS: balance/regression check: level-1 vs 6 weak Cellar Rat Swarm (smoke lost 2/2 on 2.0). Sol, read-only + /tmp scripts. READY — LEAD GO-AHEAD: NOW on B (parallel with 097 on A).
ST4b. 100 — DONE 07:19 UTC on A → STUDIO PARTS 2.5 + 3 MERGED (Studio #5 20fc401, #6 9ba9dbe). WAS: Studio review blockers (NFC/NFD key collapse on export; blank narrator name). SOL WRITES on the two Studio branches. READY — LEAD GO-AHEAD: NOW on A (parallel with 099 on B).
ST4. 097 — DONE 06:17 UTC on A (BLOCK, 2) → 100. WAS: Sol review of Studio parts 2.5 + 3 (PR #5 + part-3 PR; read-only). READY — LEAD GO-AHEAD: NOW on A.
ST3. 095 — DONE 05:08 UTC on A (studio/part-3 0e9ad06) → review 097.
R0. 085 — Sol short review: pin flow (SB stage5/pin 71ea5a3, RB stage5/pin 69ef713; read-only). READY — LEAD GO-AHEAD: first free slot (A 16:39 alongside 084, or B).
R0b. 086 — DONE BY CLAUDE 19:10 UTC (SB d300339, RB 4e8220a, SD a7e0b99; CI green). Do not run. WAS: CI FIX: checks-flip PRs (SB #201, RB #148, SD #135) are red in CI (static sibling imports). Sol writes, test-only. READY — LEAD GO-AHEAD: on A NOW alongside 084/085 (three threads); 083 may run in parallel on B (it reviews product code, which 086 does not touch).
R3. 092 — DONE (tags + GitHub releases, Latest). WAS: TAG THE 2.0 RELEASE (plain git, no model; 092-tag-release.md). READY — LEAD GO-AHEAD: RUN NOW.
R2. 091 — DONE 01:08 UTC on B (release/2.0.0: SB b63b6a3, SD 6327942, RB 558dc6c, NSD dddbd97 = 1.3.0). WAS: RELEASE PREP 2.0.0 (versions, CHANGELOG, README, known issues; docs only). SOL WRITES. READY — LEAD GO-AHEAD: after 090 or in parallel on the other account.
R1d. 090 — DONE 01:03 UTC on A (RB 74aba8c). WAS: MERGE main into RB release/native-death (selection.js conflict with main's E6a approach). SOL WRITES. READY — LEAD GO-AHEAD: RUN NOW (A or B; both free). Last step before native-death merges and the release smoke.
R1c. 089 — DONE 00:15 UTC on A (PASS) → CHECKS FLIP MERGED (SB 9e7f4e5, SD f48c01d, RB e106a09). WAS: Sol RE-CHECK (the one allowed): checks-flip fixes (SB #201 1309def, RB #148 91c63a2, SD #135 224cc79; read-only). READY — LEAD GO-AHEAD: RUN NOW on A or B (both free). LAST GATE before the release smoke.
R1b. 088 — DONE 00:08 UTC on B (HOLDS: no blockers; RB main pre-existing fails listed) — WAS: Sol short review: native-death recovery (SB #203, RB #150, NSD #220; read-only). READY — LEAD GO-AHEAD: ON B NOW (B is free after 082) (release critical path, before anything else new).
R1. 084 — DONE 23:44 UTC on A (RB 6014bd5, SB c54104b, NSD 3353259; PRs RB #150, SB #203, NSD #220) → review 088. WAS: RELEASE MUST: native-death recovery, SOL WRITES (RB release/native-death, + NSD/SB if needed). READY — LEAD GO-AHEAD: FIRST on A at 16:39 UTC.
S4-last. 081 — DONE (BLOCK: 2 silent-state items → Claude NSD fixer).
S5-1. 078 — DONE (matrix 109/0/0/19) → SB #200, RB #147 MERGED.
S5-3. 080 — DONE 12:58 UTC on B (SB 47e8beb, RB f66f9c4, SD a11c95d; PRs SB #201, RB #148, SD #135) → review 083.
S5-3b. 083 — Sol review: checks flip (SB #201 d300339, RB #148 4e8220a, SD #135 a7e0b99 — heads after the test-only CI fix; read-only, silent-wrong-state only). READY — LEAD GO-AHEAD: on B now alongside 082 (reviews before writing: 083 first if only one slot).
S5-3c. 087 — DONE 23:56 UTC on A (SB 1309def, RB 91c63a2, SD 224cc79) → re-check 089. WAS: CHECKS-FLIP BLOCKERS from 083 (pre-roll survives retraction; pre-roll mastery settles late). SOL WRITES on the 3 PR branches. READY — LEAD GO-AHEAD: on B NEXT, BEFORE 082 (release critical path; 082 is nice-to-have). If 082 already started, let it run and do 087 on whichever account frees first.
S5-4. 082 — DONE 23:50 UTC on B (SB 7793aef, SD 185dd1b, RB aaace93; draft PRs SB #204, SD #136, RB #151) → review after the release core. WAS: stage 5: open quest templates + foe variants (USER-approved design), SOL WRITES (SB/RB/SD stage5/open-templates). READY — LEAD GO-AHEAD: after 080, or in parallel if quota allows.
S5-2. 079 — MOVED TO CLAUDE (Sonnet finishing stage5/pin). Do not run.
0001. 077 — MOVED TO CLAUDE (Sonnet re-check now; A has no quota for ≈144 min). Do not run.
0000. 076 — DONE 08:33 UTC on B (E6b: 2 blockers → Claude round 4).
000. 074 — DONE 07:56 UTC on B (E6b: 2 blockers → Claude round 3).
00. 067 — DONE 07:33 UTC (BLOCK, 5 findings → 072).
05. 072 — MOVED TO CLAUDE (Sonnet, A out for ≈97 min). Do not run.
01. 068 — DONE ≈07:28 UTC (matrix: no product bugs; stage 5 fix list logged).
04. 071 — DONE 07:40 UTC (B6: F1/F2/F5 hold; F3 two findings, F4 needs E6b) → Claude fix.
03. 070 — DONE 07:58 UTC on B (track A: RB and SD BLOCK) → 075.
03b. 075 — DONE ≈08:40 UTC on B (track A: 12 fixes; RB 2132a8d, SD d4b5e03). ACK: /tmp/afix can be deleted.
06. 073 — DONE 07:43 UTC (track C: 3 findings → Claude fix).
02. 069 — DONE 07:35 UTC (track-c/screens1 17b5efe) → review 073. ACK: /tmp/c139 can be deleted. WAS: 069 — Track C (RB #139) onto main + real queries + stub updates, SOL WRITES. READY — LEAD GO-AHEAD: run now on B.
0a. 064 — DONE 06:28 UTC (E6b: 3 blockers → 065).
0b. 066 — MOVED TO CLAUDE (USER: Codex quota low). Do not run.
0c. 065 — MOVED TO CLAUDE (USER: Codex quota low). Do not run.
0. 049 — DONE 22:18 UTC (E6a clear; seams changes).
1. 051 — DONE 22:19 UTC (HOLD → E5 round 10).
1b. 052 — DONE 22:48 UTC (NOT READY → E5 round 11).
1c. 053 — DONE 01:22 UTC (re-run; HOLDS → E5 MERGED 8015fde).
1d. 054 — DONE 00:34 UTC (HOLD → 055).
1e. 055 — DONE 00:57 UTC (seams 2fbe8d0). ACK: /tmp/s197work and /tmp/s197-publish can be deleted.
1f. 056 — DONE 01:08 UTC (HOLDS: seams clear).
2. 027 — track A. Resume 4 DONE ≈06:36 UTC (RB track-a e5f7ed5, SD track-a a2a8135). Remaining B3 objective proofs MOVED TO CLAUDE (USER: Codex low). ACK: /tmp/awork4, /tmp/track-a-publish can be deleted.
3. 029 — DONE 00:59 UTC (Resume 4: T6 815884e, T7 ba94b4c; PR Story_studio#4 opened by the lead). ACK: /tmp/s2work, /tmp/studio-2-git can be deleted; keep the wip-9dbcc03 patch.
3b. 057 — DONE 01:08 UTC (5 blockers → 058).
3c. 058 — DONE 01:23 UTC (studio-2 bf12771). ACK: /tmp/s2fix can be deleted.
3d. 059 — DONE 01:34 UTC (2 blockers → 060).
3e. 060 — DONE 01:49 UTC (studio-2 d40d51e). ACK: /tmp/s2fix2 and /tmp/studio-submit can be deleted.
3f. 061 — DONE 01:58 UTC (B1/B2 hold; 1 blocker → 062).
3g. 062 — DONE 02:08 UTC (studio-2 1de349d) → Story_studio#4 MERGED (85a4140). ACK: /tmp/s2fix3 and the other Studio work folders can be deleted; the package-lock.json deletion in the old checkout can be discarded.
4. 043 — DONE ≈03:50 UTC (E6b parts 1–6, head f4214f4) → review 064.
5. 044 — Resume 2 DONE 06:27 UTC (B6 cfd38a5) → review 066.

Done: 048 (20:17 UTC), 046 (19:32 UTC), 047 (19:41 UTC), 036, 037, 038, 039, 040 (E1 MERGED), 041, 045.
