# Changelog

## 0.6.7

Inventory context not injected.

- **Fixes the reply's prompt getting no inventory context.** Since v0.6.4, chat completion injected into the *first* prompt built after a reply started. A raw chat-completion call that another extension makes in that window took the context instead, and the reply got nothing. Examples: a planning or tracker pass from its `GENERATION_AFTER_COMMANDS` handler or generate interceptor, by an extension loaded after Inventory. The reply's prompt is now recognised by a placeholder registered through SillyTavern's extension prompt, for chat completion as well as text completion. SillyTavern adds extension prompts only to prompts it builds for a generation, never to raw generations.
- **Chat completion places the placeholder in-chat** (depth 0, system role). SillyTavern inserts in-prompt extension prompts next to the Main Prompt and silently drops them when a preset disables it, which many community presets do. In-chat extension prompts are always inserted. The placeholder is removed at prompt-ready; if it shares a message with another extension's in-chat prompt, only its own part is removed. Text completion keeps it in the story string.
- Fallback for setups where the placeholder never shows (no extension-prompt API, or a prompt layout that drops it): prompts built after Inventory's generate interceptor runs still get the context, as before v0.6.4.
- The settings panel now shows whether the last reply's prompt got the inventory context (item count, how it was found, which API), or warns that none of its prompts carried the placeholder. The same line is logged to the console.
- Tests: a runtime regression for a raw call by an extension loaded after Inventory (it fails on v0.6.6), the no-extension-prompt fallback, an in-chat placeholder that shares its message with another extension's prompt, and the status line. Reply prompts in the runtime tests are now built as SillyTavern builds them for a preset with Main Prompt disabled.

## 0.6.6

Fourth audit pass.

- **Reasoning is parsed before Inventory checks a reply.** v0.6.5 registered the `MESSAGE_RECEIVED` listener with `makeFirst`, which also put it ahead of SillyTavern's own reasoning auto-parse. A draft snapshot inside `<think>` then counted as the reply's, so a reply that omitted its snapshot raised no warning, and the draft was rewritten inside the stored reasoning. Receive is a plain listener again; swipe and render keep `makeFirst`.
- **Continue that picks up exactly at the cut** now recovers the snapshot wherever the cut fell: inside a row, inside `<Inventory>` or `</Inventory>`, or right after the closing tag. A hidden cut-off envelope directly followed by glued text has its receive-time closer dropped so the halves rejoin, and a duplicate `-->` after a complete envelope is removed. Previously a cut inside a tag lost the snapshot and left fragments such as `tory>` in the narration.
- Corrected the docs: Inventory strips the partial snapshot from the Continue prompt, so the model normally writes a fresh block; picking up at the cut is the rarer path.
- Tests: `tests/v066-audit.test.js` covers six cut positions. A runtime test with a core reasoning listener registered before Inventory checks the receive order.

## 0.6.5

Third audit pass.

- **Continue that finishes a cut-off row** no longer loses the turn's snapshot. The `-->` that closes a cut-off snapshot on receive used to end up inside the block once Continue finished the same row, so the block failed to parse. A body that only parses without that closer now drops it; a real `-->` in a cell is always escaped and cannot be confused with it. This bug dates back to v0.5.2.
- **Text completion no longer runs item text through macro substitution.** SillyTavern substitutes macros in extension prompts, so `{{user}}`, `<USER>` or `{{roll:1d6}}` in item text were rewritten and then written back by the model. The extension prompt now carries a defused copy that only reserves the place; the real context replaces it at prompt-ready.
- **Names that look like list markers, dividers, headers or a table header** (`- Spare`, `2. Map`, `---`, `[Sealed] Letter`, a `Name | Qty` item) now round-trip unchanged: they are saved with a leading backslash, and the header-row skip only applies to markdown-table rows.
- **A quiet or impersonate generation started before the reply's own prompt** (for example from another extension's handler) is counted, so its prompt no longer takes the reply's instructions.
- **Receive, swipe and render listeners run first** (`makeFirst`), so a re-render by Inventory no longer wipes decorations added by extensions loaded earlier.
- **Cut-off detection:** a partial last row of any length counts, including one ending in `)`; a last line ending in sentence punctuation (ignoring closing quotes and brackets) is prose.
- **Chat completion removes chat-history snapshot copies** that presets embed in user/system content, while still keeping blocks a person wrote there.
- Tests: `tests/ui.test.js` renders the pane against a fake DOM in CI (tree, change strip, selection, filter, empty states). The runtime test covers both Continue flows, macro-safe context, the quiet-generation count, listener order and embedded history copies. `tests/v065-audit.test.js` adds a regression test per fix.

## 0.6.4

Second audit pass.

