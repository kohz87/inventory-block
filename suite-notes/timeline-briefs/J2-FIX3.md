# J2 fix round 3 (re-check 162: BLOCK 5) — Sonnet, Story Studio `stage17/ai-write` (continue from 80e9f83)

Review: vm-results/162.md (repro per item; make each a test that fails before the fix). Rules: COMMON.md. Decisions:
1. A saved note whose signature cannot be compared with the current shape (an older or unknown `seen` form) stays
   active (fail closed): the warning shows and Keep stays blocked until the writer fixes the field or accepts it.
   Test with a draft saved in 2b10310's shape (`seen: '["date",null]'`) for the until and the when notes.
2. Warnings are never dropped on load. Cut notes are grouped: one note per field ("6 factions were shortened"), not
   one per item. If a draft still has more notes than the stored cap, raise the cap; a draft that cannot be saved
   whole is refused at Add with a plain message, never trimmed. Test the Harbor closes repro through save → reload →
   Keep (both the malformed-place and news-shortened warnings return).
3. Every PRESENT delay field (`days`, `hours`, `months`) is checked, each alone and in combinations; a wrong type,
   null included, is a ⚠ problem. Test `{days: 2, hours: null}` and the other pairs.
4. An invalid optional lasting field (`place`, `summary`, a faction) is left out of the payload, with its ⚠ note
   kept until the writer fills the field or accepts the note. The ordinary form can then repair the fields one at a
   time. Test the Harbor crisis repro: fill Place, then Summary, both saved; the notes clear as each is filled.
5. "after" matches the answer's exact name, normalised by case and spacing only: no slug fallback and no NFKC
   (`Gate ² opens` ≠ `Gate 2 opens`). Update the test that pins the slug guess (`tests/timeline-ai-answer.test.js`
   ~510) and say so in the report. Test both repros (Dawn-Watch vs Dawn Watch; the superscript).
`npm run check`, full suite with STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium, rebuild the dist, push the branch.
Never merge. Report: what changed per item, the failing-before evidence, suite counts, head.
