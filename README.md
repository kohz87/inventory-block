# Inventory Block v0.4.0

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

Inventory Block v0.4.0 uses a **one-pass foreground accounting architecture**. At SillyTavern's final prompt-ready stage, the extension injects the current canonical Inventory JSON plus the compact validated patch protocol into the same assistant generation that writes the RP response. The model writes the visible story first and, only when that response establishes completed possession/resource changes, emits one hidden `INVENTORY_BLOCK_UPDATE` machine control as the final output.

When generation is complete, Inventory Block does **not** start another model session. It parses that foreground control, validates the complete patch atomically, commits the resulting canonical backend revision, attaches branch/swipe metadata, and strips the machine control from the stored/displayed assistant message. The temporary Inventory prompt is never added to chat history, and the machine control is transport rather than storage. Future prompts receive only the latest canonical backend state.

If the foreground response emits no Inventory control, Inventory remains unchanged. If a model forgets or mangles a required update, **Reconcile Latest Response** (or `/inventory-reconcile`) remains available as an explicit recovery action; only that manual fallback uses the separate `generateRaw` scanner. Normal RP turns therefore require one LLM request rather than a story request plus an automatic reconciliation request.

Full replacement remains available only for an explicit bracketed OOC/admin inventory directive such as:

```text
[OOC: create category for each party member]
[Compact all food related items into 1 food item and remark the quantity in duration]
```

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

The same controls plus retention/cleanup settings are available under **Extensions → Inventory Block**. The settings UI includes **Reconcile Latest Response** as an explicit fallback when a foreground response omitted or failed its Inventory control; successfully manual-reconciled text is stamped and will not be charged twice. The same recovery action is available as `/inventory-reconcile` (alias `/inv-reconcile`). No search, encumbrance, rarity, equipment-slot, or other heavyweight subsystem is added.

## Installation

Install as a third-party SillyTavern extension from:

```text
https://github.com/kohz87/inventory-block
```

Then reload SillyTavern.

## State ownership

Inventory Block should be the authoritative exact possession/resource tracker. Lorebooks, memory systems, World State, and NPC trackers should not duplicate exact inventory quantities as competing state.
