# Inventory Block v0.2.1 Hard-Pass Test Report

Date: 2026-09-01

## Scope

The v0.2.1 review targeted backend correctness rather than visual polish alone:

- per-chat persistence;
- strict schema validation;
- first-message seed parsing;
- hidden update parsing/stripping;
- atomic patch/replacement behavior;
- manual edits;
- branch lineage;
- middle-message deletion;
- user-message deletion;
- swipes and swipe metadata;
- continuation descendant revisions;
- generation concurrency;
- SillyTavern event behavior;
- Megumin Suite block ownership/tab state;
- startup/DOM timing;
- prompt/state reset failure modes.

## Pass 1

Applied all findings from the original deep review. Added strict validation, lineage-aware recovery, safe imports, collision checks, later `<Inventory>` stripping, swipe-info creation, semantic-quantity handling, non-blocking persistence, Megumin isolation, and automated tests.

Initial deterministic suite: 18/18 passed.

### Additional issues discovered during hard pass 1

- Full lineage arrays in branch heads would grow metadata roughly quadratically over a long chat.
- Invalid control on a new swipe/regeneration could preserve the rejected old swipe state instead of the pre-response base state.
- An empty section-open set could not distinguish "user closed everything" from "first render".

All were fixed before Pass 2. Branch heads now store compact prefix hash/length metadata instead of full lineage arrays.

## Pass 2

Expanded tests for swipe-specific restoration, manual branch heads, malformed controls, quantity semantics, duplicate/collision behavior, and round-trip first-message blocks.

Deterministic suite: 20/20 passed.

### Additional issue discovered during hard pass 2

Concurrent-edit detection originally compared the active revision pointer. Swipe/regeneration lifecycle events can legitimately move that pointer while generation is active, causing a false conflict.

Fixed by adding `mutationSerial`, incremented only by real inventory revision creation. Branch navigation no longer counts as an inventory mutation.

Historical assistant insertion/control handling and deferred message persistence were also hardened during this pass.

## Final pass

Final deterministic suite: **22/22 passed**.

Additional adversarial checks:

- **1,000** seed serializer/parser round-trips passed.
- **200** randomized timeline deletion runs passed. Each deletion resolved to the last valid inventory state before lineage divergence.
- Swipe switching restored the correct per-swipe revision, including a manual edit attached to one swipe only.
- Continuation revision ancestry passed.
- `swipes` with missing `swipe_info` was repaired safely.
- Unknown state versions were confirmed to throw without resetting stored state.
- Static scan confirmed there is no legacy latest-ledger chat scan, no fallback-snapshot architecture, no blocking `await ctx.saveChat()` in the message handler, and no standalone `.meg-blocks` ownership collision.
- `node --check` passed for `index.js` and every source module.

## Known design choices

- Full revision snapshots are intentionally retained for reliable branch/history recovery. This consumes backend chat metadata over very long campaigns but consumes zero LLM tokens.
- The full current inventory is intentionally injected each generation because the schema is small and complete possession awareness is preferred over retrieval heuristics.
- Full inventory replacement remains available only as a model protocol for explicit broad user/OOC administration; normal gameplay should patch.
- Live browser smoke testing inside the user's exact SillyTavern + Megumin Suite Beta build is still recommended because repository tests cannot reproduce every DOM/event ordering of a running browser installation.

## Release assessment

v0.2.1 passed the requested multi-pass adversarial review with no remaining identified state-corruption defect in the tested backend/protocol paths.
