# Inventory Block v0.2.1

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

`Copy block` outputs the same seed format, so a current backend inventory can be copied into another fresh character/card if wanted.

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

Small gameplay changes use compact patch operations. Broad cleanup/reorganization requested by the user can use one atomic full-state replacement.

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

For broad user-requested semantic cleanup:

```html
<!-- INVENTORY_BLOCK_UPDATE
{"mode":"replace","categories":[{"name":"Shared Supplies","items":[{"name":"Food","quantity":"1","remark":"About 8 days"}]}]}
-->
```

The control record is removed from the raw assistant message after processing. If malformed, duplicated, truncated, ambiguous, or invalid, the entire update is rejected and the previous inventory remains intact.

`adjust_item` is only for plain numeric Quantity values. Semantic quantities such as `Food | 1 | 8 days` or `Coin Pouch | 1 | 400 Gold` should be changed with `edit_item` so the meaningful amount in Remark is preserved.

## Validation and safety

v0.2.1 validates backend writes strictly:

- category names cannot be blank;
- item names cannot be blank;
- category names are case-insensitively unique;
- item names are case-insensitively unique within their category;
- `General` and `Uncategorized` canonicalize to one root `General` category;
- a leading display prefix such as `×1`/`x1` is normalized to stored quantity `1`;
- move/rename collisions are rejected;
- malformed JSON import/replacement cannot silently clear inventory;
- multiple machine update records in one reply are rejected instead of double-applied;
- unknown backend state versions fail visibly instead of silently resetting inventory.

## Revisions, swipes, regeneration, and deletion

Every accepted state change stores a complete backend snapshot. Revision history itself is never injected into the LLM.

Assistant swipes carry only small revision metadata in SillyTavern's `extra` / `swipe_info`. Inventory Block also records compact chat-lineage checkpoints so it can distinguish the active story branch.

This allows:

- switching swipes to restore the inventory belonging to that swipe;
- regenerating a response from the inventory state that existed before the replaced response;
- continuing an existing response without double-applying earlier changes;
- deleting a middle assistant **or user** message to invalidate downstream inventory state from the divergent timeline;
- preserving manual inventory edits while the same story lineage continues;
- restoring old revisions through Inventory History;
- recovering a previous swipe/branch without replaying transaction deltas.

A dedicated mutation serial distinguishes real inventory writes from harmless branch-pointer movement, preventing swipe/regeneration restoration from being mistaken for a concurrent manual edit.

## Megumin Suite integration

When the newest assistant message contains a Megumin Suite block card, Inventory Block joins it as an **Inventory** tab and uses the Megumin visual language.

The visible inventory still resembles the v1.x ledger:

- `Inventory Ledger` title;
- total item + section count;
- `Edit inventory`;
- `Copy block`;
- root items always visible;
- compact `Name / ×Quantity / Remark` rows;
- collapsible free-form categories with item counts.

The inventory tab is only a renderer over backend state. Inventory is not stored in the Megumin/assistant text block.

Inventory neutralizes Megumin's own selected-tab state before taking focus so switching back to World State/Choices/etc. behaves normally. The standalone fallback uses its own root class so Megumin's block cleanup cannot delete it.

## Editor

Open **Extensions → Inventory** or click `Edit inventory` in the Inventory tab.

The editor supports:

- add/delete/edit items;
- add/delete/rename/reorder categories;
- JSON export/import;
- clear inventory;
- revision history and restore.

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

v0.2.1 includes automated protocol/state tests plus an adversarial hard-pass fuzz script. See `TEST-REPORT.md` for the release review.
