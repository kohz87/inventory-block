# Changelog

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
