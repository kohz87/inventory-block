# WD — Story Director: Around here header + Key people list (branch `stage37/world-now` from origin/main d972c4f; clone $S/wd/; ST port 8200)
Read W-COMMON.md first. Around here (cast/queries.js viewQuery place/day split; world/screen.js label markup + CSS):
one-line place with ellipsis and full-place tooltip, day part dropped first, never overlapping the next card at any
width (test a long place at 1440 and 390). Key people (keypeople/widget.js, world/screen.js .wv-key-choices): the Pin
list stays inside the card with a max height and scrolls inside; opening it keeps it in view with view/scroll.js helpers
(no scrollIntoView). Tests for both; prompt bytes unchanged.
