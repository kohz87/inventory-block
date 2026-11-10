# Brief for parallel extension agents

## Isolation
- Work ONLY in your worktree (given in your task) on your own branch. Never edit /home/user/<repo>
  main checkouts or /home/user/_main/* (read-only snapshots of origin/main for other extensions).
- Node deps: if your repo needs node_modules and the worktree has none, symlink the main
  checkout's: `ln -s /home/user/<repo>/node_modules <worktree>/node_modules` (don't commit it).
- Your own test SillyTavern + mock model (never use :8123/:5099, other agents use those):
  `eval "$($SP/instance.sh <name> <st-port> <mock-port> <Ext>=<your worktree> <Other>=/home/user/_main/<other> ...)"`
  Ext names: Story_block, Story_director, npc_state_delta, rpg_battle. Link ALL FOUR (yours to your
  worktree, the others to /home/user/_main/<repo>). This exports ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG, ST_DATA.
  Smoke helpers: $SP/smoke/demo-common.mjs reads ST_URL; scripts read MOCK_URL for the API url; use
  MOCK_Q (not $S/mock/q) for the mock's queue file and MOCK_LOG for logged requests (req-N.json).
  Chats live in "$ST_DATA/default-user/chats/The Narrator"; reset with
  `cp "…/The Narrator - 2026-10-18@01h44m00s947ms.jsonl" "…/The Narrator - 2026-10-18@09h00m00s000ms.jsonl"`.
  Name your scripts st-<name>-*.mjs. Stop your instance when done: `pkill -f "port <st-port>"; pkill -f "queue.mjs .* <mock-port>"`.
- SP=<SP>

## Shipping
- Tests (node --test), the repo's check/validate scripts, README + CHANGELOG + version bump
  (manifest, package, VERSION const, README header), live check in your instance.
- Commit with the usual trailers (Co-Authored-By / Claude-Session lines), no model ids anywhere.
- Before each merge: `git fetch -q origin main && git rebase FETCH_HEAD` (your branch only), re-run
  tests, `git push -u origin <branch> --force-with-lease=<branch>:<remote sha or empty>`, open the PR
  (body ends with the two attribution lines), poll CI (`gh api repos/kohz87/<repo>/commits/<sha>/check-runs | python3 $SP/cr.py`),
  squash-merge (`gh api -X PUT repos/kohz87/<repo>/pulls/<n>/merge -f merge_method=squash -f commit_title="… (#n)"`).
  Versions: take the next free patch number at merge time (main may have moved; bump again on rebase if needed).
- Behaviour-changing token cuts: measure before/after (token counts of the injected text, and a
  side-by-side of model-facing prompts); for quality-sensitive cuts compare outputs on the same inputs.

## Cache-friendly layout (Story Suite convention, all four extensions)
Providers cache the longest identical prompt PREFIX between requests (OpenAI/DeepSeek/Gemini
implicitly; Claude via cache breakpoints). So:
1. STATIC text (rules, formats, skeletons, grammar, capture instructions — anything that does not
   change from reply to reply) goes EARLY and must be BYTE-IDENTICAL every reply: register it with
   `setExtensionPrompt(key, text, extension_prompt_types.IN_PROMPT /*0*/, 0, false, SYSTEM)`; no
   per-reply values in it (no dice rolls, dates, clocks, names that change, counts, token figures),
   deterministic order (sorted, no Set/Map iteration order surprises), stable whitespace.
   Key: `story_suite_static_<ext>` (e.g. story_suite_static_story_block).
   Verify in SillyTavern's source ($SP/st/app/public/script.js getExtensionPrompt sorts keys
   alphabetically; check openai.js for where IN_PROMPT lands in chat completion) and say what you found.
2. DYNAMIC text (current states, the Director note, hand-offs, trade notes, reminders, dossiers)
   goes LATE: IN_CHAT depth 0 (after the last user message), role system, with keys that sort into
   this order: `story_suite_tail_1_story_block`, `story_suite_tail_2_story_director`,
   `story_suite_tail_3_rpg_battle`, `story_suite_tail_4_npc_state_delta`,
   `story_suite_tail_5_npc_state_delta_capture`. Empty them once their reply is in (no stale text).
3. Something only SOMETIMES needed must not move in and out of the static part (that breaks the
   prefix on those turns): keep it always in the static part if small and harmless, else put it in the tail.
4. Never rewrite the visible text of older messages; any stripping of blocks from history must be
   deterministic, so the history part of the prefix stays identical turn to turn.
5. Prove it: a unit test that builds your injections for two consecutive replies (with state
   changes in between) and asserts the static part is byte-identical; and in the live check, compare
   two consecutive logged mock requests (MOCK_LOG/req-N.json) and report how much of the prompt is an
   identical prefix (chars and %), before and after your change.
6. Keep a setting-free migration: old key names must be cleared (set to '') on load so a stale copy
   from an earlier version never lingers.

## Report
PR links, what changed in plain words, tests, live-check results (incl. the prefix %), anything you
decided differently and why, and what you did NOT do.

## Fix (later)
Inside `ev(...)` (browser code) use `window.__MOCK_URL` — demo-common.mjs sets it from MOCK_URL
before the page loads. `process.env` exists only in the Node side of a script.
