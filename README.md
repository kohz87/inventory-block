# Inventory Block v0.3.1

Inventory Block is a lightweight SillyTavern RPG inventory extension with a **per-chat canonical backend**. The chat remains story history; inventory state is stored separately and rendered as an Inventory block compatible with Megumin Suite's block area.

## Inventory model

Categories are free-form. Items deliberately contain only:

```text
Name | Quantity | Remark
```

Example:

```text
<Inventory>
Coin Pouch | 1 | 100 Gold
Food | 1 | About 7 days

[Equipped / Carried]
Travelling Coat | 1 | Worn
Utility Knife | 1 | Belt

[Astra Belongings]
Linen Smock | 1 | Worn
</Inventory>
```

`<Inventory>` is a **one-time starting-inventory seed** for initial character/group greetings. After seeding, the backend is authoritative and later `<Inventory>` blocks are stripped rather than becoming a new source of truth.

For resource containers such as `Coin Pouch | 1 | 100 Gold` or `Food | 1 | About 7 days`, Quantity may identify the container/stock row while the meaningful remaining amount lives in Remark. v0.3.1 adds backend-enforced `adjust_resource` arithmetic for Remark values containing one numeric amount. A 15 Gold purchase applies `-15` to `100 Gold` and deterministically produces `85 Gold`; one established day of food consumption applies `-1` to `About 7 days` and preserves the wording as `About 6 days`. Numeric overdraws reject the entire patch instead of silently deleting or creating negative stock. Semantic states such as `Waterskin | 1 | Full` still use `edit_item`.

## LLM integration

For normal foreground assistant generations, Inventory Block snapshots the current backend state and injects it only at SillyTavern's **final prompt-ready stage**. It does not insert a fake chat message, does not participate in World Info scanning, and does not shift chat-depth positions.

The model receives the complete current inventory as lossless JSON. Ordinary turns use compact patch operations. Full replacement is available only for an explicit bracketed OOC/admin inventory directive such as:

```text
[OOC: create category for each party member]
[Compact all food related items into 1 food item and remark the quantity in duration]
```

If inventory changes, the model appends one machine-only suffix:

```html
<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[...]} -->.
```

The extension validates the complete update atomically, applies it to backend state, creates a revision, strips the machine comment, and stores only normal story prose. If nothing changes, there is no inventory output.

Completed gains and losses of tracked finite resources are treated as Inventory changes. This includes money, food, water, ammunition, fuel, medicine, crafting supplies, charges, and ordinary possessions. Plain numeric Quantity values use `adjust_item`; amounts or states stored in Remark use `edit_item`. Approximate descriptions such as `About 7 days` remain approximate rather than being converted into invented exact units.

Only completed changes count. Planned, attempted, negotiated, interrupted, or failed actions do not spend or grant resources unless the response establishes that they actually happened. Durable containers can remain when empty, such as `Coin Pouch | 1 | 0 Gold` or `Waterskin | 1 | Empty`; exhausted rows that represent the consumable stock itself are removed instead of becoming ghost stock. Negative resource balances are forbidden, and related changes from the same event are emitted in one atomic patch.

Quiet/background and impersonation generations do not receive Inventory state and cannot mutate Inventory.

## History, comparison and retention

Each accepted state change creates a complete backend revision. History data never enters LLM context.

The History window can:

- **View** the complete read-only inventory at any retained revision;
- **Compare** any two retained revisions and show only changed, added, and removed inventory rows;
- compare a selected revision directly against the current revision;
- **Restore** an older revision as a new current revision without destroying the retained trail.

Under **Extensions → Inventory Block**, History retention can be set to **50, 100, 200, 500, or 768 revisions**. The default is **200**. The same budget also bounds logical portable checkpoint groups stored on message/swipe metadata, preventing long campaigns from accumulating an unbounded second history trail. The selected value is an extension-wide cap; changing it immediately trims the active chat, while other chats use the new cap when they are next opened or changed. Old branch-head references are pruned with the same cap before revision compaction so retained branch/swipe metadata cannot silently exceed the selected history budget.

**Trim History Now** enforces the current cap on the active chat. **Clear History** is destructive only to the history trail: it preserves the exact current inventory, removes older backend revisions and stale chat/swipe checkpoints, then records the current inventory as a new baseline so deleted history cannot be reconstructed later from portable metadata.

## Branch, swipe, regenerate and deletion recovery

State-changing messages carry compact portable checkpoints in message metadata so SillyTavern Branch/Checkpoint chats can reconstruct Inventory even when chat-level metadata is not copied.

This supports:

- swipe-specific state;
- regeneration from the pre-response inventory;
- middle/tail message deletion rollback;
- portable branch reconstruction;
- manual edits and restore history.

Portable checkpoints consume no LLM context tokens.

## UI

Inventory remains a compact Megumin-style RPG block:

- root/general items at the top;
- collapsible free-form categories;
- Name / Quantity / Remark rows;
- Edit Inventory;
- Copy Block;
- revision History with View / Compare / Restore.

The same controls plus retention/cleanup settings are available under **Extensions → Inventory Block**. No search, encumbrance, rarity, equipment-slot, or other heavyweight subsystem is added.

## Installation

Install as a third-party SillyTavern extension from:

```text
https://github.com/kohz87/inventory-block
```

Then reload SillyTavern.

## State ownership

Inventory Block should be the authoritative exact possession/resource tracker. Lorebooks, memory systems, World State, and NPC trackers should not duplicate exact inventory quantities as competing state.
