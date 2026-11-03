# REVIEW-SDNSD — Opus review of Story Director 2.10.0 and NPC State Delta 1.8.0 (read-only)

Read-only. Two repos:
A. kohz87/Story_director: the lead's local candidate is in $S/reldiet/sd (branch stage59/lean-sd, head 57a2ad5, NOT
   pushed; read it there without modifying it, or read origin/stage59/lean-sd b5d37ae + the version commit) against
   origin/main (2.9.3). Its tests are red only because the vendored Story Block testkit is 2.16.6 and the new range needs
   2.19.0 — judge the code, not that. Briefs: LEAN2-SD.md (+ the heads design in DIET-FIX/LEAN1-SB).
B. kohz87/npc_state_delta origin/stage63/nsd-prose (c955f8e, 1.8.0) against origin/main (1.7.4). Briefs: LEAN1-NSD.md,
   NSD-PROSE.md.
Blocker bar: data loss, crash/wedge, wrong results, replay inequality, a change line that parsed before no longer
parsing or a stray line no longer taken (SD: the heads), hidden-value leak (NSD secrets/hidden notes, redactSent), the
scanner cadence missing a real change (new NPC never scanned until the safety scan?), a saved user setting silently
changed, portrait prompt prose dropping or inventing facts. Never read secrets or the USER's SillyTavern data; never
pgrep -f/pkill -f; if any command is denied, stop that step and report it. Report per repo, per finding: file:line,
repro, severity, fix. Short.
