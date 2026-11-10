# GR-FIX — fix the final gear review findings on stage57/gear-int

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/grf/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned changes
named, a test per fix run after it, `npm run check` + full `npm test` + `git diff --check origin/main HEAD` green before
push; timing tests b1r2-capture / settings B8 fail under load — re-run alone once; PID files; never pgrep -f/pkill -f).
If any command is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Branch: Story_block `stage57/gear-int` (91e0146) — commit on it directly. Reviewer probes (read them, turn them into
repo tests): $S/rv-gr-final/probe/middle-delete.test.mjs, $S/rv-gr-final/probe/g3-bypass.test.mjs.

R1 (blocker) A change BEFORE a roll must change its gear: today precall puts the gear record in the payload and
   resolve replays it without checking the earlier story, so deleting (or editing + Re-reading) the reply that gave and
   equipped gear leaves every later roll with the bonus. Fix: resolve() works the gear out from the state before the
   roll (planGear over ctx.query, `recorded` path) and the payload keeps only the version mark (`gear: { v: 1 }`), so a
   later equip still never moves a stored roll (it comes after) and replay stays equal; a roll stored by an earlier
   build of this branch never shipped, so no compatibility shim is needed beyond rolls without `gear` (pre-gear) which
   must replay unchanged. Re-read/middle delete/edit tests with live == rebuild == reload.
R2 G3 bypass: `gear.wear` / `inventory.gear` accept `recorded: true` only from the RPG's own nested call (ctx.caller is
   the RPG module id inside rpg.resolve); refuse it for event:* callers and top-level calls; with gear off a pack event
   `gear.wear` is refused as before. Test with the probe.
R3 giveGear on join: never fail the join — check before calling (resolve each item by def id, skip a taken slot or a
   refused piece with a Problems line), grant by `def: item.id` (not by name), equip only when the slot is free.
   Fix the comment. Tests: ambiguous/duplicate story item name, taken slot.
R4 sameWho: first-name/alias match only when exactly one Character matches ("Ren Ashby" + "Ren Holt" with actor "Ren" →
   neither by first name). Test.
R5 packs.castGear uses sameWho for "already in the party". Test.
Report: head, each R fixed or not, pinned changes, counts. Short.
