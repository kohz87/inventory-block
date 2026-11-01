# Review K (1 Nov): Key people. SD stage32/key-people 47c6a0d + NSD stage32/key-people 2aea5c3 on Story Block main 2.14.0 0b23c3f

Verdict: BLOCK (two narrow wrong-result paths; everything else holds). Reviewer: Claude agent. No commits, no pushes, rpg_battle untouched.

## Blockers

B1. Swipe of the first reply after a return does not repeat the return note (design: "swipe repeats, next reply drops").
 Real ST (port 8183, SB 2.14.0 + SD 47c6a0d + NSD 2aea5c3, own data copy), Fenna (dossier, pinned) :
 1. `+ away Fenna — fetching ferry parts | back: in 5 days`, then a reply `! time +5d`.
 2. Reply A: `- away Fenna` (return noticed, keyAway.fenna.returnedAt = A).
 3. Reply B (send "Thanks."): its prompt carries "WHILE AWAY, NOW BACK (...)" in Fenna's block. OK.
 4. Swipe B (swipe-right arrow on the last message): the swipe's prompt has NO return note. Reply C also none (correct).
 Cause: npc_state_delta index.js `keyReturnNotes` compares `keyView(..., head)` with `head = latestReplyIndex()`, the last non-user message in ST's chat.
 During a swipe generation that is B itself (A+2), not A, so `head === returnedAt` is false. The testkit's swipe hides the swiped
 message, so the unit test (tests/key-people.test.js "a swipe does not count twice") passes. Fix idea: while a swipe/regenerate-of-latest
 is running use the index of the reply before the swiped one (NSD already knows when it is in a swipe generation), and add a
 real-ST or fake-ST test whose chat still contains the swiped message.
 Impact: the swiped alternative is written without the summary of what the returned person did; dossier "While away" is unaffected.

B2. Archiving (or a confirmed death archiving) the ONLY dossier does not unpin the key person.
 SD nsd.js: an empty `npc.known` is read as "Delta off / not loaded: say nothing", but with one dossier left `npc.known` is [] after it is archived.
 Repro (real ST): Ersveil test chat has one dossier (Fenna). Pin Fenna in World -> Key people -> + Pin (nsd flag set on the next reply);
 `NPCStateDelta.archive('npc_fenna')`; send a reply: pins unchanged (Fenna stays pinned, no note). Same with a 1-person fake Delta in
 the SD testkit (people = { Ren: {} }; delete people.Ren; send). With any second dossier present it works (Ren/Odda removed with
 reason "archived", verified in real ST and testkit). NSD archives a confirmed death (archiveReason 'deceased'), so a dead sole key person stays pinned
 and, if away, is still told to the narrator as away until the reader unpins.
 Fix idea: for a pin with `nsd: true`, treat empty `npc.known` as "archived" only if Delta is demonstrably loaded (ask `npc.dossier` / a
 loaded flag), or have Delta answer an explicit "loaded" marker.

## Follow-ups, ranked
1. (KA known) The removal by NPC State Delta is written on the PREVIOUS reply (the sync step rides the latest reply before the new one), so the line
   "Odda is no longer a key person" shows on the old card's closed line, not on the reply that follows. Confirmed in real ST (card of mesid 40, new reply 42 has none).
2. Static prompt grows by 563 characters (about 141 tokens) in every chat with the feature on (default), including Lean and chats with nobody pinned
   (new kind + grammar lines). Tail and everything else byte-identical. Consider adding the paragraph only once someone is pinned (needs a stable rule) or say so in the feature text.
