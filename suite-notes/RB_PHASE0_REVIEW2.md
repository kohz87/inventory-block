# RB phase 0 draft v2 (c2ebc56): two independent reviews (VM job 016, read-only)

Both NOT READY. Full outputs on the VM: ~/story_suite/vm-results/016-sol.md and 016-argon.md. Summary below; the
claims are the reviewers' and are checked against the code when v3 is written.

## Reviewer S (xhigh, ~17 min)
1. Save policy shown as decided beyond the log: "start of the day" and "latest target wins" are not the user's words → ask (P13).
2. Dependency gate partly fixed: no preflight signature/result; SB initialises missing domains on registration (sdk.js:300); a canGenerate refusal blocks all generation (turn.js:379) → define the preflight API and a dormant/ready/restore-pending lifecycle.
3. Checks not independent of RB: actor lookup needs party.actor/pc (RB checks/commands.js:106); modifiers include skill/talent/item bonuses (checks/modifiers.js:5); rules.modifier({actor,stat}) can't express them. New APIs not fully specified (threads.link/close, checks.roll, summon.end, restore prep, replay hooks).
4. State shapes miss rule inputs: item fields, wear/refine, carry limits and encumbrance output (RB carry.js:19); actor role/portrait/background/origin, offers, growth; quest/world evidence; temporary-unit init, lethal batch identity, modifier decomposition, reply-condition boundaries.
5. Replay: quest:<instance>:settled collides; capped-to-zero uses leave no record; combat credit timing ambiguous (RB combat/index.js:599); guards in receipt data that SB trims (persist.js:268); swipe indices shift (persist.js:6); replay applies ops without handlers (store.js:344); re-read replans one carrier but replays later ones (store.js:786, 831).
6. Death return: no API produces prepared:Id; registration/checkpoint/prepare/activate/abort/recovery lack contracts; no RB→NSD confirmed-death interface (NSD storysuite-v2.js:73 has meter/stage ops only).
7. Pack: graph exact; need v2 foe/loot/form adapters (RB templates.js:665, 638); checker scope for existing kinds; "branches may change type" vs a transform union with no set-type.
Non-blocking: v1's B1, B2, B5 fixed; appendix qualifications (item.use variants, party.recover nested calls, ctx.query/ctx.absolute targets); the 1,000-form ceiling < 1,092 needed. Independence: intended, not guaranteed. Tracks can scaffold, not implement.

## Reviewer A (high, ~12 min)
1. IDs: SB's checkOps/isId (check.js:6-16: RECORD_ID /^[a-z][a-z0-9]*_[0-9a-z]{8}$/ or DEF_ID) and OWNER_RE (domains/common.js:4, /^(?:party|ac_[0-9a-z]{8})$/) reject the draft's free-form ids ("s10", "q_job-1", ...) → use SB's formats.
2. Replay on SB's real store: receipt data trimmed after RECEIPT_KEEP=200 (persist.js:261-282); replay() never reads receipts (store.js:320-338) and claims merge per carrier (store.js:331); chain() can jump a deleted reply between checkpoints (store.js:289-314, 495-503); replaceStory runs kept UI ops with replayed=false (store.js:801); counters without ctx.absolute replay as deltas (commands.js:391-401, ops.js:439-443: a full heal becomes -30); receipt.replan is {afterCapture, payload, line} (turn.js:720). Fix: guard + claims per op block in span.ops, keep data.v2 in trimming, chain() stops at the first failed covers, replayed=true in replaceStory, ctx.absolute on every reset.
3. "Existing" APIs don't match the code: packs.get {id}; packs.content {kind,pack?,tag?} + packs.entry; inventory.items/encumbrance shapes; party pools are {cur,max}; party.grantXp EXISTS ({quest?,difficulty?,amount?,who?}, used by SD quest.finish); checks.pending/last; combat.session / combat.foesBeaten({sinceRev}) (SD fightsSince depends on it); trade/craft signatures; director.advance refuses cause 'ui' and caps 1440 min (SD time/advance.js:55, 77); SD/NSD query argument names.
4. New APIs contradict each other: party.advanceConditionTicks vs party.tickConditions vs existing effects.tick; return.save/load vs existing return.checkpoint/clear/back + sdk.rewindTo; capture.training has no command entry.
5. Two quest authorities: a new QuestsDomain vs SD's existing director.threads (kind 'quest', domains {}) → keep one.
6. return.load snapshot misses director, quests, training, combat, gear, npc; and RB can't draft other modules' domains (commands.js:264-267 FORBIDDEN) → snapshot all registered domains via an SB host primitive, ctx.absolute on counters.
7. Per-form mastery missing, so the "revisit a form" rule is impossible → formMastery.
8. Missing fields: gear inputs, encumbrance, skill target/cooldown/summon, CombatDomain schema, step-2 generated power from a branch parent (round(1.3*1.15)=1), xpPerLevel, quest requirements/flags, Condition.power meaning.
9. Pack v2 vs SB's validator: name required on every kind (validate.js:223), id rebuilt from name, branch ids contradict their own rule, pack id regex (limits.js:29), foe/quest defs reject existing creature/quest fields; the example branches a starter skill (branching is advanced only).
10. Six unmarked proposals (Pool.lost, QuestsDomain, grantXp payload, mastery thresholds, revisit cost, wave recovery) → P16–P21.
Non-blocking: line-number errors, bestiary undefined, fixture omissions. Independence: SB alone yes; SB+SD guarded today; RB's SD requirement not enforced by SB (registry.js:239-245) → needs peer checking. Tracks: not yet.

## Lead's first read (to verify when writing v3)
- The two overlap on replay, restore and pack fit, and are complementary elsewhere: S on faithfulness, lifecycle and the checks coupling; A on exact code signatures, id formats, replay arithmetic, quest authority and snapshot coverage.
- Many fixes are changes to SB itself (replay guards in spans, receipt retention, a host snapshot/restore primitive, peer `requires` checks, id formats). Proposal: a fifth track E "SB host changes", first in the merge order.
