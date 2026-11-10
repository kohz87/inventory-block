# XS — fights run until something happens; XP for a won fight (USER 3 Nov: "yes, do both and put it to main")

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, clone into $S/xs/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never deleted,
never weaken/skip/delete a test — a pinned assertion or fixture changed on purpose is named in the report, a test per
change run after it, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only, never
`pkill -f`/`pgrep -f`, never `playwright install`). If any command is denied, stop that step and report it; never
re-run it in another form. No real-ST check (the lead runs it). No new UI (receipt text and log lines only).
Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main 83e70c9 (2.16.8). Branch `stage49/fight-flow`.
Code: src/v2/lean-rpg/resolve.js (rounds, `stop`, PACE, LIMITS.roundCap, decisive), names.js, the difficulty presets
and Custom "Most exchanges per reply", templates.js (Combat rules XP guide), docs/v2/RPG.md.

## 1. When a reply's exchanges stop (USER's rule)
Today rounds stop at the first decisive result (nat 1/20 or margin ≥ decisiveMargin), at the pace (careful 1, normal 5,
all 8), at roundCap (default 5) or the cue budget. New: keep rolling exchanges until the first of:
- **won**: every filled foe group is Down; **lost**: every party member who is not Left is Down;
- **heavy**: a party member has lost 2 or more Health blocks in this reply so far (Standard formula), or 2 or more
  Health stages (Classic), or went Down;
- **cap**: the reader's Most exchanges per reply; **budget**: the cue no longer fits (as today);
- **careful** pace still rolls 1 exchange.
A decisive result is still labelled Decisive in the log and still has its effect, but no longer stops the reply.
Default Most exchanges per reply: 8 (was 5) for every preset; Custom keeps its 1–8 range. This needs the rounds to
track the sheet round by round (health blocks/stages, Down), applying each round's outcomes as resolve already does
for its result; foes or party members who are Down stop acting in later rounds (the "beaten before its turn" note).
**Past rolls never change**: the stop rule and cap are part of the roll's recorded rules/version; a roll made before
this replays exactly as it did (bump the result/dice version as the code already does for such changes; old records
read with the old rule). `stop` gains 'won' | 'lost' | 'heavy'.

## 2. XP for a won fight, given by code
- When a reply's state goes from "at least one filled foe group not Down" to "every filled foe group Down" (by dice
  or by the narrator's own foe lines), code gives XP once for that fight to every party member who is not Left
  (Down members too). Amount: the sum over the fight's foe groups of count × class × 2, at least 5, at most 60
  (six Class I crawlers → 12). Constants in names.js. Receipt line under Changed this reply:
  "Astra +12 XP (fight won)". Level-ups follow the existing rise rules.
- **No double count**: in that reply, narrator `xp` lines for party members are not used, with one Problems line
  ("XP for the fight is given by code; the narrator's XP line was not used.") — find how XP lines are written today
  (a dm/Character set) and hold exactly those. XP lines in other replies are untouched (quests, discoveries).
- The narrator is told in that reply's cue/tail that fight XP is given by code. Update the Combat rules XP guide text
  for new chats: fights give XP automatically; the narrator gives XP only for other deeds. Existing chats' stored
  Combat rules text is not rewritten.
- Replay: swipe, Re-read, middle delete, rebuild == live == reload; a fight is rewarded once (a later reply that
  re-fills and wins a new fight is a new fight).

## Tests
- Standard and Classic: rolls continue past a decisive hit on a foe; stop on won/lost/heavy/cap/budget/careful.
- The USER's case: crawlers ×4 Hurt vs Astra: no stop on "Decisive block"; fight runs to won within 8 unless heavy.
- Old roll records replay byte-identical (existing fixtures unchanged, or each change named with the reason).
- XP: won by dice; won by narrator foe lines; party member Left gets none; narrator xp line in the won reply refused
  with the Problems line; in another reply allowed; level-up at 100; replay equality.

## Report
Branch + head; what changed; tests added; pinned assertions/fixtures changed on purpose; counts; open questions. Short.
