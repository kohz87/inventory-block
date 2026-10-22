# Story Suite v2: rolling attack during the beta build

The user wants beta reached as fast as possible. Instead of waiting for every wave to merge, breakers attack each
feature PR as it opens, and `v2` as each PR merges, so fixes happen while the waves are still landing. The final
combined round then only has to confirm the frozen beta candidate.

You are a breaker. Do not push to the repos, do not open PRs and do not merge. Owners fix.

<SP> = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad

## Read first
- `<SP>/BREAK_BRIEF.md`: invariants 1–8, the finding format, and the setup (testkit, live instance).
- `<SP>/WAVE_BRIEF.md`: the rules every feature PR must keep.
- `<SP>/V2_LOG.md`: decisions, especially the end of the file.
- Earlier reports: `<SP>/break/*/REPORT.md` and the `r2/`/`r3/` NOTES.txt files. Don't repeat what held up there.
- Story Block `docs/v2/SPEC.md` and `MODULES.md`.

## Loop (repeat until I tell you to stop)
1. List the open and recently merged PRs on `v2` in all four repos (kohz87/Story_block, rpg_battle,
   Story_director, npc_state_delta) with the GitHub MCP tools (load them via ToolSearch).
2. For each PR in your area that you haven't attacked yet:
   - fetch its head into your own clones (`git fetch origin pull/<n>/head:pr-<n>`);
   - run its tests;
   - attack it against the invariants with hostile, odd and heavy inputs, swipes and middle deletes, reloads,
     feature toggles off and on, and a missing module.
3. Prove each finding with a failing `node:test` file, written so it can be dropped into that repo's
   `tests/v2/break/`.
4. Send each finding at once to the owning agent with SendMessage: one finding per message, with severity, repro,
   expected vs actual, the test path and a suggested fix. Send a one-line copy to `main`. Owners merge their own
   PRs when CI is green; a finding on a merged PR becomes a follow-up fix.
5. Every ~2 hours, send `main` a short tally: PRs attacked, findings by severity, what held up.

## Owners (agent ids for SendMessage)
| Agent | Id | Area |
|---|---|---|
| SB-features | ae37dab34b53502bc | Features toggles (F100) |
| SB-storage | aaa947c9681c27ce1 | saves, checkpoints, record kept once, receipt trimming |
| SB-inv | af4341b0b1574a3ff | Equip on…, loot picker, encumbered, name matching, cond, inventory.wear/repair |
| SB-view | ad0a100f6974ee605 | inspector, save points, compat panel, ss.meter, Home labels, HUD cue |
| SB-packs2 | a34381abe6082f1e0 | recipe fields, crafts / meterPresets kinds, Ersveil value audit |
| RB-gear | ad28a3fc89add6d2c | wear, repair, refinement |
| RB-craft | aeeb85e012b94a787 | crafting (F102) |
| RB-party2 | aacd9488154dfd745 | party.ranks, foe rank, companion formula, points badge, timed effects |
| RB-balance2 | a995f3c78178c67eb | normalized tiers, lone foes, stun rule, bosses (combat/setup.js) |
| RB-screens2 | a2c9cd64b9bd0397d | RB screens: HUD, wizard, crafting, gear UI, export/import |
| SD-digest | acd9c89bb5b361c12 | day digest, Chronicle Days, time.now |
| SD-ranks | (see V2_LOG) | quest rank hold |
| NSD-meters2 | ac9dae4d6f3ebb9b8 | stages, ceilings, presets, teasers, dossier meters |
| NSD-prompts | a36ba1b5135bebc58 | NSD prompts, one-pass calls, backfills |
| b6-fix | ab73bc00eb9476ba4 | Director problems / RB checks.log ops, head mount |

If an owner has finished (the send resumes it) or you can't tell who owns something, send the finding to `main`.

## Machine limits (one shared 16 GB box; the soak was OOM-killed last time)
- Work in the testkit first. Before starting a live instance, run `free -g`; start one only if "available" is
  at least 5 GB.
- Run at most one live instance per breaker, only on your assigned ports, and stop it when you finish.
- Use the raw-CDP page from `<SP>/break/b6-soak/scripts/` instead of keeping Playwright response bodies in memory.
- Clone into `/home/user/_break/<your-id>-beta/`. Clean up `node_modules` you no longer need.
