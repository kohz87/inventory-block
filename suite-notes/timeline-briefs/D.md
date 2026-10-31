# Agent D: Story Director, lasting world changes (Sonnet)

Repo https://github.com/kohz87/Story_director, branch `stage16/chronicle-lasting` from `origin/main`. Read COMMON.md.

Files: `src/v2/chronicle/*` (domain.js validator and caps, capture.js for the lock, pick.js for keep-in-mind, index.js
to register the command, queries.js if the query should expose `locked`/`keep`), `src/v2/world/*` only if News or the
Journal need a touch, tests under `tests/v2/` next to the chronicle tests, `docs/` (the chronicle section), CHANGELOG
"Unreleased" entry. Do not bump the version.

1. **`chronicle.lasting`** exactly as SPEC_TIMELINE §1: caller check, payload validation and caps, create or update by
   name/aka, `since`/`updated` from the Director's clock (null while the clock is not set: then a delay counting from
   it never fires; document that), records the event id (`by: 'event:<id>'` or similar) and `keep`.
2. **The lock:** a reply's `world` line naming a locked entry keeps its summary addition but not a state or name
   change; the change card line says e.g. "Seventh seal failed stays ongoing (set by the world's timeline)". The
   reader's `chronicle.edit` can change anything (and may clear the lock and keep).
3. **Keep in mind:** up to 2 kept open entries (most recently updated) always in the tail pick, within the existing
   cap of 3. A resolved entry is not kept.
4. **Visible like any world event:** World → News, the Journal on that day. Hidden names rules (known.js) still apply.
5. Old chats and old saves validate and behave byte-identically (no new fields written unless the command runs).

Tests: the caller refusal (ui, a reply line, another module), create/update/aka, the lock against `world` lines, the
reader override, keep-in-mind limits and ordering, swipe/delete/rebuild/reload equality, no-clock behaviour, and an
end-to-end test through Story Block's runtime kit (this repo syncs one; find it) with a pack event whose `then` calls
`chronicle.lasting`, then a second event whose `when` uses `query('chronicle.event', { name }).since + N`.
