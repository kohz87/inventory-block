# RB phase 0 draft v3 (b67639e): review (VM job 019, read-only)

Reviewer S (xhigh, 18 min): NOT READY, 8 blocking. Reviewer A produced nothing: headless agy needed a "command"
permission it cannot grant, so it was skipped (no permissions added). Full output: ~/story_suite/vm-results/019-sol.md.

Fixed: S1, A3, A4, A5, A6, A7, A10 (the existing-API corrections match the code; one SD thread store; the 24/12 graph,
exactly 3 skills and class swaps correct). Partly fixed: S2–S7, A1, A2, A8, A9 (open parts below).

## Blocking
1. SD writers for extracted quests: threads.offer / threads.accept contracts (payload, expected hash, result, issuer, errors, retry, atomic .rpg link) and the generic acceptance path without RB (SD quests/index.js:344; SB commands.js:227).
2. New seams with state but no writer/resolver: checks.policy.rbActors linking; region identity and place membership for danger policies; a canonical place-id query (atlas returns pack:<key> for unmaterialised places, SD atlas/world.js:125); npc.identity assignment and reverse lookup; generated item/rule registration and rules.flags writers.
3. Shapes can't decide every rule: frozen ItemDef values, race/talent tags, trainer events; storage for generated foes/quest templates; proof records for story objectives and rescues; whether narrative skill use pays its cost; requirement semantics; generated item/foe budgets (SB validate.js:243 accepts any stats/effects); pass area into foeToEngine.
4. Combat contract: mixed-target forms vs one-target combat.act (RB combat/index.js:143, combat.js:552); effect targets, stable skill/form identity, recorded action draws, regeneration, shield expiry, post-fight condition timing; daze missing (combat.js:213); the ending-minute anchor for the 10-minute post-fight expiry (party/pools.js:74).
5. Replay settlement: guard combat settlement on the surviving action prefix and outcome (combat/index.js:580); define Guard.inputHash and what replayGuard gets; action-draw persistence or suffix invalidation (combat.js:1013); tests for deleting a winning action, a paid use, a prerequisite; recovery, crafting time, consumables and save-forgetting in the table.
6. Death recovery records: an outbox / prepared manifest in DeathDomain, retained batch results and acks, prefix-map keys, a head-hash accessor; NSD has meters/stages only (storysuite-v2.js:75).
7. Track E gaps: rows for inventory.definitions, story.evidence, savepoint.contract, the equipment-plan seam, SB assist's checks migration (assist/classifier.js:140); carrier id mapping (8-char RecordId vs SB's 12-char suffixes, persist.js:53); dormancy in sdk.modules() discovery, since SD treats any combat.* command as a fight runner (sdk.js:372; SD module.js:194).
8. Policy: a wipe causes PC death directly (no lethal check); define "already stronger" for a class swap; keep today's healing maths (attack bonus/variance, combat.js:165, 616) per "keep the combat maths"; constrain xpPerLevel to the adapter's multiples of ten (rules.js:372).

Non-blocking: rules is not yet a registered pack kind (limits.js:27) — after track E; the fixture helper reports mastery 0 below 35 uses (draft:1482); stale /tmp links.
Independence: all RB-free combinations supported by design; RB's SD requirement needs the lifecycle (item 7). Tracks: can scaffold, not finish independently.
