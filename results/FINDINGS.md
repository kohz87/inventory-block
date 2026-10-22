# Beta fuzz cell — findings (newest first)

Format: `[severity] repo: title — test path — owner area`

_Pass 1 started at heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79). No findings yet._

## Tick 01:50 re-check (heads SB d078cee incl. storage #108, RB 28a97d5, SD 9f59baf, NSD 1156fd7)
All 20 filed SB tests and the SD time test still fail; C2-1 stays fixed. The storage PR (#108) merged as 4a1cb31 — not yet
fuzzed (agents 1, 2, 4 were stopped). Unreviewed tests left by stopped agents (not filed, no write-up; see REPORT.md):
results/tests/Story_block/c1-wear-after-middle-delete.test.js (fails), results/tests/Story_block/c2-spoof-marker-reread.test.js
(fails), results/tests/Story_director/c1-time-after-middle-delete.test.js (fails), results/tests/rpg_battle/c1-effect-replies-after-delete.test.js (passes on RB 28a97d5 — not a finding).

## Pass 4 (heads SB 38687e1, RB ee927b0, SD b870546, NSD e56e356)
- [medium] Story_block: Equip on… pushes a member past their own carry limit with the piece it puts away (replaced bag piece changes owner unchecked) — results/tests/Story_block/c3-equipon-carry.test.js — SB-inv

## Pass 3 re-check (heads SB ff96802, RB ee927b0, SD a8d428f, NSD e56e356) — all 35 open SB cases and the SD time case still fail; C2-1 stays fixed

## Pass 2 (heads SB cb2d70e, RB 924b9a3, SD a8d428f, NSD 5243d79) — all open pass-1 tests re-checked: still fail except C2-1
- [low] Story_block: changing a module's def.features after register makes sdk.features()/feature()/features.set() and the settings Features list throw — results/tests/Story_block/c3-features-def-changed.test.js — SB-features

## Pass 1 (heads SB e0fd33b, RB 924b9a3, SD f001974, NSD 5243d79)
- [medium] Story_block: deleting an earlier swipe makes the next save fail verification falsely; store.flush() and sdk.rewind() throw — results/tests/Story_block/c1-swipe-delete-save-verify.test.js — SB-storage
- [medium] Story_block: after a middle delete, rewinding the head reply is refused though the chat replays fine (truncate replays strictly, not as replay) — results/tests/Story_block/c1-rewind-after-middle-delete.test.js — SB-storage (store/rewind)
- [low] Story_block: a change written onto a reply whose record is damaged works live but is lost on reload/cold rebuild — results/tests/Story_block/c1-damaged-spans-append.test.js — SB-storage
- [medium] Story_block: a save the server never answers blocks later saves, the reader's commands and the next generation forever (no write timeout) — results/tests/Story_block/c4-save-hang.test.js — SB-storage
- [medium] Story_block: an unsaved change is dropped untold when the same chat takes >10 s to re-read (persist.js marks saved after 50 waits) — results/tests/Story_block/c4-slow-reread.test.js — SB-storage
- [medium] Story_block: the #95 markUsed fix misses rescued saves; a rescued first change on a greeting-only chat is lost on card edit/rename — results/tests/Story_block/c4-rescue-pristine.test.js — SB-storage
- [low] Story_block: a save in flight across a rename lands under the old name (ghost chat; renamed chat lacks the change) — results/tests/Story_block/c4-rename-midsave.test.js — SB-storage
- [low] Story_block: rescue finds the changed message by its old index; after a delete it reports a saved change as lost — results/tests/Story_block/c4-rescue-shifted.test.js — SB-storage
- [high] ~~Story_director: fetch quests of story-minted items pay past the per-reply budget, many turn-ins per reply (300 coin at level 1 / 1380 with rank S)~~ FIXED in SD a8d428f (#91), test passes — results/tests/Story_director/c2-fetch-quest-story-items.test.js — SD-ranks (quests)
- [medium] Story_block: a <Changes> block split across a Continue loses the continuation's lines and leaves raw markup visible — results/tests/Story_block/c2-continue-split-block.test.js — main (SB capture/turn)
- [medium] Story_block: a reply cut off mid-reasoning applies the draft block inside the unclosed <think> — results/tests/Story_block/c2-cut-mid-reasoning.test.js — main (SB capture)
- [medium] Story_block: hiding a block writes reasoning-blanked text back into the message; a mid-line <Changes> mention hides the rest of the story — results/tests/Story_block/c2-hide-masked-body.test.js — main / SB-storage
- [medium] Story_block: Re-read while a kind's feature is off wipes that feature's changes on the reply (not restored on re-enable) — results/tests/Story_block/c3-features-reread-off.test.js — SB-features
- [medium] Story_block: preview, feature off, then commit still stores the command (commit checks only head fingerprint) — results/tests/Story_block/c3-features-commit-after-off.test.js — SB-features
- [medium] Story_block: whole-context feature with static in context.parts changes the static prompt but is marked prompt:false — results/tests/Story_block/c3-features-whole-context-static.test.js — SB-features
- [low] Story_block: "+ coin" reads other minus signs (‐ ‑ ‒ ⁻ ₋ ﹣ －) and fractions/superscripts as whole positive amounts (within budget) — results/tests/Story_block/c2-coin-amount-forms.test.js — SB-inv
- [low] Story_director: time maxJump is held per line, not per reply (150 × "! time +30d" = 4,500 days) — results/tests/Story_director/c2-time-jump-per-reply.test.js — SD-digest
- [low] Story_block: onBlocked hook still runs while its feature is off (turn.js:302 reads the raw definition) — results/tests/Story_block/c3-features-onblocked-off.test.js — SB-features
