# The living cast (1 Nov, USER approved mockup) — shared rules and contract for CS, CD, CN1, CN2

Hard rules: suite-notes/ui-briefs/UI-COMMON.md (secrets, user data, PID files, no playwright install, no rpg_battle,
exact trailer, no version bump/CHANGELOG, push only your branch, never merge/PR/force/tag, a test per change run after
it, `npm run check` + full `npm test` + `git diff --check` green, browser shots desktop 1440×900 + phone 390×844).
Approved mockup: https://claude.ai/artifact/5vg7j6CL5zchoC2Rc5tuJE (script vm-results/u7/mock.mjs; read it — texts and
layout come from it). Decisions: V2_LOG 1 Nov entries from "Encounters redesign" to "Mockup v8" (read them all).

## What it is
A pack lists a hand-written cast. Each person starts somewhere with a goal and a routine and lives off-screen; the
party meets them by place + routine (first time at their place while their routine has them there) or because their
goal (`drawnTo`) pulls them to the party (they come looking). No dice, no backdrops; nameless people stay generative
(the narrator invents them; NSD keeps a dossier if they matter). Unmet cast is hidden from the reader and never in the
narrator's text. At the first meeting NSD makes the dossier at once from the pack entry (portrait included).

## Contract (each side builds only its own part; others READ)
1. **Story Block (CS)**: new pack content kind `cast` → `packs.content({ kind: 'cast' })` returns the enabled packs'
   entries, each with `pack` (id) and `packVersion`. Entry (validated; plain text, limits in limits.js):
   `{ id (slug, unique in the pack), name, aliases?[], about, look, voice?, personality?, history?, portrait? (file
   name), start: { place, goal, routine? }, drawnTo?[] (short phrases), meters?: { preset?, <meter>: n }, stages?[],
   fields?{}, secrets?: [{ title, text, meter + at | when }] (≤ 8), canDieUnmet?: bool }`.
   Portraits: image files beside the pack (webp/png/jpeg, ≤ 64 KB each after compression, ≤ 32 per pack), imported
   with the pack (multi-file pick of pack.json + images), stored outside settings (SillyTavern user files or
   IndexedDB — CS decides and documents), removed with the pack. Query `packs.portrait({ pack, file })` → a safe image
   URL or null. `packs.list` keeps giving each pack's version.
2. **Story Director (CD)** owns the cast state and the rules: domain `cast` per entry key `pack:id`: met (on, where),
   where now, doing, last heard (for met), alive, entry version seen. Query `director.cast` → [{ key, pack, id, name,
   aliases, met: { on, where } | null, where?, doing?, lastHeard?, alive, entry? }] where `entry` (the full pack entry)
   is present ONLY for met people (NSD needs it at the first meeting) — unmet entries never leave SD except as counts.
   A meeting is recorded on the reply (step `cast.meet`, swipe undoes, Re-read keeps).
3. **NPC State Delta (CN1, CN2)** reads `director.cast` (and `packs.portrait`) one way; never writes to SD.

## Replay
Everything recorded on replies like every domain: rebuild == live == reload; swipe / middle delete exact.
