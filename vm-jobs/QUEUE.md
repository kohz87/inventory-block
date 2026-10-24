# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER): A resets ≈19:22 UTC (03:22 SGT); B resets 16:25 UTC (00:25 SGT). These stated times stand.
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
4. 027 Resume 1 — track A, Sol writes (027-resume1.txt). IN PROGRESS (RB 4eca8b3, SD 20e097f): continue after the three re-checks.
5. 043 — E6b write (Sol). WAITING until E6a merges (the lead flips it to READY).
6. 044 — B6 death/return write (Sol). WAITING until E6a merges.
7. 029 Resume 1 — Studio part 2. READY after 027; yields to 043/044 once they're READY.

Done: 036 (15:37 UTC), 037 and 038 (16:36 UTC), 039 (16:46 UTC), 041 (17:01 UTC).
WAITING: E1 round 7 (job 040), E6a round 6 (job 045) and E5 round 7 (job 042) re-checks, added when the rounds land; run any that are READY before continuing 027.
