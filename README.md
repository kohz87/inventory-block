# Inventory Block v0.3.4

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

For resource containers such as `Coin Pouch | 1 | 100 Gold` or `Food | 1 | About 7 days`, Quantity may identify the container/stock row while the meaningful remaining amount lives in Remark. v0.3.2 uses backend-enforced `adjust_resource` arithmetic for Remark values containing one numeric amount, including comma-grouped values such as `1,200 Gold`. A 15 Gold purchase applies `-15` to `100 Gold` and deterministically produces `85 Gold`; one established day of food consumption applies `-1` to `About 7 days` and preserves the wording as `About 6 days`. Numeric overdraws reject the entire patch instead of silently deleting or creating negative stock. Semantic states such as `Waterskin | 1 | Full` still use `edit_item`.

## LLM integration

For normal foreground assistant generations, Inventory Block snapshots the current backend state and injects only a compact **read-only possession reference** at SillyTavern's final prompt-ready stage. The visible RP model is never asked to calculate inventory changes or emit machine controls, so inventory bookkeeping cannot compete with streamed prose or briefly flicker into the rendered response. The extension does not insert a fake chat message, does not participate in World Info scanning, and does not shift chat-depth positions.

After the assistant message is complete, Inventory Block runs one hidden `generateRaw` reconciliation pass. That minimal raw scan receives only the authoritative pre-response inventory plus the completed user/assistant event, returns either `NO_CHANGE` or one machine patch internally, and then the existing atomic backend validator commits the result. It does not rebuild a second full character/chat generation context. The visible assistant message is not rewritten or re-rendered by reconciliation. Continue/append scans receive only newly appended text so earlier purchases or consumption cannot be counted twice; Swipe/Regenerate reconcile the complete replacement response against their captured pre-response base revision.

Full replacement remains available only for an explicit bracketed OOC/admin inventory directive such as:

```text
[OOC: create category for each party member]
[Compact all food related items into 1 food item and remark the quantity in duration]
```

The hidden reconciler uses the existing machine protocol internally. Machine syntax is never appended to the visible RP response. The extension validates the complete hidden update atomically, applies it to backend state, and creates a revision; if nothing changed, the quiet scan returns `NO_CHANGE` and no revision is created.

Completed gains and losses of tracked finite resources are treated as Inventory changes. This includes money, food, water, ammunition, fuel, medicine, crafting supplies, charges, and ordinary possessions. Plain numeric Quantity values use `adjust_item`; single numeric balances stored in Remark use backend-enforced `adjust_resource`; semantic Remark states such as Full/Half full/Empty use `edit_item`. Approximate descriptions such as `About 7 days` remain approximate rather than being converted into invented exact units.

Only completed changes count. Planned, attempted, negotiated, interrupted, or failed actions do not spend or grant resources unless the response establishes that they actually happened. Durable containers can remain when empty, such as `Coin Pouch | 1 | 0 Gold` or `Waterskin | 1 | Empty`; exhausted rows that represent the consumable stock itself are removed instead of becoming ghost stock. Negative resource balances are forbidden, and related changes from the same event are emitted in one atomic patch.

Quiet/background and impersonation generations do not receive Inventory state and cannot mutate Inventory.

## History, comparison and retention

Each accepted state change creates a complete backend revision. History data never enters LLM context.

The History window can:

- **View** the complete read-only inventory at any retained revision;
- **Compare** any two retained revisions and show only changed, added, and removed inventory rows;
- compare a selected revision directly against the current revision;
- **Restore** an older revision as a new current revision without destroying the retained trail.

Under **Extensions → Inventory Block**, History retention can be set to **50, 100, 200, 500, or 768 revisions**. The default is **200**. The same count budget also bounds logical portable checkpoint groups stored on message/swipe metadata. In addition, separate **4 MiB safety ceilings** bound retained backend revision snapshots and portable checkpoint payloads, so unusually large inventories may retain fewer historical snapshots than the selected count while the current state remains protected. The selected value is an extension-wide cap; changing it immediately trims the active chat, while other chats use the new cap when they are next opened or changed. Old branch-head references are pruned with the same cap before revision compaction so retained branch/swipe metadata cannot silently exceed the selected history budget.

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
