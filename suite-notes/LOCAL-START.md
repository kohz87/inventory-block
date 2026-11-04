# Start here on a local machine (USER 4 Nov: "everything on the machine, occasional cloud")

The USER's PC: 14 cores, 64 GB RAM. Work there first; use cloud sessions only for big parallel review rounds or while
the PC is busy. Context lives in these notes, not in any session: read TODO_NEXT.md (top) and the end of V2_LOG.md first.

## Folder layout (one work folder, never the live SillyTavern)
```
<work>/                         e.g. D:\storysuite-dev
  inventory-block/              this notes repo (branch claude/hopeful-babbage-tipaw8; notes in suite-notes/)
  Story_block/  npc_state_delta/  Story_director/  Story_studio/     clones (GitHub kohz87/...)
  st-test/                      a COPY of SillyTavern for tests: code + a copied data folder
  scratch/                      agents' clones, logs, probes (agents make fresh sub-folders here)
```
- Build `st-test` by copying SillyTavern into a NEW empty folder. Leave out `data/<user>/secrets.json` and never copy API
  keys. Never point anything at the live SillyTavern folder or its data. Never read the live settings, chats,
  characters or personas. The USER may hand over a chat export for a bug; keep it in scratch/ only, never commit or
  quote it, delete it when the bug is done.
- Test servers: ST on 8600–8799 with its own `--configPath` / `--dataRoot`, a mock model on the next port. Write the
  REAL server PID to a PID file (not a wrapper's), stop by that PID. Never `pkill -f` / `pgrep -f`. The USER's own
  SillyTavern keeps its usual port.
- Playwright/Chromium: install once with the USER's OK (the "never playwright install" rule was for the cloud box,
  which had a preinstalled browser). Node 22 for Story Block; NPC State Delta wants Node 24 (`npx node@24` was denied in
  the cloud — locally install Node 24 or use nvm).
- While the USER plays: at most ~4 agents, `--test-concurrency=4`; heavy runs otherwise. With 14 cores the full Story
  Block suite can use `--test-concurrency=8`.

## Standing rules (unchanged; full list at the top of V2_LOG.md and in cleanup-briefs/CARD-COMMON.md)
- Commit trailer, exactly:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu` (a new local session may use its own
  session line; no model names anywhere else in the repos).
- PR bodies end with "🤖 Generated with [Claude Code](https://claude.com/claude-code)", a blank line, the session link.
- Merge commits only; never force-push, rebase shared branches, delete branches or tag. Agents never merge; the lead
  merges on green CI.
- Every UI change needs an approved mockup first. Reviews by Opus agents at the USER's depth (TODO_NEXT top line).
- Blocker bar: loses/corrupts saved data, crashes/wedges, wrong results, or leaks a hidden value. Else follow-up.
- A denied command is never re-run in another form; tell the USER. Don't remove folders via variable-built paths.
- Stop updating rpg_battle (USER 31 Oct).

## Test commands
- Story Block: `node --test --test-concurrency=4 --test-reporter=dot "tests/*.test.js" "tests/v2/**/*.test.js" "examples/fishing/tests/*.test.js"`
  (~5,200 tests; b1r2-capture*, B8 Reset are timing flakes under load — re-run alone). `npm run check`.
- NPC State Delta (Node 24): full suite, `npm run validate`, compatibility check, runtime smoke, `measure:prompts`
  (must stay byte-identical unless a prompt change is intended). On Node 22, 5 tests in
  storysuite-participant-selection cancel — known.
- Studio: full suite with `STUDIO_CHROMIUM_PATH` set to a local Chromium; `npm run check`; rebuild dist after merges.
- Ersveil zip: `node scripts/build-example-zip.mjs` (and `--check`).

## Useful harnesses built 4 Nov (in the cloud scratchpad; re-create from the briefs if needed)
- Old-roll replay check (FIX marks none/2/3, 400 seeds): see THEN-FIX.md / rv-then.
- NSD at USER scale (30 dossiers, 12 portraits, ~2 MB state) profiler: mb-capture (Memory Books + NSD + SB in real ST).
- Suggested next: turn that into a long "real-world" test chat in CI (USER asked about weight; see TODO_NEXT).