- **Continue after a cut-off snapshot** no longer hides the continued prose or loses the new snapshot. A block can no longer span another `<Inventory>` opening tag, and cut-off rows followed by more text are closed off in their own hidden comment (idempotently). Prompt stripping keeps the continued prose.
- **No more `MESSAGE_UPDATED`.** v0.6.3 emitted it after re-rendering a normalized message, which made built-in Translate re-translate (and, with auto mode off, drop a manual translation) and Summarize react. On receive it was redundant with `CHARACTER_MESSAGE_RENDERED`. Edits are now normalized inside the awaited `MESSAGE_EDITED`, before SillyTavern renders the message and emits `MESSAGE_UPDATED` itself, so no extra re-render happens.
- **Only the foreground prompt gets Inventory instructions.** Raw or quiet generations by other extensions while a reply is pending were treated as foreground. Text completion now recognises the foreground prompt by the context SillyTavern placed into it and withdraws the extension prompt right after. Chat completion injects into the first prompt after the generation starts. Everything else is treated as a background prompt.
- **Markdown-table rows** (`| Rope | 1 | coiled |`) are accepted; divider and `Name | Qty` header rows are skipped.
- A **trailing `|`** no longer ends up in the remark.
- A **whole row wrapped in brackets** with two or more `|` is read as a row instead of an empty category.
- **List markers** (`- `, `* `, `• `, `2. `) are not part of item names.
- **Finished prose** after an unclosed block is no longer hidden; only a partial last row counts as cut off.
- The prompt **explains the backslash escapes** shown in the current snapshot.
- **Chat completion keeps blocks a person wrote** into user and system content (messages, character card, World Info); only assistant messages are stripped fully.
- Removed the unused `startedAt` and `type` session fields.
- Tests: runtime coverage for the background-prompt rules, the edit path, the watchdog (mock timers) and Rescan; `tests/v064-audit.test.js` adds a regression test per fix.

## 0.6.3

Audit fixes: data-loss bugs, prompt hygiene, cleanup.

Data loss and corruption:
- **Regenerate after a failed reply** no longer rolls Inventory back one turn. Regenerate/Swipe now exclude the final message only when it is an assistant reply.
- **Prose mentioning `<inventory>`** is no longer treated as a cut-off snapshot. Previously the rest of that prompt text was deleted before sending, and the rest of a received reply was hidden in the transport comment. Truncation now requires an unclosed envelope or a tag alone on its line followed by snapshot-shaped rows.
- **`-->` inside item text** can no longer break the hidden envelope. The formatter escapes it (`--\>`, reversed on parse), along with `<Inventory`/`</Inventory` look-alikes. A raw `-->` written by the model is repaired into one canonical envelope (idempotently, instead of adding a wrapper on every pass), and prompt stripping no longer leaves fragments behind.
- **Bracketed item rows** such as `[Sealed] Letter | 1 |` stay items. A header is now a bracketed line whose only unescaped `]` is the last character, so existing headers like `[Food | Water]` still parse as categories.
- **Category names containing `]`** no longer gain a backslash on every save. Headers now escape `\`, `|` and `]`, and the parser unescapes them; headers written by earlier versions read back correctly.

Rules and prompts:
- Repeated category headers merge into one section instead of invalidating the snapshot, and extra `|` in a row stays in the remark. Duplicate item names within a category are still rejected, and the generation prompt now states every constraint the parser enforces.
- Background prompts (quiet, impersonate, other extensions) no longer carry every historical hidden snapshot: all but the newest are removed, and no Inventory instructions are added.
- Text-completion APIs receive the Inventory context through SillyTavern's extension prompt (`IN_PROMPT`), inside the instruct template, instead of in front of the whole combined prompt. Chat completion is unchanged.
- Look-alike tags such as `<Inventory-notes>` are no longer parsed as Inventory blocks.

Runtime and UI:
- Re-rendering a normalized message now emits `MESSAGE_UPDATED`, as SillyTavern's own edit flow does, so Megumin Suite and other extensions can restore their message UI (affects receive, swipe/edit normalization and Rescan).
- Generation detection prefers SillyTavern's `body[data-generating]` flag, falling back to the Stop button.
- Pending-session lifetime is owned by the watchdog alone; the separate 2-minute expiry, which ignored running generations, is gone.
- The changes strip is labelled "earlier reply" when the newest reply carried no snapshot.
- A refresh no longer steals focus and caret from the filter box.
- → on an expanded tree node moves to its first child.
- The editor no longer falls back to a single-line `window.prompt` that could not hold a multi-line block.

Cleanup:
- CI's diff check now checks the PR/push range; the old bare `git diff --check` on a clean checkout never found anything.
- Removed dead code: `INVENTORY_TAG`, `findNode`, the unused `stripTrailingTruncated` option, non-existent generation types (`raw`, `background`, `dryrun`, `dry-run`), the unreachable `first_message` baseline branch, and `hideRawInventoryElements()`, which duplicated a CSS rule.
- Removed `legacy/v0.4.3/` (49 files) from the installed extension; it stays in git history (see README).
- Replaced stale "v0.5" labels in logs, README and test names.
- Added `tests/runtime.test.js`, which drives the real `index.js` event flow against a fake SillyTavern, and `tests/v063-audit.test.js` with a regression test per fix. `tests/index-static.test.js` (source regexes) is superseded by the runtime test.

## 0.6.2

Refresh / Rescan hotfix.

- Fixes **Refresh / Rescan** silently doing nothing after a generation that never reported back (API error, or an abort without an end event). That left the session pending, kept Inventory suspended and froze the pane until the next generation. Rescan now clears such a stale session, and declines with a notice only while SillyTavern is visibly still generating.
- Adds a watchdog so a pending generation session clears itself after two minutes once SillyTavern is no longer generating, even without a manual rescan.
- Rescan now actually rescans: raw `<Inventory>` blocks still visible in narration are moved into the hidden transport (one chat save for the whole rescan).
- Rescan reports its result: which message the current snapshot comes from and how many items it holds, with a warning when a newer message carries a malformed or truncated block.

## 0.6.1

Inventory pane scrolling hotfix.

- Fixes long lists being clipped in the wide (tree) layout with no way to scroll: the height cap now sits on the tree and item columns, which scroll independently, instead of on the grid that clipped them.
- Removes overscroll containment so wheel and touch scrolling continue into the chat once a list reaches its end, instead of trapping page scrolling while the pointer is over Inventory.

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