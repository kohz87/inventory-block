# Inventory Block v0.5.0

Inventory Block is a lightweight SillyTavern RPG inventory extension built around **message-native full snapshots**.

The active v0.5 runtime deliberately has no parallel inventory database. The **latest valid surviving `<Inventory>` snapshot in the selected chat/swipe is the authoritative state**.

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

## Why v0.5 is different

The v0.4.x line kept canonical Inventory state in chat metadata and reconstructed it through revision ancestry, branch heads, portable checkpoints, durable fallbacks, swipe metadata, and deletion recovery. That architecture could disagree with the actual surviving chat after destructive timeline edits.

v0.5 removes that second reality.

```text
selected SillyTavern messages/swipe
        ↓
scan backward
        ↓
latest valid <Inventory>
        ↓
current Inventory
```

If the latest message is deleted, the previous surviving snapshot naturally becomes current. If a newer generated snapshot is malformed, it is ignored and the previous valid snapshot remains current instead of resetting to an empty backend revision.

## Generation

Before each foreground RP generation, Inventory Block:

1. resolves the correct current snapshot for the generation;
2. removes all historical `<Inventory>` blocks from the **temporary model prompt only**;
3. injects exactly one authoritative current snapshot plus compact rules;
4. asks the same foreground generation to output one complete full Inventory snapshot.

Stored chat messages are never stripped for prompt hygiene. Old snapshots stay in SillyTavern history for natural deletion/swipe rollback, while the model sees only the current snapshot.

The model is instructed to preserve every unchanged item/category, apply only completed changes, keep uncertain values unchanged, and never emit patches or deltas.

There is no `generateRaw` reconciliation pass and no `INVENTORY_BLOCK_UPDATE` protocol in v0.5.

## Manual editing

**Edit Inventory** opens the current full block as plain text. Saving writes the complete snapshot directly into the latest assistant message/current swipe and saves the SillyTavern chat.

Because future prompt construction removes every historical snapshot and injects only the newest valid one, older messages cannot reset a manual edit merely because they contain old Inventory values.

## Regenerate, Swipe, Continue, Delete

- **Normal / Continue:** use the latest valid snapshot currently present in the selected chat.
- **Regenerate / Swipe:** use the latest valid snapshot before the assistant response being replaced.
- **Delete latest message:** exposes the previous surviving snapshot.
- **Delete an older causal message while newer snapshots survive:** the newest surviving snapshot remains authoritative. v0.5 intentionally does not replay downstream history.
- **Malformed/omitted new snapshot:** previous valid snapshot remains current.

## UI

Inventory Block renders the current snapshot in a Megumin-style tab when a compatible Megumin block host exists, with a simple standalone fallback. Raw `<Inventory>` custom elements are hidden in rendered story text but remain untouched in `message.mes`.

The extension menu and settings panel provide:

- Edit Inventory
- Copy Current Block
- Refresh / Rescan

There is no backend revision-history UI in v0.5 because SillyTavern messages/swipes are the history.

## Legacy archive

The complete final pre-rewrite codebase is preserved at:

```text
legacy/v0.4.3/
```

It includes the old source, tests, docs, workflow, and release metadata. Legacy modules are not imported by the v0.5 runtime.
