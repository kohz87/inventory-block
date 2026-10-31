# Studio Timeline and lasting world changes (build spec, 31 Oct)

USER approved the Studio Timeline mockup v3: https://claude.ai/artifact/AJZkpqZigE5TvZRRh4jrMK (local:
`/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/mock-timeline/`,
`index.html`, `mock.mjs` with the exact injected markup, `shots/`).
Decisions: no World state block; lasting changes go to Story Director's chronicle; "N days after" counts from the
chronicle's `since` stamp. Story Block needs no change: a pack event's `then` steps already run any registered
command with `ctx.cause === 'system'` and `ctx.caller === 'event:<id>'` (SB `src/v2/events/engine.js`
createFireEvent, `src/v2/commands.js` ~438).

## 1. Interface (fixed)
Story Director command **`chronicle.lasting`**, payload:
`{ name: string ≤ 80, state: 'looming'|'ongoing'|'resolved', summary?: string ≤ 240, place?: string ≤ 80,
   factions?: string[] (≤ 4, each ≤ 80), keep?: boolean }`
- Refused (REFUSED) unless `ctx.caller` starts with `event:`. Invalid payload → INVALID.
- Creates the chronicle event, or updates the one with that name (or `aka`). `since` is stamped on create,
  `updated` on every change, from the Director's clock as today.
- The entry is **locked**: it records the event id that wrote it. A reply's `world` line may add to its summary
  but may not change its state or name (the line is applied without those parts; the change card says so plainly).
  Another `chronicle.lasting` and the reader's own edits may change anything.
- `keep: true`: the entry is in every reply's tail ("keep in mind"), at most 2 such entries (the 2 most recently
  updated); they take seats in the existing open-event pick, which still shows at most 3 in total.
- It is an ordinary chronicle world event otherwise: World → News, the Journal on that story day, swipe/delete
  takes it back, live = rebuild = reload.

Pack event written by Studio, e.g.:
```json
{ "id": "the-seventh-seal-fails", "after": "cracks-in-the-seventh-seal", "once": true,
  "when": "query('chronicle.event', { name: 'Cracks in the seventh seal' }) != null && time() >= query('chronicle.event', { name: 'Cracks in the seventh seal' }).since + 86400 && <place condition>",
  "cue": "The seventh seal has failed. …",
  "then": [{ "command": "chronicle.lasting", "payload": { "name": "Seventh seal failed", "state": "ongoing", "place": "Auvoth", "factions": ["Adventurer Guild", "Sealwardens"], "summary": "…", "keep": true } }] }
```
Delays are story minutes: N days × 1440, hours × 60, months × the pack calendar's days per month × 1440.

## 2. Pieces
- **D (Sonnet): Story Director** — `chronicle.lasting`, the lock, keep-in-mind, tests, docs. Brief `timeline-briefs/D.md`.
- **E (Sonnet): Story Studio** — the Timeline view and form, condition writing and reading back, Lasting change,
  "N days after", tests, build. Brief `timeline-briefs/E.md`.
- **Lead:** merge, browser check with SB + SD + a Studio-made pack, review, releases.
