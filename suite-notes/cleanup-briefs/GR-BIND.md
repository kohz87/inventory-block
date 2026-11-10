# GR-BIND — bound signature gear, logic only (Story Block 2.18.0; USER 3 Nov)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/grb/, push only your branch, never merge to
main/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, never weaken/skip/delete a test — pinned changes
named, a test per change run after it, `npm run check` + full `npm test` + `git diff --check origin/main HEAD` green
before push; timing tests may fail under load — re-run alone once; PID files; never pgrep -f/pkill -f). If any command
is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage57/gear-int (latest; another agent, GR-FIX, may still push the reader-lead mark and the
"no roster → no grant" change to giveGear — `git fetch` and `git merge --no-ff` its newer head before you push; keep
both). Branch `stage58/gear-bind`. NO screen changes (the mockup is awaiting approval) — logic, data, strings for
refusals, tests, GEAR.md.

Behaviour: a cast member's signature pieces (cast `gear`) granted on join are BOUND to that member.
1. Mark the granted stack bound to the member (an inventory field such as `bound: <actor id>`; read inventory.js for
   how stacks carry owner/equip state; replay-safe).
2. Refuse, with "Bound to <Name>: <Item> stays with them." (strings.js), every path that would move or unequip a bound
   piece: item.equip to another owner or another slot, inventory.unequip, inventory.transfer, sell/drop/remove/consume,
   narrator `- item`/`~ item … equipped:`/give lines, Edit (the command it sends). Wear (gear.wear) and repair stay
   allowed.
3. When the member leaves the party, their bound pieces leave with them (removed from the party inventory as part of
   the leave receipt); on rejoin they come back once (no duplicates; condition kept if the story kept it — say what you
   chose).
4. No party roster → nothing granted (GR-FIX is doing this; keep it).
5. A query field for the screens: inventory rows / gear.view carry `bound: { who }` so the UI agent can draw the chip.
Tests: each refusal path; wear/repair allowed; leave/rejoin; replay equality (swipe, Re-read, middle delete, rebuild,
reload); gear off → no `bound` anywhere and joins as 2.17.0.
Report: branch + head, fields/strings added, tests, pinned changes, counts. Short.
