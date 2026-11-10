# ROSTER — Story Block 2.18.1: the party roster (USER 3 Nov: "once 2.18.0 is merged, start 2.18.1 immediately")

Problem: no Story Block module answers `party.actors` (RPG Battle did; it is retired and never touched). Without it the
inventory has no members: all worn gear counts for the reader, the Party card's Inventory shows only the reader's, and a
pack NPC's signature gear is never handed out (GEAR.md "no roster").
Goal: the RPG answers `party.actors` from its Character blocks, so each party member is an actor.

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/roster/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, NEVER touch rpg_battle, never weaken/skip/delete a test — pinned changes
named, a test per change run after it, `npm run check` + full `npm test` + `git diff --check origin/main HEAD` green
before push; timing tests may fail under load — re-run alone once; PID files; never pgrep -f/pkill -f). If any command
is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main once it holds 2.18.0 (the lead tells you the merge commit). Branch `stage61/roster`.
1. Query `party.actors` answered by the RPG part while the RPG is on (with gear on or off — read every reader of
   party.actors: inventory owners, boundName, gear.js planGear/lead, giveGear, gear.view, castGear, the Party card): one
   actor per Character block in the party: `{ id, name, aliases?, pc? }`. The id must be STABLE across rebuild, rename
   and reload — derive it from the Character block's module/instance id (read how blocks are keyed), never from the
   name. Also answer `party.pc` (the reader's own Character: read how the reader's block is known today — the `you`
   line, persona, first block) if nothing else does. A module that already answers party.actors (an old RPG Battle
   chat) keeps priority: read the registry's query resolution and do not shadow it.
2. Existing chats: stacks owned by `party` stay the party bag (the reader's). Nothing is moved automatically; a member's
   gear becomes theirs only when equipped to them from Edit (or granted on join). Replay of 2.18.0 chats must be
   byte-identical up to the first new action (no retroactive owner change): prove with a 2.18.0-made chat rebuilt.
3. Join/leave: `+ party` and `- party` (data-modules/part.js) now find the joiner's actor by the block id, so
   signature gear is granted and bound on join and stowed on leave (GR-BIND's path). Rename while present (P8) works
   because the id is the block's.
4. Screens: no layout change (approved mockups). The Party card's Inventory button opens that member's slot card;
   "Equipped · <name>" chips name the member; Edit's "Equipped by" lists the members.
5. Rolls: planGear's lead/owner logic uses party.pc / actor ids (keep the mark.lead fallback for rolls made by
   2.18.0); the guard's F1 follow-up (who `own` should be) — make the guard check the owners too if it is small.
Tests: actors answered from blocks (ids stable over rename/rebuild/reload); companion owns and wears own gear and their
bonus goes to their rolls; signature gear granted, bound, stowed and restored via a real `+ party`/`- party`; a 2.18.0
chat replays unchanged; RPG off → no answer; an old module answering party.actors still wins.
Docs: GEAR.md roster section, CHANGELOG draft note in docs/v2/CHANGELOG-2.18.1-draft.md (new file).
Report: head, ids scheme, what changed, tests, pinned changes, counts. Short.
