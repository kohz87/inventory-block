# Inventory Block v0.2.3

A lightweight SillyTavern RPG inventory extension built around **real per-chat backend state** instead of repeating complete inventory snapshots in assistant messages.

v0.2.x is a clean architecture. It intentionally has **no v1.x ledger migration/scanning path**.

## Core model

Inventory Block owns the authoritative inventory for each chat:

- free-form categories;
- each item has only **Name**, **Quantity**, and **Remark**;
- manual edits write directly to backend state;
- the complete current inventory is injected into foreground assistant generations;
- quiet/impersonate/background generations do not receive Inventory context;
- the LLM emits a small hidden mutation only when inventory changes;
- mutations are validated atomically, applied to backend state, then physically removed from stored assistant text;
- backend revisions support swipe, regeneration, deletion, restore, and SillyTavern Branch/Checkpoint recovery;
- old story references never override the current backend inventory.

## Starting inventory

A fresh character/game can seed inventory from an assistant greeting:

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

Rows before the first category become root `General` items. Categories use only `[Category Name]`; v0.2.3 deliberately no longer interprets Markdown table headers or `-- Category --` as special seed syntax.

The extension consumes the seed, stores it as backend state, removes the `<Inventory>...</Inventory>` block from the actual assistant message, and saves only the story text. Consecutive first-message greetings in a fresh SillyTavern group chat can contribute additional non-conflicting seed categories/items.

`Copy Block` emits the same strict seed format. Pipes, backslashes, closing brackets, and reserved `<Inventory>` delimiters are escaped losslessly.

After greeting initialization, `<Inventory>` is reserved. Later accidental full snapshots are stripped and do not overwrite backend state.

## Natural-language / OOC management

Because the model receives the complete authoritative state, ordinary instructions can reorganize the real inventory:

```text
[OOC: create category for each party member]
```

```text
[OOC: compact all food related items into one Food item and remark the quantity in duration]
```

```text
[OOC: merge duplicate monster materials and shorten the remarks]
```

Small changes use patch operations. Broad inventory-administration turns receive a one-generation replacement capability, allowing an atomic complete rewrite without granting unrestricted replacement on ordinary turns.

## Hidden update protocol

A normal gameplay change is emitted at the very end of the assistant response:

```html
<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"adjust_item","category":"Supplies","name":"Rations","by":-1}]} -->.
```

The final period is intentional. It keeps the control intact when SillyTavern's **Trim Incomplete Sentences** option is enabled. The entire comment plus period is removed before the message is retained as story text.

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

`adjust_item` accepts only a finite number or plain numeric string. Semantic quantities such as `Food | 1 | About 8 days` should use `edit_item` instead. Deleting a non-empty category requires `confirm:"delete-items"`.

Malformed, duplicated, truncated, misplaced, unauthorized, or invalid controls are rejected atomically. A literal `-->` inside JSON cannot leak machine text into the stored assistant reply; the parser owns the complete final control suffix.

## Prompt isolation and safety

v0.2.3 uses SillyTavern's `generate_interceptor` for live generations. A generation-local opaque prompt slot is inserted into that generation's private working chat, then replaced with Inventory context at the final prompt-ready event.

This gives two useful properties:

1. quiet/impersonate/background generations never inherit the foreground Inventory prompt, even under overlap;
2. Inventory text is not exposed to World Info scanning while the prompt is being assembled.

The opaque slot carries a base64 reservation roughly proportional to the final Inventory prompt so prompt budgeting does not treat the slot as a tiny placeholder and then unexpectedly expand it after truncation.

Inventory values are escaped before prompt insertion. XML delimiters, macro braces, category brackets, ampersands, and pipe delimiters cannot break out of `<InventoryState>` or become SillyTavern macros.

Dry-run token assembly uses a prompt-ready accounting injection because SillyTavern intentionally skips generate interceptors for dry runs; this keeps token estimates aware of Inventory without creating a global live prompt.

## Validation

Backend writes are strict:

- category and item names cannot be blank;
- categories are case-insensitively unique;
- item names are case-insensitively unique within their category;
- `General` and `Uncategorized` canonicalize to root `General`;
- names must be strings;
- Quantity/Remark accept only text or finite numbers;
- booleans, objects, and arrays are not silently coerced;
- numeric quantities cannot persist at zero or below;
- move/rename collisions are rejected;
- inventory/category/item/control/patch sizes have safety ceilings;
- invalid imports and replacements cannot silently clear state;
- unknown backend state versions fail visibly rather than resetting data.

## Revisions, swipes, regeneration, deletion, and branches

Accepted state changes create complete backend snapshots. Backend revision storage is hard-capped at **768** records and the History UI shows at most the newest **200** records. Branch heads are separately bounded.

State-changing messages also carry portable checkpoints in SillyTavern message/swipe metadata. These are not assistant text and cost zero LLM tokens. They are intentionally retained with the state-changing message because exact metadata-less Branch/Checkpoint recovery requires state to travel with the branch.

This supports:

- switching swipes to the inventory belonging to that swipe;
- regeneration from the inventory state before the replaced response;
- continuation without double-applying earlier changes;
- deletion of middle user/assistant messages with causal rollback;
- assistant prose editing without inventory rewind;
- user-action editing with downstream invalidation;
- manual History restore;
- metadata-less SillyTavern branch reconstruction;
- recovery from backend revision compaction through portable checkpoints;
- prevention of copied multi-swipe metadata leaking one swipe's state into another.

Generation transactions also capture a causal timeline prefix. If the underlying timeline or inventory changes while a foreground model request is running, its generated inventory write is discarded instead of being applied to the wrong branch.

## Megumin Suite integration

On the newest assistant message, Inventory Block joins an existing Megumin block card as an **Inventory** tab. If Megumin is absent, it renders a standalone card using the same compact visual language.

The visible tab is only a renderer over backend state. Inventory is not stored as a generated Megumin/assistant text block.

The tab provides:

- item and section totals;
- compact `Name / ×Quantity / Remark` rows;
- root items;
- collapsible categories;
- `Edit inventory`;
- `Copy Block`;
- History.

## Extensions settings and editor

Inventory Block registers a normal SillyTavern **Extensions** settings drawer with `Edit Inventory`, `History`, and `Copy Block`. The wand-menu Inventory shortcut remains available.

The editor supports add/delete/edit items, add/delete/rename/reorder categories, JSON import/export, clear, and revision restore. Invalid saves keep the popup open for correction.

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

`npm test` runs deterministic lifecycle/state/protocol/UI/injection tests plus adversarial seed/control/prompt fuzz and long-branch performance checks. See `TEST-REPORT.md` for the release hard pass.
