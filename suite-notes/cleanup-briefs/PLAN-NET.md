# PLAN-NET (4 Nov) — the planner ignores "then" and "defend with" (USER play on 2.21.1)
Claude builder agent. Rules of CARD-COMMON.md apply (exact trailer, no model names, no merge/PR/force/tag, never weaken
tests, PID files with the REAL server PID, no playwright install, never use USER chats). If any command is denied,
stop that step and report it; never re-run it in another form. Run everything in the FOREGROUND (Bash timeout up to
600000 ms). Shared machine: --test-concurrency=2; b1r2-capture* are load flakes (re-run alone).
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/plan-net/Story_block, branch `stage68/plan-net` from origin/main eb43979 (2.21.1). Push it. No version bump;
CHANGELOG under "## Unreleased".

Case (USER, 2.21.1, a regenerated reply; battle log shows the 2.21.1 arrow): reader's message "…using obscure to hide
myself until the rats appear … before I use Shadow Cut first then follow up with Iaijutsu on the swarm while evading
with Shadow Steps …". Plan rolled: check Obscure ambush (good), act Astra skill Shadow Cut (area) with NO then:, foe
lines with NO skill. Mana emptied in round 1, rounds 2–3 plain attacks; both rat attacks plain defence. The planner
model ignored the 2.21.1 rules, which sit at the end of the head; the act shape line shows neither `then:` nor `else:`.

1. **Shape line:** add `| then: <skill>? | else: <skill>?` to the act shape line in both heads (Standard + Classic).
   Keep the rule lines but shorten if possible. Report head byte deltas.
2. **Code safety net (deterministic, after the planner answers, before the plan is recorded):** using only the
   reader's own message for this reply and the actor's own skill names (case-insensitive, whole words; also match a
   plural/possessive like "Shadow Steps"/"Shadow Step's"):
   - Follow-up: if an act has `skill: A`, no `then:`, and the message names A and later names another of that
     character's skills B with an order word between them (then, follow(ed|s|ing)? up with, after that, next, and
     then), set `then: B`. Never when B is A; never override a planner-given then:.
   - Defence: if the message names a skill S of character C in the same clause as an evade word (evade, evading,
     dodge, dodging, parry, parrying, block, blocking, defend, ward, sidestep, weave), every foe line targeting C with
     no skill gets `skill: S`. Never override a planner-given skill.
   - Record what the net added in the plan (e.g. `net: ['then','defend']`) so the receipt says why; the replay uses
     the recorded plan only (the net never runs on replay/Re-read). Rules mark stays 3.
   - Tests: the USER's exact sentence → then: Iaijutsu and Shadow Step on both foe lines; "I use Shadow Cut" alone →
     nothing added; "then I walk to Iaijutsu's teacher"-style false positive guarded by requiring a skill name the
     character has; a message naming a skill the character lacks → nothing; old recorded plans replay identically
     (oldroll harness from $S/then-fix/tools/oldroll.mjs, 0 diffs).
3. Practice: Shadow Step on a foe line is a rolled use and earns practice (verify, one test).
Full suite, npm run check, git diff --check, RPG-off prompt bytes identical. Real ST (8710/8711, own data copy, mock
model that answers WITHOUT then:/defence skill, i.e. reproduces the USER's case): battle log shows Shadow Cut round 1,
Iaijutsu after, Shadow Step on the rat attacks; screenshot at 390 px.
Report: head sha, byte deltas, tests with counts, oldroll result, shot path.
