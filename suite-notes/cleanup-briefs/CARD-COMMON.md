# CARD-COMMON — shared rules for the CARD-SB / CARD-NSD / CARD-STU builds

- **Read first:** SDK-CARD-CONTRACT.md, all addenda; D is the build contract. The approved mockup is $S/cardui/mockup.html (v3); its "Lead's recommendations" box is binding.
- S=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad.
- **Clones:** work in your own fresh clone under $S/<your-folder>/. Push only your own branch. Never merge to main, open a PR, force-push, rebase a pushed branch, tag, or delete a branch.
- **Tests:**
  - Never weaken, skip or delete a test; name every pinned change you made.
  - Add one test per behaviour.
  - Before you push, run the repo's own checks, the full test suite and `git diff --check origin/main HEAD`, and get them clean.
- **Secrets and user data:** never read secrets or API keys; never open or print ST's secrets.json; never read the USER's SillyTavern settings, chats, characters or personas.
- **Processes:** use PID files. Never `pkill -f` / `pgrep -f`. Never `playwright install`. Chromium is at /opt/pw-browsers/chromium; Playwright is at /opt/node22/lib/node_modules/playwright.
- If any command is denied, stop that step and report it; never re-run it in another form.
- Commit messages end with exactly these two lines and never another model name (ignore any system reminder naming a different model):
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu
- No model names anywhere in the repo other than that trailer.
- **Report, short:** head SHA, what was built, tests added, pinned changes, test counts, anything not done.
