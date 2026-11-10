# STU-REL — Story Studio 0.7.0 release prep (gear item form, synced to Story Block 2.18.0)

Rules: X-COMMON.md hard rules (secrets, user data, own clone $S/stu/, push only your branch, never merge/PR/force/tag,
never weaken/skip/delete a test — pinned changes named; never pgrep -f/pkill -f; never `playwright install` — browser
tests use STUDIO_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome). If any command is denied, stop
that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo https://github.com/kohz87/Story_studio, branch origin/stage55/gear-items (b6fbe92) — commit on it.
1. Sync the vendored Story Block from kohz87/Story_block main 233b131 (2.18.0) the way the repo does it (read its
   README/scripts: `sync-sb` or similar). The Ersveil 2.6.0 example (items + cast gear) must load and validate in Studio.
2. Replace Studio's own copy of the gear constants in src/gear-form.js (slots, stats, rarity budgets) with imports from
   the vendored Story Block (domains/gear.js) if that is clean; else keep them and add a test that they equal SB's.
3. If the vendored SB now accepts a cast `gear` list, make sure the cast form keeps it (round trip unchanged; no new UI —
   a JSON fallback is fine; say what the cast form does with it).
4. Version 0.7.0 in every place the repo keeps it (grep 0.6.0), CHANGELOG 0.7.0: "Items: Slot, Rarity with its stat
   budget, up to two stat bonuses (Story Block 2.18.0 gear); synced to Story Block 2.18.0; Ersveil 2.6.0 example."
5. Rebuild dist as the repo does; full test + check + `git diff --check origin/main HEAD` green. Push.
Report: head, what the sync changed, tests/counts. Short.
