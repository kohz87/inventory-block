# G22-NSD — NPC meters in the public API + the L2a scan fix (read GEN22-COMMON.md first)
Two repos, two branches named `stage66/npc-api`:
- Story_block, from origin/main 2ee6318: the small host part.
- npc_state_delta, from origin/main 1840358 (1.9.0): the NSD part. Full suite: `npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js tests/v2/break/*.test.js`.
Real ST on ports 8440/8540. Do not bump versions (CHANGELOG "Unreleased").

1. **Public API paths from modules** (Story Block 2.22.0). PUBLIC-API.md promises `npc.<name>.<meter>` "as an NPC State Delta change".
   - Story Block: an internal sdk hook, `sdk.registerPublicPaths({ owner, prefix, paths() → [path], get(path) → value, hidden(path) → bool })` → `unregister()`.
     - `api.get`, `api.paths()`, `{{sb::…}}` and the `story:changed` change lists include them.
     - The api v1 rules hold: frozen plain copies, hidden values never returned, read-only.
     - One owner per prefix; `prefix` may not shadow Story Block's own paths (scene, money, items, party, blocks).
     - Update PUBLIC-API.md (the npc paths are now live, from NSD 1.10.0).
   - NSD: register prefix `npc`, with paths `npc.<name>.<meter>` for every tracked NPC's meters (trust, affection, desire, tension, …, as NSD names them), plus `npc.<name>.mood` and `npc.<name>.present` if they are cheap.
     - Hidden meters and hidden notes are never returned.
     - Names are matched as Story Block matches names (no dot splitting).
     - Unregister on unload; with an older Story Block, do nothing.
   - Tests on both sides: get, paths, macro, a hidden meter reading undefined, change events on a meter change, and an older Story Block.
2. **L2a (NSD).** A manual scan, a full-cast Refresh or a narration-capture moves `lastScannedMessageId` past replies that are still waiting, so they are never read. The 1.9.0 builder left this because moving the marker only to the capture would make the next window re-read the capture's reply.
   - Design a fix that keeps "each reply read exactly once": for example, the manual/Refresh/capture scan reads the waiting replies too (its window starts at the marker), or it records which reply it read so the next window skips exactly that one.
   - Prove it with the read-once simulation (re-point $S/rv-nsd5/probes/sim3*.mjs) across catch-up, failures, restores, imports and Clear.
   - Report the bytes and call counts against 1.9.0 (Lean must not rise).
