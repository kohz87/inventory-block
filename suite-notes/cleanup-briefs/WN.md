# WN — NPC State Delta: People here in World (branch `stage37/world-now` from origin/main 64af0ac; clone $S/wn/; ST port 8199)
Read W-COMMON.md first. Change only the World view of the present list (src/storysuite-v2.js renderCast `world` branch,
bindCastActions, style.css per NOTES.md). The in-chat present card, the dossier and the Dossiers screen stay as they are.
Tests: World rows carry no Look/Next/field/hidden-note text (assert with a cast person who has all of them), one-line
clamp, row opens the dossier (keyboard too), the dossier still shows them.
