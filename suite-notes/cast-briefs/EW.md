# EW — Write the Ersveil cast (USER: heroines and heroes of the lore; 8–12 core, up to 16)
Read C-COMMON.md (the cast entry format, secrets rules) and the V2_LOG 1 Nov entries on the living cast and secrets.
Writing only: NO repo pushes. Your folder: $S/ew (S = the scratchpad). Read (do not change) Story Block
examples/packs/ersveil/pack.json and ersveil-lore.json from origin/main of kohz87/Story_block (clone into your folder):
places, regions, routes, events (timeline), the lorebook (factions, history, names), the calendar and the story start.
Write 12 core people (a mix of heroines and heroes; varied regions, factions, classes, ages, temperaments; several who
can become companions, a few who start as rivals) — every one consistent with the lore, original (no famous
characters), adult. Each entry, in the C-COMMON shape:
- id, name, aliases, about (one line), look, voice, personality, history (background);
- start: { place: an EXACT place name from the pack, goal, routine (where/when they can be found) };
- drawnTo: 1–3 short phrases tied to the pack's events, places or factions;
- meters: { preset: "companion" (or what the pack defines), trust/affection/tension starting values }, stages (3),
  fields (e.g. "Soul Class": "I".."IV", "Rank": …);
- secrets: 3–5 layers, light → deep, each { title, text (≤ 300 chars), meter + at (rising) | when (a short concrete
  story event) }; at least one `when` per person; secrets tie people to each other and to the timeline where it fits;
- canDieUnmet: false; portrait: "<id>.webp" (art comes later).
Deliver: $S/ew/cast.json (the entries, validated against the C-COMMON limits by a small script you write) and
$S/ew/CAST.md (a readable sheet per person for the user: who, look, where they start, what draws them, secrets with how
they open, and how they connect to others), plus a one-paragraph portrait brief per person (for the art later).
Report: the 12 names with one line each and any lore gaps you had to fill.
