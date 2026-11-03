# SDK-BUILD — Story Block 2.20.0: public API v1 + events + `{{sb::path}}` macro (SDK-CONTRACT.md parts 1 and 2)

Read SDK-CONTRACT.md (approved; decisions at the top) first. Rules: X-COMMON.md hard rules in full (secrets, user data,
own clone $S/sdk/, push only your branch, never merge to main/PR/force/tag, no version bump/CHANGELOG (the lead bumps),
never touch rpg_battle, never weaken/skip/delete a test — pinned changes named, a test per change run after it,
`npm run check` + full `npm test` + `git diff --check origin/main HEAD` green before push; timing tests may fail under
load — re-run alone once; PID files; never pgrep -f/pkill -f; never `playwright install`). No screen changes. If any
command is denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main (3eb517b, 2.19.0). Branch `stage64/sdk-api`.
1. `StoryBlock.api` (new src/v2/public-api.js; exposed on the same global as `sdk`): version 1, host, ready, get(path),
   paths(), on(event, fn) → off. Paths exactly as the contract lists (scene.*, money, money.text, items, items.<name>.qty,
   party (RPG on), party.<name>.<field>, party.me.<field>, blocks.<blockId>.<field>); read from the CURRENT head state via
   existing queries/readers (no new state); every value a frozen plain copy; hidden values (secrets, hidden fields, locked
   notes, anything a screen hides) → undefined. Map each path to its source and say which hidden marks you honour.
   Events story:changed {index, changes:[{path, from, to}]} (diff of the public paths before/after a live reply),
   story:reply {index, summary}, story:rebuilt {reason}, story:chat {chatId}: built on the internal events (committed,
   head, turn) — emitted after save; listener errors caught and logged once. Freeze the surface; a frozen-surface test.
2. `{{sb::path}}` and `{{sb::path|fallback}}`: register with SillyTavern's macro API (read the ST version in
   /home/user/st-smoke/SillyTavern for the API: MacrosParser.registerMacro or the context's registerMacro), once; read
   via api.get; lists → comma list; objects → nothing (fallback); hidden → fallback; cap 300 chars; newlines stripped
   unless a list. Our own injected prompt text stays protected from macro rewriting (turn.js). Unregister on unload if
   ST supports it.
3. Docs: docs/v2/PUBLIC-API.md (the v1 contract as shipped: paths, events, examples, the stability promise) + one line in
   README/AI-README pointing to it.
4. Tests: surface freeze; each path family; hidden → undefined; events with replay (swipe → story:rebuilt; Re-read;
   reload); listener throw does not break a reply; macro: each path, fallback, hidden, cap, list. Real-ST check: install
   this checkout in a private ST copy (copy $S/lvst into a NEW folder $S/sdkst, ports 8310/8410, PID files) and show
   `{{sb::scene.place}}` and `{{sb::party.me.health}}` resolving in a prompt (mock prompts.jsonl) and in a regex-script /
   status-bar style output; screenshot 1440 to $S/sdkst/shots/; stop ST after.
Report: head, files, the path→source map, hidden rules, tests, the real-ST evidence, pinned changes. Short.
