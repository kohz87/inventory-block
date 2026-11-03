# FS — a fight can start and be rolled in the same reply (USER 3 Nov: "yes, go ahead and put it to main")

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, clone into $S/fs/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never deleted,
never weaken/skip/delete a test — a pinned assertion or fixture changed on purpose is named in the report, a test per
change run after it, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only, never
`pkill -f`/`pgrep -f`, never `playwright install`). If any command is denied, stop that step and report it; never
re-run it in another form. No real-ST check (the lead runs it). No UI change. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main 75e6332 (2.16.6). Branch `stage47/open-fight`.

## The bug (USER's East Weir reply)
The dice pre-call (src/v2/lean-rpg/precall.js) runs before the reply and may only target foes already filled in the
Foes block. The reader walked into a fight against crawlers not yet on the sheet → "Foes: none" → no plan, no dice,
no battle log; the narrator then wrote `+ dm foes … set-slot-1` itself AND decided the ambush with no roll (4 of 6
slain). Engaging and fighting cannot happen in one reply today.

## The change
1. **The pre-call may open a fight.** Both heads (PRECALL_HEAD Classic and PRECALL_HEAD_STANDARD) gain one line and one
   rule: `foe <name> | new | count: <1-12> | class: <I-V>?` — "When the reader starts a fight against foes not listed,
   list them as new (only foes the reader's message or the scene names; never invent), then plan the fight as usual."
2. **Code checks and adds them before rolling.** A `new` foe is accepted only when every word of its name… or at least
   one distinctive word of it (not "the", "a", plural -s ignored) appears in the reader's latest message or the shown
   text of the reply before (whole word, case-insensitive). Count held to 1..12. Class held to at most the party's
   highest Soul Class + 1 and at least I; missing → I. Then it fills a free foe slot through the same command path the
   Foes block already uses (no new storage shape), stored as a `beforeGenerate` step on the reply, so swipe re-plans,
   Re-read keeps it, delete takes it back, rebuild == live == reload. Then `act`/`foe` lines may target it and the dice
   roll as for any fight (ambush edge allowed). A refused `new` line: no slot, and the rest of the plan is judged as
   today (a plan naming nobody on the sheet = failed plan → the narrator keeps it undecided).
3. **The narrator's own slot line for the same foes does not double them.** If the reply also writes
   `+ dm foes … set-slot-N | name: <same name>`, the result is one group (decide how: same name → that slot is updated,
   not a second slot); test it.
4. **Fallback rule for the narrator.** When the Foes block has no filled foe and there are no rolls for this reply,
   the narrator's tail (or the RPG's combat rules text, whichever is the existing place for per-reply fight cues — find
   NO_ROLLS_LINE) tells it: if a fight starts now, set the Foes line and stop at the first clash; the dice decide from
   the next reply. Byte-identical prompts for a chat with the RPG off, and for a chat with foes already filled.
5. Docs: docs/v2/RPG.md (the planning step and Foes) and SPEC_RPG if it describes the pre-call grammar.

## Tests
- Pre-call answers `foe Mud-Scale Crawlers | new | count: 6 | class: I` + `act Astra | skill: Shadow Cut | target:
  Mud-Scale Crawlers | edge: +2 ambush` with an empty Foes block and a reader message naming crawlers → slot filled,
  dice rolled, battle record present, `[battle]` panel model present; summary/receipts as for an ordinary fight.
- An invented foe (name not in the message or scene) is refused; class above the cap is held; count held.
- Swipe/regenerate re-plans; Re-read same dice; middle delete; rebuild == live == reload.
- Narrator writes its own set-slot for the same name → one group.
- RPG off and existing-fight prompts byte-identical (off-flow fixtures unchanged, or name each change and why).

## Report
Branch + head; what changed; tests added; pinned assertions/fixtures changed on purpose; counts; open questions. Short.
