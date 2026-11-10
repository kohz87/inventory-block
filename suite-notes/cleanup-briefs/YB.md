# YB — Story Director: the clock command (branch `stage36/clock-set` from origin/main 1ae570c; ST port 8196; clone $S/yb/)
Read Y-CONTRACT.md and X-COMMON.md first. Another agent (XB) works on SD branch stage36/cleanup-sd (key-people removal
line, cast/follow.js); stay out of those files.
1. Build the Y-CONTRACT clock part: `director.time` `parts`, command `director.clock` (validation sentences, set on the
   reply, card line + summary, rewind allowed), registered next to `director.seed` (tracker/index.js commands). A new
   file (e.g. tracker/clock-set.js) beside seed.js. Calendar math via calendar.js makeCalendar (`toAbs`, `format`).
2. Deadlines, cast, key-people and anything keyed on the clock must follow a rewind as they follow a swipe (check
   `cast/world.js` reset and the deadline code; test one deadline and one cast routine across a rewind).
3. Tests: parts for set/unset clocks and a leap-year calendar; each refusal sentence; replay == live == reload; swipe and
   middle delete of the edited reply; a custom-calendar pack (Ersveil months). Push early once the command works (YA
   uses your branch) and say so in the report.
