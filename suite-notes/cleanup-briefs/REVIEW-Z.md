# REVIEW-Z — release review: Story Block 2.16.4 + Story Director 2.9.2

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, PID files, never `pkill -f`/
`pgrep -f`, never `playwright install`, never merge/PR/force/tag, never touch rpg_battle). If any command is denied,
stop that step and report it; never re-run it in another form. Do not delete anything outside your own new folder
$S/rv-z/ (no `rm -rf` on copied data: build your ST data folder fresh by copying only what you need into an empty
folder).

Under review (do not push code; report findings):
- Story_block `stage40/release` d6abe37 vs main ceeb2a1 = BD stage40/legacy-envelope (cleanup-briefs/BD.md), BY
  stage40/you-first (BY.md), BH1 stage41/bug-hunt (BH.md), BZ stage40/prompt-clarity (BZ.md). Full suite 4516/4505/0.
- Story_director `stage42/release` c1639bc vs main 0c11523 = huge-year hang fix + time grammar example.

## Part 1 — diff read
Correctness bugs only, against the blocker bar (an ordinary-use path that loses/corrupts saved data, crashes/wedges,
gives wrong results or leaks a hidden value). Look hard at: replay equality (live == rebuild == reload == swipe ==
Re-read) for v1-envelope replies; the battle-log MutationObserver (loops, leaks after chat switch/disable); the safety
net's place/time refusal (false refusals of real places, e.g. names with a word of their own, aliases, "A / B" names);
dm kind fill (wrong kind picked); starting-purse `told`/`starting` receipt data on swipe/Re-read; the three BH1 race
fixes; SD parse refusing real dates.

## Part 2 — real-ST smoke (UI-COMMON "Browser check", own fresh port, own PID file, never open secrets.json)
Extensions: SB stage40/release, SD stage42/release, NSD main 81b6a21; a scripted mock model. Scenarios:
1. Greeting carries an empty `<!-- STORY_BLOCKS_V1 -->`: never in any request.
2. A reply with only a v1 envelope (use $S/bd/reply2.txt): applied once + one old-format Problems line; Re-read same.
3. A `[battle]` reply with an NSD block: panel drawn on first render, no raw marker.
4. New chat, empty look: tail note present; after `~ you wearing: … | condition: …` it is gone.
5. Character import with a starting purse, then a reply paying coin: wallet adds up, no double count.
6. Safety net answer with `~ place Bluewatch Guild Branch` and `~ time midday`: two REFUSED Problems lines, not applied;
   a known place + clock time applies.
7. Idle 60 s: no timers/events/mutations; 10× chat switch: no listener growth.
Shots desktop 1440×900 + phone 390×844 into $S/rv-z/shots/. Stop ST and the mock at the end (PID files).

Report: per finding — where, repro, severity (blocker / follow-up); per scenario pass/fail; short.
