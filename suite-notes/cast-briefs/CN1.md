# CN1 — NPC State Delta: dossier from the cast at the first meeting
Read C-COMMON.md first. Repo kohz87/npc_state_delta, branch `stage33/cast-dossier` from origin/stage32/key-people
(2aea5c3). Test ST port 8186. Agent CN2 works on secrets in parallel (branch stage33/secrets): keep out of secrets
code except handing the entry's `secrets` over in the shape CN2 documents (ask the lead if unclear; until then store
them with the existing normalizeSecrets shape plus an optional `when`).
1. When `director.cast` shows a met person with no dossier, create the dossier at once from `entry` (look → appearance,
   voice → speech, personality, history → background, meters/stages/fields, secrets handed to the secrets list),
   portrait from `packs.portrait`. Recorded in the npc slice on that reply (replay-safe; swipe undoes). Badge "Ersveil
   cast" and the "From the Ersveil cast · first met …" block (mockup C5: own path + last heard from `director.cast`).
2. Later scans never overwrite pack-given fields' first values silently: they add/change as today for any NPC.
3. Opaque panel: `.delta-panel` and the sticky jump-chip row get an opaque background (V2_LOG follow-ups).
Report: head SHA, counts, shots.
