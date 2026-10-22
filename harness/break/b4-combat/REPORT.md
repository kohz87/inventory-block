# B4 combat break report (saved by coordinator from the agent's hand-back)
Heads: Story_block e7e2b2e, rpg_battle 95f8c70, Story_director 555e517. 14 findings (2 high, 9 medium, 3 low); 19 failing tests in tests/rpg_battle (11 files + helpers.js → rpg_battle/tests/v2/break/) and tests/Story_director/b4-kill-quest-overpay.test.js.
- B-b4-1 HIGH consumables sold/dropped mid-fight still drunk on auto (combat/index.js:158-181 consumeSpent; setup.js fightItems snapshot). Fix: cap fight items to inventory before v1 act, or refuse sell/drop/give of stacks a running fight lists. Test b4-consumable-gone-midfight.
- B-b4-2 HIGH F80 single check can pick the better die (checks/commands.js:138-170 pickRoll). Fix: die by position of the check line in the reply; named other roll → note/mismatch. Test b4-checks-f80.
- B-b4-3 MED combat.act/flee/end ignore session id (combat/index.js:35,74-83,373; board widget.js:218 never sends it). Fix: require/compare payload.session (+ optional log length). Test b4-stale-session.
- B-b4-4 MED party.spend mid-fight lost from max HP at combat.end (party/commands.js:309, :528; v1 sheet.js:788-790). Fix: apply only cur clamped to own max, or refuse spend/learn/level-up mid-fight. Test b4-midfight-party-changes (B4-4).
- B-b4-5 MED non-Latin creature names collide on bestiary key 'creature' (combat/stored.js:82-85). Fix: \p{L}\p{N} slug or stable hash. Test b4-bestiary-nonlatin.
- B-b4-6 MED story ~ wound/heal mid-fight applied then undone by syncPools (party/capture.js:50). Fix: refuse in applyWound during fight (Problem). Test b4-midfight-party-changes (B4-6).
- B-b4-7 MED many `! use` lines in one reply play many fight turns (items/commands.js:198-222 fightUse). Fix: claim fightuse:<carrier>, one per reply. Test b4-story-use-plays-fight.
- B-b4-8 MED O(n²) per fight action (combat/view.js:15-19 rebuild; v1 combat.js:893,938-942 structuredClone). Fix: cache last rebuilt fight per session+action count; clone once in replay. Test b4-long-fight-cost (~60s).
- B-b4-9 MED character file stats below start pay for others (party/portable.js:118-128). Fix: refuse stat < startStat; sum only excess. Test b4-character-file-stats.
- B-b4-10 MED (SD) kill quest pays per unit for every kill beyond target (quests/index.js:229-234). Fix: units = min(have, target.count); optional difficulty→default rank. Test SD b4-kill-quest-overpay.
- B-b4-11 MED balance: "weak" not weak by headcount (story.js resolveThreats): 6 weak Giant Rats beat non-fighters 73–90%; 6 Cellar Rat Swarms beat all presets 30–85%; parity with v1 holds (avg 0.9 pt). Fix: headcount-aware tier budget; QA test across presets/seeds with floor. Test b4-balance.
- B-b4-12 LOW dead PC can rest to full (party/commands.js:394-420). Fix: skip dead in rest/heal/restore/fightPools. Test b4-dead-and-caps (B4-7).
- B-b4-13 LOW lowered level cap shows cap instead of real level (terms.js:104,132-146; screens/view.js:200). Test b4-dead-and-caps (B4-8).
- B-b4-14 LOW persona "(Ren)" → empty name blocks generation forever; "{{char}}" kept as name (creation/commands.js:184-190; party/util.js:81). Test b4-creation-persona.
Notes for others: continue's second <Changes> block not captured (b1/b2); party.grantXp + party.applyResult accept UI payloads (refuse like fightPools/import); F91 party.ranks not built (queued); cosmetic "a thousand wolves", "0 Wolf".
Held up: offer/start/end idempotence, odd encounter counts and names, F17 return incl. across checkpoint, F26 companions, swipe/delete of fight replies, determinism, XP caps, F80 basics, SD kill counting with real RB.
Sim data: harness/balance-sim.mjs, sim/balance-200.jsonl.
