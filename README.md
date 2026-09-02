# Inventory Block v0.2.8

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

For resource containers such as `Coin Pouch | 1 | 100 Gold`, the item quantity is the number of pouches while the spendable balance lives in Remark. v0.2.8 explicitly instructs the model to update that Remark whenever a transaction completes, while preserving the container quantity. A 15 Gold purchase therefore changes `100 Gold` to `85 Gold`, not the pouch quantity from `1` to `0`.

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

Completed purchases, payments, fees, tips, sales, rewards, refunds, theft, and other currency changes are treated as Inventory changes. When money is stored in Remark, the existing `edit_item` operation rewrites the calculated balance. A zero balance keeps the container item; negative balances are forbidden, and item changes from the same transaction are emitted in the same atomic patch.

Quiet/background and impersonation generations do not receive Inventory state and cannot mutate Inventory.

## Branch, swipe, regenerate and deletion recovery

Accepted state changes use complete backend revisions. State-changing messages also carry compact portable checkpoints in message metadata so SillyTavern Branch/Checkpoint chats can reconstruct Inventory even when chat-level metadata is not copied.

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
- revision History.

The same controls are available under **Extensions → Inventory Block**. No search, encumbrance, rarity, equipment-slot, or other heavyweight subsystem is added.

## Installation

Install as a third-party SillyTavern extension from:

```text
https://github.com/kohz87/inventory-block
```

Then reload SillyTavern.

## State ownership

Inventory Block should be the authoritative exact possession/resource tracker. Lorebooks, memory systems, World State, and NPC trackers should not duplicate exact inventory quantities as competing state.
