# VM queue (the lead keeps this current; the VM reads it when the USER asks it to check — the hourly poll is off)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER, ≈07:00 UTC): A has 46% of its 5-hour window; B has 100%. Run reads on A, writing on B.
A's FREE RESET ACTIVATED by USER at ≈01:16 UTC: A has a fresh window (DOUBLE 5-hour quota, weekly reset too). Earlier note: A's window (from ≈00:28 UTC) has DOUBLE 5-hour quota (USER's free reset, which also resets A's weekly quota). Order: 053 + 054 + 029 (Reconcile + Resume 4) as three parallel threads, then 043/044 as soon as the lead flips them READY (check QUEUE.md between jobs).
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
00. 067 — DONE 07:33 UTC (BLOCK, 5 findings → 072).
05. 072 — NSD #219 fixes, SOL WRITES. WAITING until E6b merges into SB main (findings 1 and 3 need E6b's barrier and active-history filter).
01. 068 — DONE ≈07:28 UTC (matrix: no product bugs; stage 5 fix list logged).
04. 071 — Sol re-check: B6 (RB #146, track-b/death-return 98dfc16; read-only). READY — LEAD GO-AHEAD: next free slot (B or A).
03. 070 — Sol review: track A (RB #145 track-a 55df021, SD #134 track-a b518b47; read-only). READY — LEAD GO-AHEAD: run now on B alongside 069 (or on A once 067/068 finish).
06. 073 — Sol review: track C (RB #139 17b5efe, read-only). READY — LEAD GO-AHEAD: run now on B.
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
