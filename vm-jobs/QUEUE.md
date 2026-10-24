# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts (USER): A resets ≈19:22 UTC (03:22 SGT) on 2026-10-24; B resets 16:25 UTC (00:25 SGT).
When an account runs out: it is available again 4 hours after the moment it ran out (README). The VM updates this line.

Order:
1. 036 — Sol re-check of E5 round 5 (read-only, short). READY.
2. E1 round 6 re-check — WAITING (writer working; the lead adds job 037 when it lands).
3. 038 — Sol re-check of E6a round 4 (read-only, short). READY.
4. 027 Resume 1 — track A, Sol writes (027-resume1.txt). IN PROGRESS: continue from the last pushed commit when an account has quota.
5. 029 Resume 1 — Studio part 2. READY after 027 (or alongside, if a second account has room).
