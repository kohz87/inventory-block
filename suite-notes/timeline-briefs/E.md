# Agent E: Story Studio Timeline (Sonnet)

Repo https://github.com/kohz87/Story_studio, branch `stage16/timeline` from `origin/main`. Read COMMON.md.

The approved design is the mockup (SPEC_TIMELINE header): look at the three PNGs in `shots/` with the Read tool and
read `mock.mjs`, which holds the exact markup and CSS that was injected into Studio's real Events page for the shots.
Build that for real, in Studio's own code and styles.

1. **Timeline view:** the Events section is renamed **Timeline** (nav label and heading), with a Timeline/List switch
   (List = today's view). Timeline groups events by story year on the pack's calendar (month names, era such as CY),
   sorted by date; "after" events sit indented under the event they follow, labelled "N days later" or "right
   after"; events with no date go in "Any date · by place only". Rows show date, name and chips (places/regions,
   "once", "after: …"). The banner: "Players never see these. …" as in the mockup.
2. **The form** (inspector), as in the mockup: Name (and the saved id); When: On a date (from / optional until: day,
   month, year, dawn/noon/dusk/midnight or exact time) / After another event (pick it; "at least N days|hours|months
   later"; optional "no later than" date) / Any time; Where: Anywhere / Only in… (regions and places from the pack,
   searchable chips); News the AI is told (≤ 500, count); Happens once; **Lasting change: add to the chronicle**
   (checkbox, world event name, Looming/Ongoing/Resolved, place, factions, summary, Keep in mind) writing
   `then: [{ command: 'chronicle.lasting', payload }]` per SPEC_TIMELINE §1; the green "When this fires" preview in
   plain words; the Advanced fold showing (and allowing edits to) the raw `when`, `after` and `then`; Remove.
3. **Conditions:** generate `when` from the form, and read it back: a condition Studio wrote reopens in the form; one
   it can't read opens with the form's When/Where showing "Written by hand: edit it under Advanced" and is kept
   byte-for-byte. Dates convert to Story Block's `time()` minutes exactly as Story Block computes them for the
   pack's calendar (find the conversion in the synced Story Block kit and the existing Ersveil events, and test it
   against them: e.g. the Turning events in `examples/packs/ersveil/pack.json` of Story Block). Places/regions use
   the same query shape the existing pack events use (check; don't guess). "N days after" is only offered when the
   earlier event has a Lasting change; otherwise the number box is disabled with "Give “X” a Lasting change first:
   the days count from when it enters the chronicle."
4. Existing packs and their events load, show and export unchanged unless edited. The pack checker/Problems page
   flags a `chronicle.lasting` payload that breaks §1's caps.

Tests in Studio's style (unit for the condition writer/reader and date maths, DOM for the view and form, the build
test), `npm run build` so the committed `dist/` matches if the repo commits it, docs/README section.
