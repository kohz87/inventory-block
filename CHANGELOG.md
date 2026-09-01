# Changelog

## 0.2.3

Deep lifecycle, protocol, branch-recovery, prompt-isolation, and storage hardening release.

### Prompt and generation isolation
- Switched live Inventory context from a generation-global extension prompt to a SillyTavern `generate_interceptor` with a generation-local opaque prompt slot.
- Quiet and impersonate/background generations no longer receive foreground Inventory context, including overlapping generation cases.
- Opaque prompt slots reserve prompt budget with encoded payload and are replaced only in the matching final prompt.
- Inventory text no longer participates in World Info scans during live prompt assembly.
- Removed the old `recentGeneration` / background-depth terminal-event bridge; `MESSAGE_RECEIVED` owns commit completion and a watchdog clears abandoned transactions.
- Added generation-type matching and causal timeline-prefix guards so unrelated assistant messages or concurrent timeline edits cannot consume/apply a transaction.

### Hidden protocol and seed hardening
- No-control assistant replies are now byte-for-byte untouched by Inventory processing.
- Hidden comment controls now require a terminal period so SillyTavern's Trim Incomplete Sentences cannot cut off `-->`.
- Embedded literal `-->` cannot leak machine JSON into stored prose.
- Patch operands now reject coercible booleans/arrays/objects and require strict item/category names and numeric adjustments.
- Prompt data escapes XML delimiters, macro braces, category brackets, ampersands, and pipes.
- v2 seed grammar is now intentionally strict: `[Category]` plus `Name | Quantity | Remark`; legacy Markdown-header / `-- Category --` interpretation was removed.
- Copy/seed round-trip now safely handles `|`, `\\`, `]`, `<`, `>`, `<Inventory>`, `</Inventory>`, and literal unicode-escape text.
- Consecutive fresh group greetings may merge non-conflicting Inventory seeds.

### Revisions and recovery
- Metadata-less hydration now reuses prepared lineage data instead of repeatedly hashing the entire chat.
- Backend revisions are hard-capped at 768; History output is capped at 200.
- Damaged/excessive branch-head metadata is pruned before revision compaction.
- Pruned revisions can be rematerialized from portable checkpoints when an older branch becomes active.
- Manual checkpoints on previously unprocessed assistant greetings receive stable UIDs and survive assistant prose edits.

### UI and maintenance
- Refactored Extensions drawer/menu mounting into testable DOM helpers.
- JSON export filename now follows the actual extension version.
- Updated release documentation and hard-pass coverage for v0.2.3.

## 0.2.2

Extensions-panel UI hotfix.

- Added a standard SillyTavern Extensions settings drawer with Edit Inventory, History, and Copy Block.
- Kept the wand-menu Inventory shortcut.
- Shared retry path for settings/menu mounting.

## 0.2.1

Backend-state hardening release.

- Added portable message/swipe checkpoints for metadata-less Branch/Checkpoint recovery.
- Added stable assistant lineage UIDs and rolling prefix hashes.
- Hardened swipe/regeneration/continuation lifecycle handling and manual-write concurrency.
- Added one-time capability-gated full replacement, strict validation, destructive-category confirmation, and safety limits.
- Added deterministic and fuzz hard-pass coverage.

## 0.2.0

- Initial clean backend-state architecture.
- Per-chat canonical inventory and full-state revisions.
- Full current inventory prompt injection.
- Hidden LLM patch/replacement controls.
- Megumin-compatible Inventory tab and standalone fallback.
- Manual editor/history/import/export.
- One-time greeting `<Inventory>` seeding.
