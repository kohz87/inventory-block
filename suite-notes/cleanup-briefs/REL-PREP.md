# REL-PREP — release prep for the gear release (docs/versions only, three small jobs)

Rules: X-COMMON.md hard rules (secrets, user data, own clones under $S/relprep/, push only your branches, never
merge/PR/force/tag, never weaken/skip/delete a test). If any command is denied, stop that step and report it; never
re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

A. NPC State Delta 1.7.4 on branch origin/stage56/cast-gear-line (commit on it): bump every version location
   (core.js NPC_STATE_VERSION, bootstrap.js, manifest.json, package.json, runtime-modules.json, tests that pin it incl.
   the escaped regex in hydration-recovery-safety, README lines 1/106, DEVELOPMENT.md 5/259, AI-README 1/19/297 — grep
   for 1.7.3 and update the ones that mean "this version"), CHANGELOG 1.7.4 ("NPC gear line: with Story Block 2.18.0,
   RPG and Gear in fights on, a pack NPC's entry ends with their signature gear until they join"). Full suite with
   node 24: `npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js tests/v2/break/*.test.js`.
B. Story Studio on branch origin/stage55/gear-items (commit on it): fix the refused-edit message — when an edit is
   refused, the inline error must describe what the reader tried AND the field must show the stored value, e.g. "DEX 3
   would use 4 points; rare gives 2." (not "The points add up to 4" while the fields show 1 + 1). Test it. Do not bump
   the version (the lead decides after the Story Block sync). Repo's full test + dist rebuild as its README says.
C. Story Block docs draft on a NEW branch `stage58/gear-docs` from origin/stage57/gear-int: a NEW file
   docs/v2/CHANGELOG-2.18.0-draft.md (plain short bullets: Gear in fights toggle in Settings → RPG; rarity budgets and
   stat bonuses (+ effective stats up to 30); 8 slots; carry = 10 + 2×STR + bags + mounts, Heavy at 80 %, Encumbered
   −2 AGI/DEX at 100 %; wear on decisive hits Good→Worn→Torn→Broken, repair mend|restore, ruin breaks; condition in the
   prompt and value; battle-log gear and wear lines; Legendary only after a quest or a win vs foes 10+ levels above;
   Inventory tab sections and CARRY card, Party card Inventory button and slot card; signature gear for pack NPCs,
   bound to them; Ersveil 2.6.0: 16 signature items and each NPC's gear; gear off = 2.17.0 exactly). Read GEAR.md and
   the branch to confirm each line; mark anything you cannot confirm. Do not touch version lines.
Report per job: branch + head, files, tests/counts. Short.
