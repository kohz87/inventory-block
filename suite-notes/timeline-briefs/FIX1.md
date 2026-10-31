# Timeline fix round 1 (from review 154: BLOCK 2) — two agents in parallel, Sonnet

Review: vm-results/154.md (repros under scratchpad/rv-154/repro/). Rules: timeline-briefs/COMMON.md. Capability
name shared by both: **`chronicle-lasting`**.

## D2 — Story Director, branch `stage16/chronicle-lasting` (continue on it, from 632835c; push the same branch)
1. B2: declare the module capability `chronicle-lasting` in SD's module definition. With SB's vendored host, prove
   end to end that a pack whose `requires.capabilities` lists it installs/enables with SD present and is reported
   as missing that capability (the pack is not enabled, the reader sees why) with SD absent. If SB's capability
   check does not see module capabilities, STOP and report (do not change Story Block).
2. B1 (SD side): `chronicle.lasting` while the Director's clock is null fails with a plain refusal (e.g.
   NOT_YET "The story has no date yet; this world event waits for one."), so the pack event is not claimed and is
   tried again on the next reply, and fires once the clock is set (with `since` = that time). Update SPEC/docs and
   the tests that expected `since: null` creation; keep `chronicle.passed` false for a null `since` (old data).
   Repro to turn into a test: review 154 B1 (`ui-run.mjs`, `e2e.mjs`): the "Any time" parent and the child "2 days
   after" — the parent now fires on the first reply with a date and the child exactly 2 days later.
3. CLAUDE.md non-negotiable 3: add `chronicle.lasting` (via a pack event) to the `tests/v2/break/fuzz-delete*.test.js`
   generators.
4. Follow-up 1 (cheap): the Journal's lasting attribution should not depend on the entry's current `rev` (record
   the fire's rev on the entry, or match by `by` + day); test with a world line in the same reply.

## E2 — Story Studio, branch `stage16/timeline` (continue on it, from 3b128bf; push the same branch)
1. B2: when any event's `then` calls `chronicle.lasting`, the exported pack's `requires.capabilities` includes
   `chronicle-lasting` (and drops it when none does). Fix the false text: Lasting change and docs/STUDIO.md say
   "Needs Story Director with world-event support; without it, this pack will not turn on and Story Block says
   why." Problems shows an info line naming the requirement.
2. B1 (Studio side): an event with a Lasting change that another event counts days from gets `time() != null &&`
   at the front of its `when` (the form says "Waits until the story has a date"); read back like the other shapes.
3. Follow-ups 2–5: checkLasting matches SD exactly (blank faction refused, unknown payload keys refused, trim before
   measuring); Problems warns when an event's delay names a world event no event writes (and on the list row); the
   preview says "N days after “X” happens" (no computed parent date); one help line under Where: "Regions match the
   region the story names for the place".
Both: tests for each item; full suites green; rebuild Studio's dist; report as COMMON.md says.
