# UI cleanup build (1 Nov): rules for every agent

Approved mockup (before/after on the real app): https://claude.ai/artifact/AEcQn5iy89gGpzxZoSy8LV — local scripts that
drew the "after" (CSS/DOM patches only, a guide, not code to copy): `/home/user/inventory-block/vm-results/u1/after.mjs`,
`after2.mjs`. Baseline shots and DOM selectors: `/home/user/inventory-block/vm-results/u1/INDEX.md` and
`$S/u1/*.png` (S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad).
The current UI is the baseline: keep its look (panel styles, fonts, icons, spacing language). Change only what your
brief names. No new visual style.

## Hard rules (same as suite-notes/rpg-briefs/COMMON.md "Hard rules", all apply)
- Never read SillyTavern's secrets.json, API keys, or the user's chats, characters, personas or settings.
- No model or vendor names in code, comments, commits or docs. Commit trailer exactly:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu
  ```
- Clone into `$S/<your letter>/`, branch from the base in your brief, push only your branch (`git push -u origin <branch>`).
  Never force-push, merge, open a PR, tag, or push elsewhere.
- Do NOT bump versions or edit CHANGELOG.md (several agents share a repo; the lead does the release).
- Never touch rpg_battle (USER, 31 Oct).
- Off means fully off; stored state is never deleted by a UI change, a preset or a switch. Replay stays identical.
- Never weaken, skip or delete an existing test; if one pins a layout/text you change on purpose, update it and say so.
- A test per change/fix, run after the change only (no failing-before runs). `npm run check` and full `npm test` pass
  before you push.
- PID files only; never `pkill -f`/`pgrep -f`; never `playwright install` (Playwright at
  /opt/node22/lib/node_modules/playwright, Chromium /opt/pw-browsers/chromium).

## Browser check (required for anything the reader sees)
Own test ST, as in COMMON.md "A real SillyTavern": copy `$S/bc270/st-data` (never open its secrets.json) to your folder,
put your branch's extension in its `extensions/` (the other two at current main: Story_block 121e49a, Story_director
4b188c3, npc_state_delta 13daee6), copy `$S/bc270/live/config.yaml` with your port and dataRoot. The chat is filled
(Ersveil, `/go Ersveil`); `$S/u1/lib.mjs` has boot/gameview helpers. Shoot desktop 1440×900 and phone 390×844 of every
screen you changed into `$S/<letter>/shots/`, and compare against the matching `$S/u1/` baseline. Stop your ST when done.

## Report (final message)
Branch + head commit; what you did per item; tests added; files touched outside your area; shots folder; open
questions. Short.
