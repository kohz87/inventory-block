# Changelog

## 0.2.2

Extensions-panel UI hotfix.

- Added a standard SillyTavern **Extensions settings** drawer under `#extensions_settings` with `#extensions_settings2` fallback.
- Added `Edit Inventory`, `History`, and `Copy Block` actions to the settings drawer.
- Kept the existing wand-menu Inventory shortcut as a convenience rather than using it as the only entry point.
- Settings-panel and wand-menu mounting now share one retry path so both appear reliably when SillyTavern finishes building the UI.
- Added a regression test that verifies both settings hosts and all three settings actions remain wired.

## 0.2.1

Hardening release for the backend-state architecture. The current `main` includes additional multi-pass lifecycle/branch hardening after the initial 0.2.1 review.

### Portable branch and swipe recovery
- Added portable full-state checkpoints in message/swipe metadata. They consume zero LLM tokens and allow SillyTavern Branch/Checkpoint chats to rebuild inventory even though SillyTavern creates new branch chat metadata.
- Manual/restore/import/reset changes attach a portable checkpoint to the current timeline tail so a branch created after an OOC/manual edit carries that state.
- Added lazy materialization for alternate swipes copied into a metadata-less branch.
- Added lineage-v2 assistant identities based on stable inventory UIDs + swipe identity instead of hashing complete assistant prose.
- Assistant prose edits no longer rewind inventory; user/system content remains causally fingerprinted so edited/deleted user actions invalidate downstream state.
- Rolling prefix lineage hashes remove repeated full-prefix hashing.
- Branch-head pruning is now a hard cap even when many heads are manual/sticky.
- Blindly copied multi-swipe metadata cannot leak an active swipe's inventory into a different swipe; copied duplicate metadata is also cleaned after generation.

### Generation lifecycle and concurrency
- Inventory generation setup now uses `GENERATION_AFTER_COMMANDS` when available, with `GENERATION_STARTED` as compatibility fallback. A generation cancelled by slash-command processing therefore does not leave a phantom Inventory transaction.
- Normal generations no longer treat the previous assistant message as their target.
- Swipe/regenerate/continue/append-style generations bind to the assistant message they actually replace/extend.
- The current composer text is used when recognizing broad OOC inventory administration, because SillyTavern emits its generation-preparation event before appending the new user message.
- Quiet/impersonate generations are isolated from RP inventory state. Dry runs create no background generation bookkeeping.
- Added a bounded generation watchdog for requests that fail before SillyTavern reaches its generating UI state.
- Manual editor/history writes are blocked while a tracked response is committing, avoiding rejected-branch inventory leaking through a concurrent manual edit.
- Cross-chat editor/history/deferred-save checks reject writes if the active chat changes underneath an operation.
- Complete update blocks are not stripped/applied from `MESSAGE_UPDATED` while the tracked response can still be streaming.
- Existing generated swipe candidates with hidden patch controls are processed when selected.
- Untracked extension/command assistant messages cannot mutate backend inventory merely by containing machine-control syntax.

### Validation and protocol
- Full replacement now requires a one-time per-generation capability that is exposed only when the user's current request is recognized as broad inventory administration.
- Full replacement is rejected at parser level without the exact capability.
- Non-empty `delete_category` requires explicit `confirm:"delete-items"`.
- Category/item/control/patch sizes have hard safety ceilings.
- Object/array/boolean values cannot be silently coerced into item/category text.
- Numeric quantities cannot persist at zero or below; set/edit to zero removes an existing item.
- `normalizeQuantity` strips `x`/`×` only when it is clearly a numeric count prefix, preserving values such as `XL` and `X-grade`.
- Machine control must be the final non-whitespace content of the response.
- Multiple first-message `<Inventory>` seed blocks are stripped and rejected.
- `Copy block` now escapes pipes, backslashes, and closing brackets so the seed representation round-trips losslessly.

### Editor/UI
- Invalid editor saves use SillyTavern Popup `onClosing` validation and keep the popup open for correction.
- Per-chat section-open UI cache is bounded.
- Existing Megumin tab-state, standalone-root isolation, and latest-message ownership fixes remain in place.

### Tests and hard passes
- `npm test` now runs both deterministic tests and the hard-pass fuzz script.
- 33 deterministic tests currently pass.
- 1,000 seed serialization/parser round-trips pass, including escaped delimiters.
- 300 randomized timeline deletion/recovery runs pass.
- 200 portable branch reconstruction runs pass, including manual checkpoints.
- Branch-head hard-cap stress and selected-swipe branch portability pass.
- A 4,000-message / 512-branch-head performance probe resolved active inventory in about 5 ms per pass in the review environment.
- `npm run check` passes for every runtime module, including the new lifecycle module.

### Earlier 0.2.1 hardening retained
- Strict blank/duplicate validation and collision rejection.
- `General` / `Uncategorized` root canonicalization.
- Atomic malformed/truncated/duplicate update rejection.
- Later accidental `<Inventory>` snapshots are stripped and cannot overwrite backend state.
- Middle assistant/user deletion invalidates downstream inventory revisions.
- Mutation serial distinguishes real state writes from branch-pointer restoration.
- Non-blocking message persistence and prompt clearing on no active chat.
- Megumin tab-state synchronization and standalone fallback isolation.

## 0.2.0
- Initial backend-state architecture.
- Per-chat canonical inventory and full-state revisions.
- Full current inventory prompt injection.
- Hidden LLM patch/replacement controls.
- Megumin-compatible Inventory tab and standalone fallback.
- Manual editor/history/import/export.
- One-time first-message `<Inventory>` seeding.
