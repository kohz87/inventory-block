# Inventory Block v0.6.7

Inventory Block is a lightweight SillyTavern RPG inventory extension built around **message-native full snapshots**.

Since v0.5 the runtime deliberately has no parallel inventory database. The **latest valid surviving `<Inventory>` snapshot in the selected chat/swipe is the authoritative state**.

```text
<Inventory>
Coin Pouch | 1 | 100 Gold
Food | 1 | About 7 days

[Equipped / Carried]
Travelling Coat | 1 | Worn
Utility Knife | 1 | Belt

[Wagon > Food]
Canned Rations | 12 | Crate, rear

[Lent to Companions > Astra]
Linen Smock | 1 | Worn
</Inventory>
```

## Sub-categories

Starting with v0.6.0, a section header may carry a sub-category path using `>`:

```text
[Wagon]
Wagon Cover | 1 | Patched, waxed

[Wagon > Food > Preserved]
Salt Pork | 3 | Barrel

[Wagon > Tools]
Tarp | 2 | Folded
```

- Every header states its **full path**; there is no indentation or nested bracket syntax. Parent levels exist implicitly, and a parent can also hold its own items through a plain `[Wagon]` header.
- Whitespace around `>` is canonicalized, so `[Wagon>Food]` and `[Wagon > Food]` are the same category. `/` is not a separator, so names such as `Equipped / Carried` are unaffected.
- Headers without `>` are ordinary top-level categories, so every pre-v0.6 snapshot stays valid unchanged.
- **Sub-category depth** (settings panel, 1–5, default 3) controls how many levels the UI shows and what the model is told to use. Deeper paths are never rejected: the extra levels are folded into the last visible level (`A › B › C › D` at depth 3 shows `C › D` as one node), and the stored header is left untouched.

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

## Hidden message transport

Starting with v0.5.2, generated snapshots are stored inside a marked HTML comment:

```text
<!-- INVENTORY_BLOCK_V05
<Inventory>
Coin Pouch | 1 | 100 Gold
...
</Inventory>
-->
```

The `<Inventory>` data is still physically present in `message.mes` and remains the source of truth, but SillyTavern does not render the HTML comment into narration. Plain v0.5.0/v0.5.1 snapshots remain fully readable; when Inventory encounters a plain snapshot in a received, edited, swiped, or rendered assistant message, it normalizes only that machine block into the hidden envelope and keeps the story text unchanged. Inventory's swipe and render listeners run before other extensions' listeners, so their decorations are applied after any re-render. The receive listener is a plain listener: SillyTavern's own reasoning auto-parse moves `<think>…</think>` out of the reply first, so a draft snapshot in the reasoning is never mistaken for the reply's. Receive also happens before SillyTavern's `CHARACTER_MESSAGE_RENDERED`, where extensions decorate. On edit it happens inside the awaited `MESSAGE_EDITED`, before SillyTavern renders the message itself, so no extra re-render is needed. Inventory does not emit `MESSAGE_UPDATED`: built-in Translate re-translates on it (and, with auto mode off, drops a manual translation) and Summarize reacts to it.

