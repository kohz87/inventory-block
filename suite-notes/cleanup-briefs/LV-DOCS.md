# LV-DOCS — docs for the levels release (Story Block 2.17.0); docs only, runs in parallel with LV-INT

Read LV-CONTRACT.md (all addenda) first; also the branch reports in ../V2_LOG.md entries of 3 Nov (LV-A, LV-B, LV-C,
LV-E, LV-F, LV-G, LV-UI). Rules: X-COMMON.md hard rules (secrets, user data, exact trailer, own clone $S/lvd/, push only
your branch, never merge/PR/force/tag). If any command is denied, stop that step and report it; never re-run it in
another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main cea0b4b. Branch `stage53/levels-docs`. Edit ONLY docs: docs/v2/*.md (SPEC, ERSVEIL,
any RPG/rules doc — find them), README.md/AI-README.md RPG sections (NOT their version lines or suite lines — the lead
bumps), and a draft CHANGELOG entry in a NEW file docs/v2/CHANGELOG-2.17.0-draft.md (the lead moves it). No code, no
tests changed. Run whatever doc tests exist (`npm test -- tests/**/readme*` or grep for doc-pinning tests) and keep
them green; `git diff --check`.

Cover, in plain short words: Level 1–99 replaces Soul Class (100 XP per level, extra XP carries over, +1 point every 3
levels, Level cap setting 1–99 and per-pack cap — pack first); roll term floor(level/5) (Custom divisor 3–8); foe
level{n}, Health 4 + floor(level/30), initiative d20 + floor(level/5) + AGI/2, new foe level from its rank band or ±2 of
the party average, held to party highest + 10; ranks table `rpg.ranks` and `rpg.playerRank` (Ersveil: Guild letter,
shown only when registered); labels "Lv 14 · Guild F", "Rank F · Lv 7"; fight XP formula and the 1..60 range; XP rate
50–300 %; practice per use 1–5 (max 20 per reply); old chats: rolls made before levels replay unchanged, old blocks read
Soul Class n as level 10n−5; character files carry `level`; RPG code loads only when a chat uses it; slimmer stored
rolls. Ersveil 2.5.0: rank bands F 1–9 … SSS 80–99, requires Story Block ^2.17.0.

Report: branch + head, files, anything in the contract you could not confirm from the code (say which). Short.
