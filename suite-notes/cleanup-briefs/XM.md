# XM — mockups for part B (no repo changes; working folder $S/u10/; test ST port 8194)
Read X-COMMON.md first. You draw "after" pictures by patching the real running app's DOM/CSS in Playwright (guide:
$S/u7/mock.mjs, $S/u9/mock.mjs), never by editing a repo. Keep the current look; change only what is named.
1. Story date/time pencil (Story Director): find where the story date and time show (Home / World / status line). Draw
   a small pencil beside it; tapping opens a compact editor (date fields in the story's own calendar as SD knows it,
   time of day, "Set" / "Cancel", one help line: "Changes the story clock from this reply on."). Show: closed, open,
   after setting (the card line "Clock set to …" on the reply). Desktop + phone.
2. Pack formula in Studio: Story Block 2.14.0 lets a pack choose the stat formula (Standard / Classic) — find the pack
   field in kohz87/Story_block docs. Draw it in Story Studio's Pack settings screen (run Studio from its repo; README
   says how) as one segmented choice with a one-line help, matching Studio's style. Desktop + phone.
Output: PNGs in $S/u10/shots/ (closed/open/after per item, desktop + phone), your script $S/u10/mock.mjs, and a NOTES.md
with each picture's file, the exact texts used, and where in the code each piece would go. Stop your ST when done.
