# Changelog

## 0.6.0

Sub-categories and a responsive Inventory browser.

- Adds sub-category paths in section headers, e.g. `[Wagon > Food > Preserved]`. Headers without `>` behave exactly as before, so existing snapshots stay valid.
- Canonicalizes whitespace around `>` so spacing variants resolve to the same category.
- Adds a **Sub-category depth** setting (1–5, default 3). Deeper paths are folded into the last visible level instead of being rejected; stored headers are never rewritten.
- The generation prompt now explains full-path headers and the configured depth limit.
- Replaces the flat collapsible category list with a width-aware browser built on container queries: a category tree with grouped item lists at ≥ 760px, drill-down lists with breadcrumb, back button and sibling chips below that.
- Adds a whole-tree item filter that shows each match's location.
- Adds a change strip comparing the current snapshot with the previous surviving snapshot (added, changed, moved, removed), with matching markers in the tree and item rows.
- Edit and Copy move into compact header icon buttons; the quantity column stays aligned across rows, and long names and remarks wrap instead of truncating.

## 0.5.3

Inventory editor rendering-isolation hotfix.

- Fixes Inventory's own **Edit Inventory** action rebuilding the entire assistant message DOM after changing only hidden Inventory state.
- Manual Inventory saves now update `message.mes`, synchronize the active swipe, and persist the SillyTavern chat without calling `updateMessageBlock()`.
- Refreshes only Inventory's own Megumin pane after a manual save, preserving Megumin Suite, NPC State, reasoning, regex-rendered content, and other extension-owned DOM attached to the message.
- Keeps full-message rerendering available for transport normalization, where a newly generated/plain visible `<Inventory>` block actually needs to disappear from narration.
- Does not change the v0.5 message-native snapshot source of truth, hidden transport format, deletion/swipe behavior, prompt filtering, or category UI.

## 0.5.2

Narration-hiding and category interaction hotfix.

- Stores canonical message-native Inventory snapshots inside a marked HTML-comment envelope so the raw `<Inventory>` source remains in SillyTavern history without leaking into rendered narration.
- Normalizes plain v0.5.0/v0.5.1 or weak-model `<Inventory>` output into the hidden envelope after receipt and when edited/swiped/rendered messages are encountered.
- Keeps plain historical snapshots fully readable by the parser; the transport change does not introduce a backend migration or second state store.
- Removes the complete Inventory-owned transport from temporary generation prompts while preserving foreign extension payloads.
- Restores per-category expand/collapse with native `<details>/<summary>` controls and remembers open sections per chat.
- Handles truncated hidden snapshots atomically during later manual replacement so an unterminated comment cannot be left behind.
- Keeps v0.5.1 Megumin tab migration and the v0.5 message-native source-of-truth semantics unchanged.

## 0.5.1

Megumin tab-host integration hotfix.

- Restores host-aware mount deduplication from the mature pre-rewrite bridge without reintroducing any legacy Inventory state machinery.
- Fixes the case where Inventory mounts as a standalone card before Megumin Suite finishes rendering, then never migrates into the later `.meg-blocks` tab host.
- Treats a Megumin host as ready only when both `.meg-blocks-tabs` and `.meg-blocks-panel` exist.
- A standalone Inventory mount is now considered stale as soon as a complete Megumin host becomes available, so it is removed and replaced by the native Inventory tab/pane.
- Restores native Megumin tab activation/collapse coordination and deactivates Inventory when another Megumin tab is selected.
- Restores observer retry when the chat DOM is not ready yet.
- Adds regression coverage for partial hosts, standalone-before-Megumin timing, and stable native-tab mounts.
- Keeps the v0.5 message-native snapshot source of truth, prompt filtering, manual editing, and generation behavior unchanged.

## 0.5.0

Clean message-native rewrite.

- Removes the v0.4.x canonical backend, revision graph, branch heads, durable revisions, portable checkpoints, patch protocol, and post-response reconciliation machinery from the active runtime.
- Makes the latest valid surviving `<Inventory>...</Inventory>` snapshot in the selected SillyTavern chat/swipe the sole source of truth.
- Keeps every generated Inventory snapshot in raw message text. Deletion and swipe behavior therefore follows SillyTavern's own message history instead of a parallel state graph.
- A malformed newer snapshot never replaces a previous valid snapshot.
- Before generation, all historical Inventory blocks are removed from the temporary model prompt and exactly one current authoritative snapshot is injected.
- The foreground model outputs one complete full-state Inventory snapshot on every response. There are no patch operations and no automatic second LLM request.
- Manual editing writes a full Inventory snapshot directly into the latest assistant message/current swipe and saves the chat.
- Regenerate/Swipe generation baselines use the latest valid snapshot before the assistant response being replaced.
- Preserves foreign extension payloads during prompt filtering and does not claim an absolute machine-output tail position.
- The complete v0.4.3 implementation and its earlier history are preserved under `legacy/v0.4.3/` and are not loaded by v0.5.