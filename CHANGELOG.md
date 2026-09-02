# Changelog

## 0.3.1

Deep hardening pass for resource integrity, history storage, and concurrent generation isolation.

- Adds backend-enforced `adjust_resource` arithmetic for single-number Remark balances such as `100 Gold` and `About 7 days`, preserving surrounding unit/approximation text.
- Rejects Quantity and Remark resource adjustments that would go below zero; exact Quantity depletion still removes the item, while `adjust_resource` can explicitly delete exhausted stock with `deleteAtZero:true`.
- Makes concurrent generation session matching fail closed whenever multiple candidates cannot be uniquely identified, including empty/short prompt probes.
- Bounds logical portable message/swipe checkpoint groups with the selected History retention budget while preserving current/recent branch anchors.
- Makes History retention survive localStorage write failures through an in-memory authoritative fallback.
- Removes the duplicate full-chat save from Clear History.
- Makes revision comparison report empty-category additions/removals.
- Refreshes the open History inspector immediately after Restore so active state/buttons cannot go stale.
- Extends settings, resource, history, concurrency, persistence, and long-session regression coverage.
- Completed ten repeated full hard-pass cycles before release commit.

## 0.3.0

History inspection, comparison, and retention controls.

- Adds read-only **View** for any retained inventory revision.
- Adds comparison between any two retained revisions, showing only changed, added, and removed inventory rows.
- Adds one-click comparison of a historical revision against the current revision while keeping Restore separate and explicit.
- Adds extension-wide history retention choices of 50, 100, 200, 500, or 768 revisions, with 200 as the default.
- Makes revision, branch-head, and sticky-branch-head compaction honor the selected retention budget so old branch metadata cannot silently grow beyond the configured cap.
- Adds **Trim History Now** for immediate compaction of the active chat.
- Adds **Clear History** while preserving the exact current inventory as a new baseline.
- Clear History scrubs stale Inventory Block metadata from current and alternate swipe records before writing the new baseline checkpoint, preventing deleted history from being reconstructed later.
- Bumps mutation serial on history clearing so any in-flight generation using the old history cannot commit stale inventory state afterward.
- History viewing/comparison remains backend-only and consumes no LLM context tokens.

## 0.2.9

Generalized finite-resource accounting hardening.

- Extends automatic Inventory accounting beyond currency to food, water, ammunition, fuel, medicine, crafting supplies, charges, and other tracked possessions.
- Uses `adjust_item` when the meaningful amount is a plain numeric Quantity and `edit_item` when the remaining amount/state lives in Remark.
- Supports compact duration/state rows such as `Food | 1 | About 7 days` and `Waterskin | 1 | Full` without changing the container/stock-row Quantity.
- Preserves approximate wording instead of inventing false precision.
- Counts only completed changes; planned, attempted, negotiated, interrupted, or failed actions do not consume or grant resources unless completion is established.
- Preserves durable empty containers such as `Coin Pouch | 1 | 0 Gold` or `Waterskin | 1 | Empty`, while removing exhausted rows that represent the consumable stock itself.
- Keeps resource balances non-negative and groups all related changes from one event into the same atomic patch.
- Replaces the currency-only prompt module and tests with a single generalized resource-accounting rule and regression suite.

## 0.2.8

Currency balance tracking hotfix.

- Treats completed purchases, payments, fees, tips, sales, rewards, refunds, theft, and other money changes as Inventory mutations.
- Correctly handles the existing `Coin Pouch | 1 | 100 Gold` model: the pouch count remains `1` while the balance in Remark is recalculated and written with `edit_item`.
- Explicitly demonstrates `100 Gold` minus a `15 Gold` purchase becoming `85 Gold`, which removes the previous ambiguity between container Quantity and spendable Remark.
- Keeps a zero balance as `0 Gold` instead of deleting the pouch and forbids negative balances.
- Requires item changes and their payment/reward change to be emitted in the same atomic Inventory patch.
- Adds focused currency prompt and final-injection regression tests.

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
