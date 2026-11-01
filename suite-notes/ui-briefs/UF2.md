# UF2 — Story Director review fix-ups on stage29/ui-b (from reviews 179/180)

Read UI-COMMON.md. Repo kohz87/Story_director, work ON branch `stage29/ui-b` (head f9a1969; add commits, push the same
branch; never force). Test ST port 8174 if needed. Reviews: /home/user/inventory-block/vm-results/179-ui-review-sb-browser.md,
180-ui-review-sd-nsd.md.

1. Story Block (agent UF1, in parallel on SB `stage29/ui-merge`) replaces its hard-coded default bar with an
   owner-declared screen flag `bar: true` ("in the bar by default"). Add `bar: true` to Story Director's Quests, World
   and Map screens/tabs. An older Story Block ignores the key.
2. `tests/v2/screens/render.test.js:243` ("status card: each reply's card is drawn from that reply's state") fails
   against the new Story Block (merged "This reply" card; `toggle(index, open?)`; summary drawn with the same screen id).
   Make the test meaningful and passing against BOTH the vendored old Story Block and the new one (run the suite with
   STORY_BLOCK_DIR pointed at a checkout of SB `stage29/ui-merge`). Do not weaken what it proves (each reply's card is
   drawn from that reply's state).
3. Cosmetic: in the Game view, World → Now keeps a bare "HERE" heading above People once the place/weather lines are
   hidden. Hide the heading too there (Story panel unchanged).
4. Tests per item; check + full npm test green (and the STORY_BLOCK_DIR run); push; short report with head commit.
No version bump/CHANGELOG/requires change (the lead does the release, requiring Story Block ≥2.12.0).
