# Changelog

## 0.2.7

Terminal-sentinel resilience hotfix.

- Accepts a complete valid `<!-- INVENTORY_BLOCK_UPDATE ... -->` control even when the model omits the trailing period.
- Keeps the trailing period in the prompt as the preferred form for SillyTavern sentence-trimming compatibility.
- Truncated comments, malformed JSON, and multiple controls remain rejected atomically.
- Adds deterministic and fuzz regression coverage for periodless controls, including Megumin blocks after the control.

## 0.2.6

Operation-shape resilience hotfix.

- The prompt now explicitly requires a string `"op"` field in every patch operation and includes a canonical add-item example.
- Safely normalizes unambiguous weak-model aliases: `"operation"`, `"action"`, and `{ "add_item": { ... } }`-style single-key wrappers.
- Conflicting aliases, malformed canonical `op` values, and ambiguous wrappers remain rejected atomically.
- Missing-operation errors now identify the failing operation index and show the expected canonical shape.
- Synchronizes the runtime VERSION constant with release metadata.

## 0.2.5

Megumin multi-block compatibility hotfix.

- Inventory controls no longer need to be the absolute final non-whitespace content of a reply.
- One complete Inventory control with the mandatory terminal period may appear before or after other structured/Megumin blocks.
- The parser still accepts only one Inventory control and removes only that machine span, preserving all other prose and blocks byte-for-byte.
- Updated the model prompt so Inventory no longer competes with World State, Dice, or other blocks for tail position.

## 0.2.4

Prompt-pipeline and failure-safety hardening.

- Removed the synthetic/base64 Inventory chat-message reservation entirely.
- Inventory state is now snapshotted per generation and injected only at final prompt-ready time, after World Info, depth, regex, macro, and prompt construction.
- Added generation-session binding so a chat switch cannot inject another chat's Inventory into an in-flight request.
- Rebound normal-generation causal guards after SillyTavern appends the submitted user message.
- Added prompt probes to prevent unrelated raw/background prompt-ready events from consuming a foreground Inventory session.
- Quiet and impersonation generations remain isolated from Inventory injection and writes.
- Full replacement now requires explicit bracketed OOC/admin-style inventory intent; ordinary narrative wording stays patch-only.
- InventoryState is now lossless JSON instead of a delimiter-transformed presentation format.
- Rejected/misplaced machine controls remove only machine syntax and preserve surrounding prose.
- Hardened truncated controls and literal `-->` handling.
- Removed the legacy `<InventoryUpdate>` protocol.
- First-message seed parsing is strict and atomic; malformed nonblank rows reject the full seed.
- Existing multi-greeting group chats can seed/merge their initial Inventory blocks when the extension loads after greeting events.
- Backend identity matching now uses deterministic Unicode normalization plus locale-independent lowercase.
- Portable checkpoints now use compact tuple packing while remaining compatible with v0.2.3 full-state checkpoints.
- Dry-run prompt accounting is bounded and independently matched.
- Added short terminal-event grace cleanup to avoid long editor locks after failed/stopped generations without committing on terminal events.
- Expanded lifecycle/session/protocol/branch fuzz coverage.

## 0.2.3

Generation-local prompt-slot hardening, strict protocol validation, bounded backend revision storage, optimized portable branch hydration, and expanded tests.

## 0.2.2

Added the standard SillyTavern Extensions settings drawer while retaining the wand-menu shortcut.

## 0.2.1

Branch/revision, swipe, regenerate, deletion, validation, import, and Megumin integration hardening.

## 0.2.0

Clean backend-state rewrite. Inventory stopped using repeated assistant-message snapshots as its source of truth.
