# VM queue (the lead keeps this current; the VM reads it on every hourly poll)

Rules: reviews before writing. Use whichever Codex account has quota (README "Codex accounts"). A job listed as WAITING
has no file yet or isn't ready; skip it. Report each finished job as `VM JOB NNN:` and add it to DONE.

Accounts: A resets ≈19:22 UTC (03:22 SGT, stated by USER). B ran out at 18:11 UTC → back ≈22:11 UTC (06:11 SGT) by the 4-hour rule.
For FUTURE outages with no stated time: available again 4 hours after the moment it ran out (README). The VM updates this line.

Order (run top to bottom):
1b. 047 — Sol re-checks: E6a round 7 + ctx-seams v2 (read-only, short). READY — right after 046.
2. 027 Resume 2 — track A (027-resume2.txt). READY — the review is done; run right after 046.
3. 029 Resume 2 — Studio part 2 T3–T7 (head 2aba688). READY after 027; the untracked tests/dummy_probe.tmp in /tmp/s2work can be deleted.
4. 043 — E6b write (Sol). WAITING until E6a merges.
5. 044 — B6 death/return write (Sol). WAITING until E6a merges.

Done: 046 (19:32 UTC), 036, 037, 038, 039, 040 (E1 MERGED), 041, 045.
