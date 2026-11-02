# YS — Story Studio: Stat formula card (branch `stage36/pack-formula` from origin/main 3036ab8; clone $S/ys/)
Read Y-CONTRACT.md and X-COMMON.md first.
Build mockup item 2 (vm-results/u10/NOTES.md "2. Pack formula in Studio"): "Stat formula" card first in Pack settings,
row "Plays on", segmented Reader's choice | Standard | Classic (`.cf-seg`, aria-pressed), the help line that changes with
the choice (exact texts in NOTES.md), writing through src/edits.js (Undo/Redo, Check, export) the `{ slug: 'formula',
formula }` record of `content.rpg` (create the list when missing; keep `numbers` and other records; "Reader's choice"
removes `formula` and drops the record only when it has nothing else). The JSON card stays. Tests (unit + the
browser test style the repo uses, STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium) and `npm run build`; keep dist within
budget. Shots desktop + phone into $S/ys/shots/.
