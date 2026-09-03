# Changelog

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