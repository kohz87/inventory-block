# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts: A ran out at 20:28 UTC → back ≈00:28 UTC (08:28 SGT) by the 4-hour rule. B ran out again at ≈23:20 UTC → back ≈03:20 UTC (11:20 SGT) by the 4-hour rule.
A's next window (from ≈00:28 UTC) has DOUBLE 5-hour quota (USER's free reset, which also resets A's weekly quota). Order: 053 + 054 + 029 (Reconcile + Resume 4) as three parallel threads, then 043/044 as soon as the lead flips them READY (check QUEUE.md between jobs).
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
0. 049 — DONE 22:18 UTC (E6a clear; seams changes).
1. 051 — DONE 22:19 UTC (HOLD → E5 round 10).
1b. 052 — DONE 22:48 UTC (NOT READY → E5 round 11).
1c. 053 — Sol re-check: E5 round 11 (18a3a24, read-only). READY — first on A at ≈00:28 UTC.
1d. 054 — DONE 00:34 UTC (HOLD → 055).
1e. 055 — DONE 00:57 UTC (seams 2fbe8d0). ACK: /tmp/s197work and /tmp/s197-publish can be deleted.
1f. 056 — Sol re-check (fresh, read-only): ctx-seams round 5 (2fbe8d0). READY — LEAD GO-AHEAD: start now on A in parallel with 053 and 029.
2. 027 — track A. Resume 2 FINISHED 20:02 UTC (RB 508763e, SD 168d999). WAITING: Resume 3 (B3 wiring etc.) needs track B on main; the lead adds it then.
3. 029 — RECONCILE first (029-studio-part2.md "Reconcile + Resume 4": keep origin/studio-2 0e24901, save WIP 9dbcc03 as a patch, no push), then Resume 4 (T6–T7). READY NOW — independent of 053/054 (different repo); run as a third thread in parallel (USER).
4. 043 — E6b write (Sol). WAITING until E6a merges.
5. 044 — B6 death/return write (Sol). WAITING until E6a merges.

Done: 048 (20:17 UTC), 046 (19:32 UTC), 047 (19:41 UTC), 036, 037, 038, 039, 040 (E1 MERGED), 041, 045.
