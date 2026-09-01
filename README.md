# Inventory Block v0.2.2

A lightweight SillyTavern RPG inventory extension built around **real per-chat backend state** instead of repeating complete inventory snapshots in assistant messages.

v0.2.x is a clean architecture. It intentionally has **no v1.x ledger migration/scanning path**.

## Core model

Inventory Block owns the authoritative current inventory for each chat:

- free-form categories;
- each item has only **Name**, **Quantity**, and **Remark**;
- manual edits change the real backend state;
- the complete current inventory is injected into the LLM for awareness;
- the LLM does not reproduce the full inventory every reply;
- LLM changes arrive through one invisible machine control record, are validated atomically, applied to backend state, then physically stripped from stored chat text;
- complete backend revisions support swipe, regeneration, deletion, and manual restore;
- portable message-metadata checkpoints let SillyTavern Branch/Checkpoint chats rebuild their own backend without visible inventory snapshots;
- old story references cannot resurrect items missing from the current backend inventory.

## Starting inventory from the first message

Use one simple `<Inventory>` block in the character's first assistant message:

```text
<narration>
Your opening scene here.
</narration>

<Inventory>
Coin Pouch | 1 | 100 Gold
Food | 1 | About 7 days

[Equipped / Carried]
Travelling Coat | 1 | Worn
Utility Knife | 1 | Belt

[Astra]
Linen Smock | 1 | Worn
</Inventory>
```

Rows before the first category become the root `General` inventory. Categories use `[Category Name]`.

The extension consumes the seed once for that first-message swipe, stores it as backend state, removes `<Inventory>...</Inventory>` from the actual message, and saves the cleaned story text. Alternate first-message swipes can carry their own seed.

After initialization, `<Inventory>` is reserved. If a model later emits another full `<Inventory>` snapshot, it is stripped and does **not** overwrite backend state.

`Copy block` outputs the same seed format. Literal `|`, `\\`, and `]` characters are escaped so copied blocks round-trip through the seed parser.

## Natural-language/OOC management

Because the complete current inventory is injected into the model, ordinary OOC instructions can reorganize the real backend state:

```text
[OOC: create category for each party member]
```

```text
[OOC: compact all food related items into one Food item and remark the quantity in duration]
```

```text
[OOC: merge duplicate monster materials and shorten the remarks]
```

Small gameplay changes use compact patch operations. When the current user request clearly asks for broad inventory administration, Inventory Block gives that generation a one-time internal replacement capability. The model may then atomically replace the full inventory. A replacement without the exact capability is rejected.

## Hidden update protocol

Ordinary gameplay changes are returned as one machine-only comment at the end of the assistant response:

```html
<!-- INVENTORY_BLOCK_UPDATE
{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]}
-->
```

Supported patch operations:

- `add_category`
- `rename_category`
- `delete_category`
- `add_item`
- `set_item`
- `adjust_item`
- `edit_item`
- `delete_item`
- `move_item`

Full replacement is an internal model protocol only for an explicitly recognized broad inventory-management turn. Inventory Block injects the one-time capability automatically; users do not need to write or manage it.

The control record must be the final non-whitespace response content and is removed from the raw assistant message after processing. If malformed, duplicated, truncated, misplaced, unauthorized, ambiguous, or invalid, the entire update is rejected and the previous inventory remains intact.

`adjust_item` is only for plain numeric Quantity values. Semantic quantities such as `Food | 1 | 8 days` or `Coin Pouch | 1 | 400 Gold` should be changed with `edit_item` so the meaningful amount in Remark is preserved.

Deleting a non-empty category requires the explicit machine confirmation `confirm:"delete-items"`; ordinary category deletion cannot silently throw away its contents.

## Validation and safety

v0.2.1 validates backend writes strictly:

