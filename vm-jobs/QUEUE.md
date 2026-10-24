# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER): A resets ≈19:22 UTC (03:22 SGT); B resets 16:25 UTC (00:25 SGT). These stated times stand.
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
0a. 046 — Sol re-check of E5 round 7 (read-only). READY — alongside or right after 045.
4. 027 Resume 2 — track A (027-resume2.txt). READY — run next, before 029 continues (029 may finish its current run first).
5. 043 — E6b write (Sol). WAITING until E6a merges (the lead flips it to READY).
6. 044 — B6 death/return write (Sol). WAITING until E6a merges.
7. 029 Resume 2 — Studio part 2 T3–T7 (T1, T2 done; head 2aba688). READY after 045; yields to 043/044 once they're READY.

Done: 036 (15:37 UTC), 037 and 038 (16:36 UTC), 039 (16:46 UTC), 041 (17:01 UTC), 040 (17:15 UTC; E1 MERGED), 045 (18:03 UTC).
WAITING: E5 round 7 (job 042) re-checks, added when the rounds land; run any that are READY before continuing 027.
