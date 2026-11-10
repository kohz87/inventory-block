# XB — Story Director clean-up (branch `stage36/cleanup-sd` from origin/main 1ae570c; test ST port 8192; clone $S/xb/)
Read X-COMMON.md first.
1. Key people: the removal line (a pinned person auto-removed when archived or dead) shows on the PREVIOUS reply's
   card instead of the reply where it happened (review 183 follow-up (1), V2_LOG 1 Nov "Review K"). Make the line
   belong to the reply that caused it; swipe / Re-read / middle delete stay exact. Test + real-ST check.
2. When the lead tells you XA's SB branch is ready (or if `stage36/cleanup-sb` already has the card-scroll fix when
   you get here — check `git log`), remove src/v2/cast/follow.js and its wiring/tests, and prove in real ST with XA's
   SB branch that a reply carrying a cast note still ends with its card in view (desktop + phone). Until then do item 1
   and stop with a report saying item 2 is waiting.
