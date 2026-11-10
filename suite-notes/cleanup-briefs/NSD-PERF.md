# NSD-PERF (4 Nov) — NPC State Delta 1.10.1: stop the freezes (USER: "ship it once you apply the fix, I'll test it"; no full review)
Claude builder agent. Rules of CARD-COMMON.md apply (exact trailer, no model names, no merge/PR/force/tag, never weaken
tests, PID files with the REAL server PID, no playwright install, never use USER chats). If any command is denied, stop
that step and report it; never re-run it in another form. Run everything in the FOREGROUND. NSD tests under Node 24 the
repo's own way, --test-concurrency=2; runtime-smoke timing tests can flake under load (re-run alone).
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone of kohz87/npc_state_delta into $S/nsd-perf/npc_state_delta; branch `stage69/perf` from origin/main f733644 (1.10.0).

USER evidence (long Ersveil chat, many NPC dossiers with portraits; state file ~440–540 KB, checkpoint ~700 KB):
- Chrome `[Violation] 'setTimeout' handler took 512ms` at storysuite-v2.js:1563 (listen() rerender → notifyChange +
  redrawCastViews) and index.js:5842 (queueInlineRender → renderInlineCards, retries while missing > 0).
- Every click/operation GETs `/user/files/npc-state-delta-<id>.json` (no-cache) right after it was written; the
  checkpoint file is read too. Worst with the dossier page open (dossier-ui.js boundFocus → scheduleRefresh on every
  window focus while the panel is open).
- Root cause found by the lead: storage.js inspectNpcStateDataFile, the per-turn "boundary check", fetches the whole file
  and runs response.text() + decodeStateFilePayload() just to read revision/writerId; a 304 still yields the cached full
  body, so every check is a full parse on the main thread.

Fix, one test each, smallest safe change:
1. inspectNpcStateDataFile: cache per path {etag, lastModified, decoded result}; when the response is 304 or its ETag
   equals the cached one, return the cached decode without text()/decode. Keep the no-cache revalidation (correctness
   across tabs/devices stays as now).
2. After our own successful write, record the revision/ETag we wrote so the next boundary check for that path needs no
   decode (and no fetch if the existing flow allows it safely).
3. Same for the checkpoint read if it has the same pattern (vault.js).
4. dossier-ui focus refresh: refresh only when the storage revision changed since the panel last rendered.
5. renderInlineCards: messages hidden by other extensions (is_system / not in the DOM) do not count as `missing`, so
   the 80…1400 ms retry chain does not run every reply; render only changed messages when possible.
6. storysuite-v2 listen() rerender: coalesce bursts (one redraw per animation frame) instead of a full redraw per event.
Do NOT change what is saved, the fail-closed/branch rules, or scan logic. Measure before/after per-operation main-thread
time with a synthetic state of ~500 KB and 20+ dossiers with portraits (report numbers). Bump to 1.10.1 the way 1.10.0
did (5486fbd: manifest, package, runtime-modules.json, core.js NPC_STATE_VERSION, bootstrap banner, README/AI-README/
DEVELOPMENT, version tests); CHANGELOG "## 1.10.1". Full suite, compat, smoke, npm run check, git diff --check,
measure-prompts identical. Commit and push stage69/perf. Report: head sha, items, timings, tests with counts.
