# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts: A ran out at 20:28 UTC → back ≈00:28 UTC (08:28 SGT) by the 4-hour rule. B ran out at 18:11 UTC → back ≈22:11 UTC (06:11 SGT) by the 4-hour rule.
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
0. 049 — DONE 22:18 UTC (E6a clear; seams changes).
1. 051 — DONE 22:19 UTC (HOLD → E5 round 10).
2. 027 — track A. Resume 2 FINISHED 20:02 UTC (RB 508763e, SD 168d999). WAITING: Resume 3 (B3 wiring etc.) needs track B on main; the lead adds it then.
3. 029 Resume 3 — Studio part 2: review T3 (WIP c6c7c2a), then T4–T7. READY after 049 (B if quota remains, else A from ≈00:28 UTC). See 029-studio-part2.md "Resume 3".
4. 043 — E6b write (Sol). WAITING until E6a merges.
5. 044 — B6 death/return write (Sol). WAITING until E6a merges.

Done: 048 (20:17 UTC), 046 (19:32 UTC), 047 (19:41 UTC), 036, 037, 038, 039, 040 (E1 MERGED), 041, 045.
