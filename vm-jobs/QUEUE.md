# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER): A resets ≈19:22 UTC (03:22 SGT); B resets 16:25 UTC (00:25 SGT). These stated times stand.
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
1. 039 — Sol re-check of E5 round 6 (read-only). READY.
4. 027 Resume 1 — track A, Sol writes (027-resume1.txt). IN PROGRESS (RB 4eca8b3, SD 20e097f): continue after the three re-checks.
5. 029 Resume 1 — Studio part 2. READY after 027 (or alongside, if a second account has room).

Done: 036 (15:37 UTC), 037 and 038 (16:36 UTC).
WAITING: E1 round 7 re-check (job 040) and E6a round 5 re-check (job 041), added when the rounds land; run them before 027.
