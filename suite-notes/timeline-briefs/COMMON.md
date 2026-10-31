# Timeline build: rules for both agents (31 Oct)

Read `/home/user/inventory-block/suite-notes/SPEC_TIMELINE.md` first; §1 is the fixed interface.

- Clone your repo fresh into your folder under
  `/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/tl-<letter>/` and branch from
  `origin/main`. Touch only what your brief names; say in the report if you had to go wider.
- `npm run check` and `npm test` green before you push. Never weaken, skip or delete an existing test; update a pin
  only when your change legitimately extends a list, and say so.
- Never read SillyTavern's `secrets.json`, API keys, or the user's chats, characters, personas or settings. Never run
  `playwright install`; for a browser test use `PLAYWRIGHT_BROWSERS_PATH=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/pwb`
  or `executablePath: '/opt/pw-browsers/chromium'`. Never `pkill -f`/`pgrep -f`.
- No model or vendor names anywhere in the repo (code, comments, docs, commit messages) except the trailer. Commit
  with exactly this trailer and no other:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu
  ```
- `git push -u origin <your branch>`. Never force-push, merge, open a PR, tag, or push to another branch.
- Match the surrounding code's style, naming and comment density. Reader-facing text in plain words.
- Final message: branch and head; what you built per item; tests; anything outside your files; open questions.
