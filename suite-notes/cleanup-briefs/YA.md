# YA — Story Block: one Edit button for the Game view hero (branch `stage36/hero-edit` from origin/main 79df89f; ST port 8195; clone $S/ya/)
Read Y-CONTRACT.md and X-COMMON.md first. Another agent (XA) works on SB branch stage36/cleanup-sb (packs, chat scroll);
stay out of those files.
1. Remove every per-item pencil from the hero (place, weather, here, rank, wearing, condition: `cornerPencil` and the
   `ss-hero-you-pencil` block). Lines stay plain. Purse/mount/other pencils elsewhere stay.
2. One "Edit" pill (pencil icon + "Edit") at the hero's top-right (phone: beside the name), opening one editor in the
   hero: group "Story" (Year (era word)/Month/Day/Time from Y-CONTRACT, Place, Weather, Here as a comma text field),
   group "Character" (Rank when shown, Wearing, Condition — only while `story-block.you` is on). Help line "Changes apply
   from this reply on.", "Save" / "Cancel". Extend `ss.editable` kind `fields` with `type: 'choice'` (options) and
   `type: 'time'` rather than a new widget. Keep the current inputs/buttons look (mockup).
3. Save: nothing changed → close. Otherwise run the clock command FIRST (if the date/time changed); if refused, show
   its sentence under the fields, keep the editor open, send nothing else. Then the existing commands for changed
   fields only (`scene.place`, `scene.weather`, `scene.present`, `scene.you`). Escape / Cancel close without saving.
   Focus and scroll via view/scroll.js helpers (no scrollIntoView, no bare focus()).
4. Tests: editor model (which commands, in which order, refusal stops the rest), no-SD case (no date fields), no pencils
   left in the hero; update tests that pinned the old pencils and say so. Real ST with YB's SD branch
   `stage36/clock-set` once it is pushed (until then, the SD main for everything except the clock): shots desktop + phone
   of before/closed/open/saved, and a swipe + Re-read of a clock edit.
