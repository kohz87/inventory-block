# SP — "meter OR story event" on one secret (USER approved 1 Nov)
Hard rules: suite-notes/ui-briefs/UI-COMMON.md (exact trailer, push only your branches, never merge/PR/force/tag, a
test per change run after it, check + full test + diff --check, no version bump/CHANGELOG — the lead bumps).
Today Story Block's cast validator allows one rule per secret (`meter`+`at` OR `when`; a test pins "never both"), while
NPC State Delta supports a note that opens at a meter value OR on a story event, whichever comes first.
1. Story Block (kohz87/Story_block, branch `stage35/secret-either` from origin/main d6c63c6): `content.cast[].secrets[]`
   may carry `meter`+`at` AND `when` together, meaning "opens at the meter value, or on the story event, whichever comes
   first". Still: at least one rule; `when` ≤ 120; plain text. Update the validator, its messages, the "never both" test
   (now: both allowed; neither refused), docs/v2/PACKS.md "The cast" and the authoring kit PACK-FORMAT / LIMITS.
2. NPC State Delta (kohz87/npc_state_delta, branch `stage35/secret-either` from origin/main ed0ebc8): make sure a pack
   secret with both rules arrives with both through src/cast-dossier.js `castSecrets`, survives normalizeSecrets, opens
   on either (meter crossing OR scan event), shows correctly while hidden (pick ONE wording: "Opens at Trust 90 or with
   the story"), round-trips through the editor line syntax ("trust 90 or when … =>"), and is injected like any locked
   note. Add tests with a both-rules pack secret. If nothing needs changing, prove it with the tests and say so.
3. Re-vendor: NSD testkit from your SB branch for the tests (note the SB commit); the lead re-vendors from the release.
Report: both heads, counts, what changed.
