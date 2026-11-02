# BH — bug hunt: loops and bugs (USER 2 Nov: "Find possible loops or bugs and fix them too")

Rules: cleanup-briefs/X-COMMON.md hard rules apply in full (secrets, user data, exact trailer, clone into $S/<letter>/,
push only your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never
deleted, never weaken/skip/delete a test, `npm run check` + full `npm test` + `git diff --check` green before push, PID
files only, never `pkill -f`/`pgrep -f`, never `playwright install`). If any command is denied, stop that step and
report it; never re-run it in another form. No UI change (no new buttons, panels or layouts).

Bases (origin/main): Story_block ceeb2a1 (2.16.3), Story_director 0c11523 (2.9.1), npc_state_delta 81b6a21 (1.7.2),
Story_studio 99c742d (0.6.0). Branch name in every repo: `stage41/bug-hunt`. SB's 2.16.4 work is happening on
stage40/legacy-envelope and stage40/prompt-clarity — do not touch envelope/legacy parsing, the scene tail note, the
Wallet/time prompt lines or the Assist safety net (those are in flight); note anything there instead.

## What to hunt (in this order)
1. **Loops**: anything that can run forever or repeat without the user acting —
   event feedback (a listener that triggers the event it listens to: CHAT_CHANGED, MESSAGE_*, settings saved,
   MutationObserver/ResizeObserver re-render feeding itself), retry/recover loops with no cap or backoff (coordinator
   recover, NSD hydrate/publish retry, portrait backfill, journal replay), timers/intervals never cleared on chat switch
   or disable, recursion without a base case, `while` loops over user data that can stall, re-render storms
   (render → save → render), double-registered listeners after re-init/hot reload.
2. **Wedges and crashes** on ordinary paths: unhandled rejection that leaves a busy flag set, a barrier/lock that is
   never released on an error path, a throw that stops later listeners, null state after delete/swipe/branch/rename.
3. **Data loss or wrong results**: stale closure over an old chat id writing into the new chat, races across chat
   switch, writes after disable, off-by-one in replay, numbers going negative where they must not.

Method: read the code paths above (grep for addEventListener/eventSource.on/setInterval/setTimeout/
MutationObserver/while/retry/recover/backoff), then **prove each suspect** with a failing test (or a real-ST repro
when a test can't reach it) before fixing. Only fix what you proved. Keep each fix minimal. One test per fix, run after
the fix. Things you suspect but can't prove: list them, don't change code.

## Split
- Agent BH1: Story_block only (clone $S/bh1/).
- Agent BH2: Story_director, npc_state_delta, Story_studio (clones $S/bh2/<repo>/). NSD full suite needs Node 24:
  `npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js tests/v2/break/*.test.js`;
  also compat + smoke (`node --import ./tests/active-runtime-test-setup.mjs tests/compatibility-check.js` and
  `… tests/runtime-smoke.mjs`).

## Real-ST check (BH1 required; BH2 if it changed runtime code)
UI-COMMON "Browser check" (own st-data copy, own fresh port, own PID file, never open secrets.json), all four
extensions at the bases above (yours swapped in). Soak: open a chat, switch chats 10× fast, delete a middle message,
swipe, Re-read, disable/enable the extension, reload; watch the console and a CPU/timer count (e.g. count
setTimeout/setInterval calls and event-handler runs over 60 s idle — idle must be quiet). Report the idle numbers
before and after.

## Report
Branch + head per repo; per finding: where, how proved (test name or repro), fix; suspects not proved; idle soak
numbers; test counts (tests/pass/fail). Short.
