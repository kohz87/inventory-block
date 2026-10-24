# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts: A ran out at 15:37 UTC → available ≈19:37 UTC (03:37 SGT); B resets 16:25 UTC (00:25 SGT).
When an account runs out: it is available again 4 hours after the moment it ran out (README). The VM updates this line.

Order:
1. 036 — DONE (reported 15:37 UTC).
2. E1 round 6 re-check — WAITING (writer working; the lead adds job 037 when it lands).
3. 038 — Sol re-check of E6a round 4 (read-only, short). READY — run FIRST on B (stopped on A at 15:37, no verdict).
4. 027 Resume 1 — track A, Sol writes (027-resume1.txt). IN PROGRESS (RB 4eca8b3, SD 20e097f): continue on B after 038.
5. 029 Resume 1 — Studio part 2. READY after 027 (or alongside, if a second account has room).

6. E5 round 6 re-check — WAITING (writer working; job 039 when it lands).
