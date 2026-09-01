# Inventory Block v0.2.0

A lightweight SillyTavern RPG inventory extension built around **real per-chat backend state** instead of repeating inventory snapshots in assistant messages.

This is a clean v0.2.0 architecture. It intentionally has **no legacy Inventory Ledger parser or migration path**.

## Design

Inventory Block owns one authoritative inventory per chat:

- free-form categories;
- items contain only **Name**, **Quantity**, and **Remark**;
- manual edits change the actual stored inventory state;
- the complete current inventory is injected into the LLM for awareness;
- the LLM does **not** reproduce the inventory every reply;
- inventory changes are returned through an invisible machine control comment, applied atomically, then removed from the stored assistant message;
- full backend revisions support branch recovery for swipes, regeneration, and message deletion;
- manual edits and restores create revisions without adding anything to LLM context.

## Megumin Suite integration

When a Megumin Suite block card exists on the newest assistant message, Inventory Block joins it as an **Inventory** tab and uses Megumin's block classes/styles.

The inventory itself still lives in Inventory Block's backend state. It is not a generated Megumin text block and is not stored in the assistant message.

If Megumin Suite is unavailable, a small standalone fallback card is shown so inventory remains accessible.

## Inventory format

Each category contains rows with only three fields:

```text
Name | Quantity | Remark
```

Example:

```text
Lucien
Soul Blade | 1 | Equipped

Astra
Linen Smock | 1 | Worn

Shared Supplies
Food | 1 | About 8 days for the current party
Gold | 412 |
```

Categories are deliberately free-form. They can represent owners, storage, purpose, or any organization useful to the current game.

## Natural-language management

Because the full current inventory is injected into the model, ordinary OOC instructions can administer the backend inventory semantically, for example:

```text
[OOC: create category for each party member]
```

```text
[OOC: compact all food related items into one Food item and remark the quantity in duration]
```

Broad reorganizations use an atomic full-state replacement. Small gameplay changes use compact patch operations.

## Hidden update protocol

The model is instructed to append a machine-only HTML comment **only when inventory changes**:

```html
<!-- INVENTORY_BLOCK_UPDATE
{"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]}
-->
```

For broad cleanup/reorganization:

```html
<!-- INVENTORY_BLOCK_UPDATE
{"mode":"replace","categories":[{"name":"Shared Supplies","items":[{"name":"Food","quantity":"1","remark":"About 8 days"}]}]}
-->
```

The extension consumes this record, validates it, creates a backend revision if the state changed, removes the control record from the actual assistant message/swipe, and saves the clean story text.

If an update is malformed, the entire update is rejected and the previous inventory state remains intact.

## Revisions and branch recovery

Every accepted inventory state change is stored as a complete backend snapshot. Revisions are not injected into the model.

Assistant swipes carry only tiny revision metadata in SillyTavern's message/swipe `extra` object. When a swipe changes or messages are deleted, Inventory Block resolves the inventory revision belonging to the surviving active story branch.

Manual edits are associated with the current branch through backend branch-head metadata, so they remain real edits without requiring a fake assistant inventory message.

## Editor

Open **Extensions → Inventory** or click the edit button inside the Inventory block.

The editor supports:

- add/delete/edit items;
- add/delete/rename/reorder categories;
- JSON export/import for v0.2.0 state;
- clear inventory;
- revision history and restore.

There is intentionally **no inventory search** and no weight/equipment/rarity subsystem.

## Installation

Install as a third-party SillyTavern extension using:

```text
https://github.com/kohz87/inventory-block
```

Then enable the extension and start a fresh chat/game.

## State ownership

Inventory Block is intended to own exact current possessions/resources. Other memory, lore, world-state, or NPC-state systems should treat it as the authoritative inventory rather than duplicating exact item quantities.