Cell text is escaped so it can never break the envelope: `\` and `|` (and `]` in headers) get a backslash, and so do `-->` (written `--\>`) and `<Inventory` / `</Inventory` look-alikes. Escapes are reversed on parse. If a model writes a raw `-->` inside its snapshot anyway, the block is re-written as one canonical envelope the next time the message is normalized.

Parsing rules:

- A header is a bracketed line whose only unescaped `]` is the final character, so an item such as `[Sealed] Letter | 1 |` stays an item while `[Food | Water]` stays a category. A whole row wrapped in brackets with two or more `|` (`[Spare Rope | 1 | coiled]`) is read as a row.
- A repeated header continues the earlier section.
- Markdown-table rows (`| Rope | 1 | coiled |`) are accepted; divider rows (`|---|---|`) and a `Name | Qty | …` header row are skipped. A trailing `|` is ignored, while extra `|` inside a row are kept as part of the remark.
- List markers in front of a row (`- `, `* `, `• `, `2. `) are not part of the item name. When an item's own name starts like a list marker, divider or header (`- Spare`, `2. Map`, `[Sealed] Letter`), it is saved with a leading backslash so it reads back unchanged. A `Name | Qty` header row is only skipped in markdown-table form (`| Name | Qty | … |`).
- Duplicate item names within one category still reject the snapshot, and the generation prompt says so.

Only a cut-off snapshot is treated as truncated: an unclosed `<!-- INVENTORY_BLOCK_V05` comment, or an `<Inventory>` tag alone on its line followed only by snapshot-shaped rows. The last row may be partial (`Coin Po`, of any length), but a last line that ends in sentence punctuation is prose and stays visible. Unpunctuated prose after an unclosed block cannot be told apart from a partial row. Prose that merely mentions `<inventory>` is never touched.

**Continue** after a cut-off reply: Inventory strips the partial snapshot from the Continue prompt, so the model normally continues the prose and writes a fresh block. The cut-off rows are then closed off in their own hidden comment, and the continued prose stays visible. If the model instead picks up exactly at the cut, wherever it fell (inside a row, inside `<Inventory>` or `</Inventory>`, or right after the closing tag), the `-->` that closed the cut-off part on receive is dropped and the halves rejoin into one snapshot.

## Generation

Before each foreground RP generation, Inventory Block:

1. resolves the correct current snapshot for the generation;
2. removes all historical Inventory transports/blocks from the **temporary model prompt only**;
3. injects exactly one authoritative current snapshot plus compact rules;
4. asks the same foreground generation to output one complete full Inventory snapshot in the hidden transport envelope.

Stored chat messages are never stripped for prompt hygiene. Old snapshots stay in SillyTavern history for natural deletion/swipe rollback, while the model sees only the current snapshot.

- **Which prompt is the reply's:** every reply registers a placeholder through SillyTavern's extension prompt (`IN_PROMPT`). SillyTavern adds extension prompts only to prompts it builds for a generation, never to raw generations by other extensions, so the prompt carrying the placeholder is the reply's. Quiet or impersonate generations started before it carry it too and are counted. If a setup never shows the placeholder (for example SillyTavern drops extension prompts because the Prompt Manager has no main prompt), prompts built after Inventory's generate interceptor runs still get the context. The settings panel shows whether the last reply's prompt got the context.
- **Chat completion:** the placeholder is removed and the context is inserted as a system message after the leading system messages. Snapshots are stripped from assistant messages. User and system content (messages, character card, World Info) only loses Inventory's own hidden envelopes, plus copies of chat-history snapshots that a preset embedded there, so a block a person wrote reaches the model untouched.
- **Text completion:** the placeholder lands inside the instruct template's story string, and the real context replaces it there rather than going in front of the prompt. SillyTavern runs macro substitution over extension prompts, so the reserved copy is defused, and the real context replaces it at prompt-ready. Item text such as `{{user}}` or `<USER>` therefore reaches the model verbatim. The extension prompt is withdrawn right after, so later quiet prompts do not inherit it. A combined text prompt has no roles, so every snapshot in it is stripped.
- **Background prompts** (quiet, impersonate, other extensions' raw generations, including ones that fire while a reply is pending) receive no Inventory instructions, and all historical snapshots except the newest are removed from them.

The model is instructed to preserve every unchanged item/category, apply only completed changes, keep uncertain values unchanged, and never emit patches or deltas.

There is no `generateRaw` reconciliation pass and no `INVENTORY_BLOCK_UPDATE` protocol (removed in v0.5).

## Manual editing

**Edit Inventory** opens the current full `<Inventory>` block as plain text. Saving writes the complete snapshot into the latest assistant message/current swipe inside the hidden transport envelope and saves the SillyTavern chat.

Starting with v0.5.3, an Inventory-only edit does **not** rebuild the assistant message DOM. The hidden raw snapshot and active swipe are updated and persisted directly, then only Inventory's own pane is refreshed. Existing Megumin Suite tabs, NPC State UI, reasoning blocks, regex-rendered content, and other extension-owned rendering on that message are therefore left intact.

Because future prompt construction removes every historical snapshot and injects only the newest valid one, older messages cannot reset a manual edit merely because they contain old Inventory values.

## Regenerate, Swipe, Continue, Delete

- **Normal / Continue:** use the latest valid snapshot currently present in the selected chat.
- **Regenerate / Swipe:** use the latest valid snapshot before the assistant response being replaced. When the chat ends with your own message (for example after a failed reply), nothing is replaced and the latest snapshot is used.
- **Delete latest message:** exposes the previous surviving snapshot.
- **Delete an older causal message while newer snapshots survive:** the newest surviving snapshot remains authoritative. Inventory intentionally does not replay downstream history.
- **Malformed/omitted new snapshot:** previous valid snapshot remains current.

## UI

Inventory Block renders the current snapshot as a native tab inside an existing Megumin Suite `.meg-blocks` card whenever that host is available. If Inventory mounts before Megumin finishes rendering, it automatically migrates the temporary standalone card into the native Megumin tab/panel once the host becomes complete.

A compatible Megumin host is considered ready only after both its tab strip and panel container exist. If no Megumin host is present, Inventory uses a standalone fallback card.

The pane adapts to its **own width** (CSS container queries), since the message column width varies with SillyTavern's panels and settings:

- **Wide (≥ 760px):** a resizable category tree on the left and the selected branch on the right. Selecting a parent shows every item beneath it, grouped by sub-category. Arrow keys navigate the tree.
- **Narrower (< 760px, tablet and phone):** drill-down lists. The header shows a back button and a breadcrumb (middle levels collapse to `…`), sibling categories appear as a scrollable chip row, and each level lists its sub-categories followed by its own items. Below 480px, remarks move under the item name.
- **Filter** searches every item across the whole tree (name, quantity, remark and path) and lists matches with their location.
- **Δ changes** compares the current snapshot with the previous surviving one and lists added, changed, moved and removed items. When the newest reply carried no snapshot, the strip is labelled "earlier reply". Changed items get a coloured edge, changed categories get a dot, and each change links to its category.
- Item names and remarks always wrap; only category labels are clamped to two lines, with the full path on hover.

Selection, expanded tree nodes and the open state of the changes strip are remembered per chat while the extension is running.

The extension menu and settings panel provide:

- Edit Inventory
- Copy Current Block
- Refresh / Rescan — re-reads the chat, hides any raw `<Inventory>` block still visible in narration, clears a generation session that never reported back, and reports which message the current snapshot comes from (warning when a newer block is malformed or truncated)
- Sub-category depth

There is no backend revision-history UI because SillyTavern messages/swipes are the history.

## Legacy archive

The complete final pre-rewrite v0.4.3 codebase (source, tests, docs, workflow and release metadata) lived in `legacy/v0.4.3/` until v0.6.2. It was removed from the installed extension in v0.6.3 and remains in git history at commit [`1170298`](https://github.com/kohz87/inventory-block/tree/1170298720e055dc06e02748f73d33eadd606480/legacy/v0.4.3).