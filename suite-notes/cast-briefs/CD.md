# CD — Story Director: the living cast
Read C-COMMON.md first. Repo kohz87/Story_director, branch `stage33/cast` from origin/stage32/key-people (47c6a0d; Key
people is in review — merge its later fixes in with merge commits if the lead tells you). Test ST port 8185 with
Story Block `stage33/cast` (agent CS; until it lands, stub `packs.content({kind:'cast'})` in tests) + NSD main.
1. Domain `cast` + query `director.cast` (C-COMMON §2). New entries from a newer pack version join at the current
   story day at their start; an unmet person whose entry changed takes the new words, keeps their off-screen state;
   met people unchanged; removed entries: unmet leave quietly, met stay. First reply after an update: "Ersveil pack
   updated: n new people now live in the world" (no names), as in mockup C7.
2. Off-screen moves: only on a day change or time skip, one planner batch, one short line per person and only where
   something changed (`~ cast <id> | where | doing`), within a small budget; unmet never in the narrator tail. Death
   off-screen only if the setting "Unmet cast can die off-screen" is on or the entry has `canDieUnmet` (default off).
3. Meetings (no dice): first time at their place while their routine has them there, or `drawnTo` touched by the
   story (planner judges, cites the reason) → they come; cap "new faces at most" (1 a day default; 2 a day; 1 a
   week); never during a fight. The narrator line brings them in; This reply shows "Paths crossed: Fenna" with the
   reason (mockup C1, C2). After meeting they are part of the world (planner may bring them when sharing a place).
   Met cast can be pinned as Key people (existing keypeople).
4. Screens per mockup: This reply cards (C1–C3, C7), World → Around here (C4: "Met n of N" always, "may cross your
   path here: n, not yet met" only when near, met people's last news), Settings → Modules → Story Director → The cast
   (C6: on/off, new faces at most, unmet can die). Use CS's compact pills if landed, else plain buttons.
5. Feature: inside the existing feature set as "The cast" (on by default; Lean keeps it). Byte-identical prompts when
   no pack has a cast.
Report: head SHA, counts, shots, deviations.