- category and item names cannot be blank;
- category names are case-insensitively unique;
- item names are case-insensitively unique within their category;
- `General` and `Uncategorized` canonicalize to one root `General` category;
- names must be strings, while Quantity/Remark accept only scalar text or finite numbers;
- object/array values are rejected rather than becoming `[object Object]`;
- numeric quantities cannot persist at zero or below; setting/editing a numeric quantity to zero deletes the item;
- leading `×`/`x` is normalized only when it is clearly a numeric count prefix, so values such as `XL` remain intact;
- move/rename collisions are rejected;
- inventory/category/item/control/patch sizes have safety ceilings;
- invalid JSON import/replacement cannot silently clear inventory;
- multiple machine update records in one reply are rejected instead of double-applied;
- unknown backend state versions fail visibly instead of silently resetting inventory.

## Revisions, swipes, regeneration, deletion, and branches

Every accepted state change stores a complete backend snapshot. Revision history itself is never injected into the LLM.

Assistant swipes carry lightweight revision metadata in SillyTavern's `extra` / `swipe_info`. State-changing checkpoints also carry a complete portable snapshot in message metadata. This is not assistant text and costs zero LLM tokens.

This allows:

- switching swipes to restore the inventory belonging to that swipe;
- regenerating a response from the inventory state that existed before the replaced response;
- continuing/appending an existing response without double-applying earlier changes;
- deleting a middle assistant **or user** message to invalidate downstream inventory state from the divergent timeline;
- editing assistant prose without rewinding inventory, while editing a user action still invalidates downstream causal state;
- preserving manual inventory edits on the current timeline;
- restoring old revisions through Inventory History;
- opening a SillyTavern Branch/Checkpoint chat with no copied chat-level Inventory metadata and rebuilding the new branch from portable message checkpoints;
- lazily materializing an alternate swipe's portable checkpoint inside a newly branched chat;
- preventing blindly copied multi-swipe metadata from leaking one swipe's inventory into another.

Branch lineage uses stable assistant inventory UIDs plus content-sensitive user/system fingerprints and rolling prefix hashes. This avoids repeatedly hashing full assistant prose while retaining causal invalidation when user history changes.

## Generation lifecycle

Inventory Block prepares its generation transaction on SillyTavern's `GENERATION_AFTER_COMMANDS` event when available, falling back to `GENERATION_STARTED` on older builds. This avoids creating a phantom inventory transaction when slash-command processing cancels generation.

`quiet`, `impersonate`, and dry-run generations are not treated as RP inventory responses. This is important with Megumin Suite features that use quiet/background generations.

Normal generation has no pre-existing assistant target. Swipe/regenerate/continue/append-style generations are tied to the assistant message they actually modify. Manual editor/history writes are blocked while a tracked response is being committed rather than trying to merge two competing inventory timelines.

## Megumin Suite integration

When the newest assistant message contains a Megumin Suite block card, Inventory Block joins it as an **Inventory** tab and uses the Megumin visual language.

The visible inventory retains the compact ledger layout:

- `Inventory Ledger` title;
- total item + section count;
- `Edit inventory`;
- `Copy block`;
- root items always visible;
- compact `Name / ×Quantity / Remark` rows;
- collapsible free-form categories with item counts.

The inventory tab is only a renderer over backend state. Inventory is not stored in the Megumin/assistant text block.

Inventory neutralizes Megumin's selected-tab state before taking focus so switching back to World State/Choices/etc. behaves normally. The standalone fallback uses its own root class so Megumin's block cleanup cannot delete it.

## Extensions settings and editor

Inventory Block registers a standard SillyTavern settings drawer in the **Extensions** panel. The drawer provides `Edit Inventory`, `History`, and `Copy Block`. The existing wand-menu **Inventory** shortcut remains available as a quick entry point.

You can also click `Edit inventory` directly in the Inventory tab.

The editor supports:

- add/delete/edit items;
- add/delete/rename/reorder categories;
- JSON export/import;
- clear inventory;
- revision history and restore.

Invalid saves keep the editor open so the draft can be corrected instead of being lost.

There is intentionally no inventory search, weight engine, rarity system, or equipment-slot simulator.

## Installation

Install as a third-party SillyTavern extension from:

```text
https://github.com/kohz87/inventory-block
```

Then start a fresh chat/game.

## Development checks

```text
npm test
npm run check
```

`npm test` includes deterministic state/protocol/lifecycle tests and the adversarial fuzz suite. See `TEST-REPORT.md` for the latest hard-pass review.
