# ERS-LV — Ersveil 2.5.0 cast levels and lore wording (USER approved 3 Nov)

Rules: X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/erslv/, push only your branch,
never merge/PR/force/tag, no version bump of Story Block, never weaken/skip/delete a test — pinned changes named,
`npm run check` + full `npm test` + `git diff --check` green before push; timing tests in tests/v2/break/b1r2-capture*
fail under machine load — re-run alone once and report). If any command is denied, stop that step and report it; never
re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage53/levels-int (95f15fa or newer). Branch `stage53/ersveil-levels`. Edit ONLY
examples/packs/ersveil/* (pack.json, ersveil-lore.json, the zip — rebuild it the way the repo does, find the script),
docs/v2/ERSVEIL.md, and tests that pin Ersveil content. No code.

1. Cast `fields.Level` (USER-approved): Sister Temiwa 8, Rika 12, Barney Thimblewick 14, Torka 18, Gorm Kettlebright
   22, Nerissa 24, Asphodel 30, Sir Lothar 32, Ysmeth 36, Nysseth 44, Hush 48, Harrak 56. If a cast entry also states a
   rank or class anywhere in its text, make it agree with the bands (F 1–9, E 10–19, D 20–29, C 30–39, B 40–49,
   A 50–59, S 60–69, SS 70–79, SSS 80–99).
2. ersveil-lore.json: replace every "Soul Class" mention with level/rank wording that fits the sentence (e.g. "Soul
   Class III" → "around level 25 (rank D)"); make the lore's numbers agree with the bands (S-rank legends are 60–69,
   C veterans 30–39 — fix any other band the lore states). Keep the voice; change only what the levels require.
3. Rebuild ersveil.zip; the pack still validates; re-import test green.
Report: branch + head, each changed line summary (count), pinned tests changed, counts. Short.
