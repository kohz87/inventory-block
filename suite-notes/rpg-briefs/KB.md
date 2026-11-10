# KB — NPC State Delta: Key people in the dossier (approved mockup, 1 Nov)

Hard rules: as KA.md. Repo kohz87/npc_state_delta, branch `stage32/key-people` from origin/main (8a60181, 1.4.0).
Test ST port 8182 with Story Block main and Story Director from origin/stage32/key-people when it exists (agent KA
builds it in parallel; until then code against the query below and test with a stub).

Contract (owned by Story Director, read-only for you): query `director.keyPeople` → [{ name, aliases?, here, away:
{ doing, since, back, steps: [{ date, text }] } | null, removed?: { reason, on } }]. Never write to Story Director.
Without Story Director, or with an older one that lacks the query: nothing changes anywhere (NSD alone has no key people).

1. Dossier: a "★ Key person" badge on pinned people; a "While away" section (dates, the steps) while away and after a
   return until the next time they are present for a few replies (mockup step 2). The dossier library list marks them.
2. Present-NPC cards (World → People here and NSD's own cards): a small "★ Key" tag.
3. On return (away → here), the narrator gets the "While away" summary once with that NPC's dossier injection (short,
   within NSD's existing budget). Meters do not change by themselves while away (drift stays as the reader set it).
4. While a key person is away, their configured custom fields and stable profile fields are not changed by scans
   (as if locked); scans resume when they are present. Tests.
5. Tests for each item; NSD's own checks.
