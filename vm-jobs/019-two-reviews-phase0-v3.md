# 019: two independent reviews of the RB phase 0 draft v3 (Sol and Argon), read-only

GO (lead): run as soon as job 018 has pushed branch `vm-phase0-v3`. If 018 ends without a push, skip this job.

Exactly as job 016, with these changes:
- inventory-block on `vm-phase0-v3` (018's push); folders /tmp/p0r3 and /tmp/p0r3-argon; results
  ~/story_suite/vm-results/019-sol.md and 019-argon.md.
- The prompt is 016-prompt.txt, with item 1 replaced: "1. Each blocking item of both earlier reviews, summarised in
  inventory-block/suite-notes/RB_PHASE0_REVIEW2.md (S1–S7 and A1–A10): fixed, partly fixed (what is left), or not fixed.
  Also check the new track E (Story Block host changes): is every SB change the draft relies on listed there, with an API
  and tests?" Make it with:
  `sed 's#^1\. Each of the 9 blocking items.*#1. Each blocking item of both earlier reviews, summarised in inventory-block/suite-notes/RB_PHASE0_REVIEW2.md (S1-S7 and A1-A10): fixed, partly fixed (what is left), or not fixed. Also check the new track E (Story Block host changes): is every SB change the draft relies on listed there, with an API and tests?#' ~/story_suite/inventory-block/vm-jobs/016-prompt.txt > /tmp/019-prompt.txt`
  and check with `head -3 /tmp/019-prompt.txt` that item 1 changed before running either reviewer.
- Report as VM JOB 019, in the same form as 016 (Sol first, then Argon, each one's BLOCKING items in full).
