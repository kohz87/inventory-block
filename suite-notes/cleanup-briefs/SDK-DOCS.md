# SDK-DOCS — tutorial + example card for the public API (SDK-CONTRACT.md part 4)

Rules: X-COMMON.md hard rules (secrets, user data, own clone $S/sdkdocs/, push only your branch, never merge/PR/force/tag,
never weaken/skip/delete a test; never pgrep -f/pkill -f). If any command is denied, stop that step and report it; never
re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage64/sdk-api (7bec448 or newer). Branch `stage64/sdk-docs`. Docs + example only, no code.
Read docs/v2/PUBLIC-API.md and the shipped code first (src/v2/public-api.js, src/v2/sb-macro.js) — document only what
exists.
1. docs/v2/BUILD-A-CARD.md: "Build your first card on Story Block" — plain, short steps: install; turn on the RPG or a
   pack's data module; show values in a status bar with `{{sb::…}}` (a SillyTavern regex script example that renders
   "📍 {{sb::scene.place}} · 💰 {{sb::money.text}} · ❤ {{sb::party.me.health}}"); use `{{sb::path|fallback}}`; list the
   paths (link PUBLIC-API.md); react to changes from a script with `StoryBlock.api.on('story:changed', …)` (a 10-line
   example that logs a level-up); what is never exposed (hidden values); limits (read-only, v1 promise).
2. examples/cards/status-bar/: a regex-script JSON a reader can import into SillyTavern (check the ST regex export
   format in /home/user/st-smoke/SillyTavern — read its docs/code; never the USER's data) + a README.md explaining it.
3. Link BUILD-A-CARD.md from README and docs/v2/PUBLIC-API.md.
Run the repo's doc/README tests (e.g. tests/readme-examples.test.js) and `git diff --check origin/main HEAD`; push.
Report: head, files, anything in the contract that the code does differently. Short.
