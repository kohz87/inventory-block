# Part B (USER approved 2 Nov; mockup https://claude.ai/artifact/V9U7kfpstDwvTjjsS9tWgd, script + texts
# vm-results/u10/mock2.mjs, mock.mjs, NOTES.md — read NOTES.md fully; texts come from it)
Rules: X-COMMON.md (all hard rules; browser check required for YA; never re-run a denied command in another form — stop and report).
USER decisions: one "Edit" button replaces every hero pencil; clock may go backwards (rewind allowed); an invalid field
saves nothing (editor stays open, names the field); Studio shows the formula choice only, with "Reader's choice".

## Clock contract (YB builds, YA uses)
- Query `director.time` keeps `{ minutes, text }` and ADDS `parts: { year, month, day, minutes }` (month 1-based, day
  1-based, minutes 0..1439 of the day) or `parts: null` when the clock is unset. Existing callers unaffected.
- Query `director.calendar` (exists): plain data, `months: [{ name, days }]`, `era`, `leapYears`, … — the editor's
  Month list and Day max come from it (months are SD's, from the reader's calendar, else the pack's, else Gregorian).
- Command `director.clock` (cause user), payload `{ year, month, day, minutes }`. SD validates with its calendar
  (leap years included) and refuses with one plain sentence naming the field ("Goldwane has 30 days.", "Pick a date and
  a time."). On success the clock is SET on the current reply (as `~ time <date>` capture does; replay, swipe, middle
  delete exact; rewind allowed; not bound by the 30-day limit of `! time` lines). Summary/card line "Clock set to
  <short date, time>" (era/year left out when unchanged, as NOTES.md says), sub "Your edit".
- Story Director off or no calendar → the editor has no date/time fields (Story group keeps place, weather, here).
