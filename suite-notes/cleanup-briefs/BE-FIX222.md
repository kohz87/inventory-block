# BE-FIX222 (4 Nov) — fixes from rv222-blockedit ($S/rv222-blockedit/REVIEW.md, read it first; its probes are in
$S/rv222-blockedit/probes/keep/)
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, PID files, no playwright install, never use USER chats). If any command is denied, stop
that step and report it; never re-run it in another form. Shared machine: --test-concurrency=2, timing flakes alone.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/be-fix222/Story_block; commit on `stage66/blockedit` (7c98e3d) and push. No version bumps.
Fix, one test each (use the review's repro as the test):
- B1 `at: n` resolves against the list as it stood before the reply (original index per list in perReply); an entry
  already dropped this reply is refused with a Problems line; two drops by number in one reply work ([A,B,C,D] drop 1
  + drop 2 → [C,D]).
- B2 changeBlock carries a list over part by part (new parts default, removed parts dropped); lowering Most entries
  below the current count refuses Save with one plain sentence. Never empties a list.
- B3 one titlePart() helper used by entryKinds, the interpreter and entriesText.
- B4 `at:` strips one pair of surrounding straight or curly quotes.
- B5 the list tail: open entries first, never cut inside an entry, ends "+N more"; a block with a list gets more tail
  room (report the byte/token cost; RPG-off/no-list prompt bytes unchanged). Check the Ersveil Quest log line reaches
  the prompt under the global budget, or report why not.
- B6 make the DATA_MODULES.md fragment not a ```json block (jsonc) or complete JSON; check.test.js green.
- F1 deleting an earlier reply recomputes later list lines the way plain fields do (no Re-read needed): add A,B,C,D
  in 4 replies, delete B's → [A,C,D].
- F3 the editor refuses a list definition that cannot fit the instance storage limit (parts × max chars × max
  entries), with one plain sentence; the Quest log starter's max fits (lower it if needed).
- F4 a duplicate title on add is refused (Problems line); `at:` also accepts `#2` and `2.`.
- F8 don't write `layout` when it is the default (an old block re-saved keeps its bytes).
Full suite at the end, npm run check, git diff --check. Real ST (8670/8671, own data copy, mock model): Quest log
starter, add 3 / drop 2 by number in one reply / drop by quoted title; shot at 390 px.
Report: head sha, each item done, tests with counts, tail byte deltas.
