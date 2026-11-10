# NSD-FIX222 (4 Nov) — fixes from rv222-npc ($S/rv222-npc/REVIEW.md, read it first; probes in $S/rv222-npc/probes/,
reviewer's scratch fix in $S/rv222-npc/nsd-fix — read it, do not copy blindly)
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, PID files, no playwright install, never use USER chats). If any command is denied, stop
that step and report it; never re-run it in another form. NSD tests under Node 24 the repo's own way; --test-concurrency=2.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/nsd-fix222/npc_state_delta; commit on `stage66/npc-api` (da3648a) and push. No version bumps.
- B1 branch.js reconcileBranchState (!exactRestored): when fail-closed keeps the current state and readAhead held ids
  at or after the divergence, reset lastScannedMessageId to null and readAhead to [] (the 1.9.0 behaviour). Add the
  reviewer's probe as a test (edit waiting reply, edit read-ahead reply, middle delete: rescan reads the latest reply
  only). Update the pinned 1.10.0 branch test to expect marker null, readAhead [] — explain in the commit why.
- F1 cost: memoize the public-path table per synchronous read; read mood without deep-cloning dossiers (no portrait
  copies). Test: at most 2 people() calls per api.paths(); report timings at 30/40 dossiers before/after.
- F2 no spurious story:changed on chat open: the first values after a chat switch are the baseline. Test.
- F3 CHANGELOG: say a manual scan judges meters for the latest exchange only.
- F4/F5 PUBLIC-API.md (NSD side, or report if the doc lives in SB): names with `|` or `::` can't be read by macro;
  hiding a shown meter reports one change to null.
Full NSD suite, compat, smoke, check, git diff --check, measure-prompts identical to 1.9.0. Report: head sha, items,
tests with counts, timings.
