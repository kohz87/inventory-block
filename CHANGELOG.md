# Changelog

## 0.2.1

Hardening release after two adversarial lifecycle/code passes and a final release pass.

### State and branch recovery
- Reworked branch recovery around compact chat-lineage checkpoints.
- Fixed middle-message deletion so downstream inventory revisions from the deleted timeline are invalidated.
- User-message deletion now invalidates assistant inventory state generated after that user action.
- Manual branch-head state can follow later user messages while the story lineage remains unchanged.
- Swipe-specific revision metadata is stored in `swipe_info`, creating the array when SillyTavern has swipes but no `swipe_info` yet.
- Continuations can advance through descendant inventory revisions without breaking the message's original base revision.
- Swipe/regeneration prompt injection uses the inventory state from before the response being replaced.
- Added a mutation serial so branch-pointer changes cannot be mistaken for a concurrent manual inventory edit.
- Manual edits made during generation are preserved; conflicting generated writes are discarded.
- Branch-head metadata is compact and capped; manual/restore/import/reset heads are protected from ordinary pruning.

### Validation and protocol
- Added strict validation for blank/duplicate category and item names.
- Canonicalized `General` and `Uncategorized` into one root category.
- Normalized `×1` / `x1` quantity prefixes on input while keeping `×` as display-only UI.
- `set_item` preserves omitted fields on existing items.
- Move and rename collisions are rejected atomically.
- Non-positive numeric `add_item` operations are rejected.
- `adjust_item` rejects semantic/non-numeric quantities.
- Multiple update records in one response are rejected rather than double-applied.
- Malformed/truncated update records are stripped and rejected without changing state.
- Later accidental `<Inventory>` snapshots are stripped and cannot overwrite backend state.
- Historical machine-control text is stripped without applying it to current inventory.
- Invalid JSON import/replacement cannot normalize into an accidental empty inventory.
- Unknown backend state versions fail visibly instead of silently resetting data.
- Tightened prompt instructions: full replacement is reserved for explicit user-requested broad administration.

### First-message seed
- `<Inventory>...</Inventory>` remains a one-time starting-inventory authoring format.
- Supports root rows, `[Category]`, Markdown-style rows, and old-style `-- CATEGORY --` markers.
- Alternate first-message swipes can carry separate seeds.
- Invalid/truncated seeds are stripped and rejected safely.
- `Copy block` round-trips through the same seed parser.

### SillyTavern lifecycle
- Removed blocking `await saveChat()` behavior from `MESSAGE_RECEIVED`; persistence is deferred outside the awaited event chain.
- Added safe handling for `MESSAGE_UPDATED`, `MESSAGE_EDITED`, generation start/stop/end, swipe deletion, and first-message selection.
- Startup/menu/Megumin mounting retry when DOM/context is not ready yet.
- Prompt injection is explicitly cleared when no chat is active.
- Historical inserted assistant messages no longer inherit the current tail inventory revision.

### Megumin/UI
- Fixed Megumin internal tab-state desynchronization when Inventory takes focus.
- Standalone fallback no longer claims Megumin's `.meg-blocks` root class.
- Only the current/latest assistant mount owns the Inventory UI; old message mounts are cleaned up efficiently.
- Category open/closed UI state persists across pane/card redraws, including the all-closed state.

### Tests
- Added Node test harness (`npm test`, `npm run check`).
- 22 deterministic state/protocol tests.
- 1,000 starting-inventory serialization round-trips in hard-pass fuzzing.
- 200 randomized timeline deletion/recovery runs.
- Syntax checks across every runtime module.

## 0.2.0
- Initial backend-state architecture.
- Per-chat canonical inventory and full-state revisions.
- Full current inventory prompt injection.
- Hidden LLM patch/replacement controls.
- Megumin-compatible Inventory tab and standalone fallback.
- Manual editor/history/import/export.
- One-time first-message `<Inventory>` seeding.