3. Death in NSD is told as "archived in NPC State Delta" (confirmed death archives the dossier), not "died".
4. (KA known) Closed status line ends with a dangling " ·" when clock and place are unknown (confirmed by rendering the template with an empty summary: "Zed is no longer a key person · ").
5. Unrelated change: world/screen.js `.wv-facts { padding-left: 0 !important }` lost its `!important` (commit 3e53755); `.wv-body ul { padding-left:1.2em }` now wins, so Journal day facts are indented 18px (measured 18px vs 0 on main).
6. NSD docs say the scan hold is for the automatic scan only; code also holds the manual "Scan now" (scanNowInner has no `manual` gate). Dossier Refresh/backfill are not held (correct).
7. A dossier renamed in NSD (alias not kept) reads as "archived" and unpins a pin that had `nsd: true`.
8. Wording and look: "away Goldwane 17 - Goldwane 17" for a same-day absence; "2 OF 1" when the cap is set below the number pinned; "You can have 1 key people"; phone Unpin row leaves a gap above the second line.
9. NSD's dossier panel bleeds the Game view through on phone (known, pre-existing, not this branch).
10. Platform note, not this branch: Pin/Unpin ride the latest reply, so swiping that reply undoes them (SB's own edit hint says so).
    Also saw pins lost once when the browser was closed 1.2 s after a command (6 s wait: kept across reload). Not reproduced as a bug in key people code; likely the chat save debounce.

## Checks (what passed)
- `npm run check`: SD ok, NSD ok. `git diff --check origin/main`: clean in both.
- SD `npm test`: 1028 tests, 1026 pass, 0 fail, 2 skip. NSD `npm test`: 1535 tests, 1530 pass, 0 fail, 5 cancelled (the barrier tests; origin/main run:
  1520 tests, 1515 pass, 0 fail, same 5 cancelled, so pre-existing). Because `&&` stops at the cancelled, compat and smoke by hand:
  tests/compatibility-check.js passed, tests/runtime-smoke.mjs passed.
- Byte identity: SD feature off: all 27 prompts of a scripted chat identical to main. SD on, nobody pinned: tails and every non-static prompt identical,
  static +3 lines only. NSD alone (no SD): npc slice, 27 prompts, npc.cast, npc.known and buildInjection (with and without the new option) identical to main
  (only random swipe ids differ).
- SD (testkit and real ST): pin/unpin; cap 10 default, 2, 0, 100 (500 clamps to 100, -3 gives 10), cap lowered under count (Pin disabled/refused with the sentence); budget 300, 40 (cuts, "3 more are away than fit"), 0 (nothing told), 5000 and 1e12 (all told,
  no error), setting 100000 in the UI; `+`/`~`/`!`/`-` away; `- key Name | died`; `- key Name` without death refused; only pinned may be away; away text with newlines cannot forge a tail line;
  order = soonest return, then latest step, no date last; passed date reads "due back (June 9)"; Lean keeps the feature (real ST, Lean selected).
- Removal: never-had-dossier pin is never unpinned (other dossiers known); known then archived: unpinned "archived" (testkit + real ST, away record and keyAway dropped, tail empty for that reply);
  `lifeState: deceased` reads "died" (testkit). SD never writes to NSD (grep: only queries npc.known, npc.dossier, npc.present, StorySuite api read calls).
- NSD in real ST: "★ Key person" badge (hero + document head), "While away" with dates and steps and the held-fields note, after return "They are back..." until 3 present replies, library row ★, present card "★ Key",
  scan hold (a scan while Fenna was away left personality empty; she kept her fields), return note once in the first generation after the return (<=360 chars), next reply none,
  `npc.keyAway` memory survives page reload, only people who have been away appear in it.
- Replay across both (testkit, real SD + real NSD adapter, 10 scenarios: pin, away, step, return, death, unpin, swipe of the return reply, swipe back, Re-read, middle delete): rebuild == live == reload for keypeople and the npc slice, validators clean.
  Real ST: reload after return, swipe to "still away", swipe back, `/del 2`: all identical to live.
- Real ST screens (desktop 1440x900 and phone 390x844): World -> Key people (rows, Away/back date, last news, chooser, token note, 44px tap targets), This reply card with back + died lines, Settings -> Modules -> Story Director -> Key people. Console errors: none from these features
  (one backfill error came from my own scripted model answering a backfill with narration).
- Mock model for this run: port 5183 (rv-k/mockllm.mjs); test ST port 8183; shots in shots/.

Files: scripts in $S/rv-k/rv/, shots in $S/rv-k/shots/, logs sd-test.log nsd-test.log nsd-base-test.log.
