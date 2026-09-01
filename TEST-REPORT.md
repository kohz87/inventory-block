# Inventory Block v0.2.3 Hard-Pass Test Report

Date: 2026-09-02

## Scope

v0.2.3 was reviewed as a release candidate against both Inventory Block's own state/protocol code and the current SillyTavern release generation lifecycle. The pass covered:

- foreground/background prompt isolation;
- SillyTavern generation interceptor and prompt-ready ordering;
- streaming/end-event ordering;
- no-control prose preservation;
- hidden control truncation, embedded terminators, and sentence trimming;
- first-message/group seed parsing and round-trip safety;
- strict patch operand validation;
- manual editor/history concurrency;
- swipe, regenerate, continue, deletion, and branch recovery;
- portable metadata checkpoints after revision compaction;
- bounded backend revision/branch-head storage;
- metadata-less branch hydration performance;
- Extensions settings mounting and action wiring;
- Megumin/standalone ownership boundaries.

## Implementation pass

The original v0.2.2 findings were addressed before the first hard pass:

- unrelated assistant prose is no longer normalized or rewritten when Inventory has nothing to strip;
- machine comments end in a required period so SillyTavern's Trim Incomplete Sentences cannot cut the closing `-->`;
- malformed/truncated machine suffixes are stripped atomically and cannot leak JSON into visible story text;
- literal `-->` inside JSON is handled without prematurely terminating the parser;
- prompt values escape XML delimiters, macro braces, ampersands, category brackets, and pipe delimiters;
- patch names/numeric adjustments reject JavaScript-coercible arrays, objects, and booleans;
- the v2 seed parser uses only `[Category]` plus `Name | Quantity | Remark` and no longer guesses Markdown/legacy headers;
- seed serialization safely round-trips reserved Inventory delimiters and escapes;
- multiple fresh group greetings can merge non-conflicting seeds;
- assistant manual checkpoints gain stable UIDs;
- lineage data is prepared once during branch hydration/resolution;
- backend revisions and History output are bounded;
- generation transactions include causal timeline-prefix guards;
- broad recent-generation matching and background-depth bookkeeping were removed;
- settings UI was moved into testable DOM helpers;
- export/version residue was corrected.

## Hard pass 1

The first adversarial review found additional issues in the intermediate implementation:

1. A global live `setExtensionPrompt` could still leak Inventory into a truly overlapping quiet/background request.
2. A damaged metadata root with excessive branch heads could cause the revision keep-set to exceed the intended cap.
3. Prompt category brackets were still structurally ambiguous inside `[Category]` rendering.
4. Manual seed `\\uXXXX` text was over-decoded even when it was not one of the extension's reserved angle-bracket escapes.
5. A generation-local prompt slot needed to reserve realistic prompt budget rather than replacing a tiny marker with a much larger Inventory prompt after truncation.
6. Prompt slots should survive chat switches / delayed prompt-ready delivery long enough to finish an already in-flight request.

### Corrective pass

- Registered `inventoryBlockGenerationInterceptor` through the extension manifest.
- Live generations now receive an opaque generation-local slot inserted into SillyTavern's private working chat; quiet/impersonate generations receive no slot.
- The slot carries an opaque base64 reservation proportional to the final Inventory prompt and is replaced only in that generation's final prompt-ready payload.
- The slot is inserted before the final conversational message, preserving normal/swipe/continue tail semantics.
- The synthetic slot matches SillyTavern's narrator/system extension-message shape.
- Prompt slots are keyed independently, tolerate overlapping unrelated prompt events, and are retained across chat switches until replaced or aged out.
- Dry-run accounting uses a prompt-ready-only injection rather than a global live extension prompt.
- `ensureRoot` now prunes branch heads before revision compaction.
- Old pruned revisions are rematerialized from portable checkpoints when an older timeline becomes active.
- Category brackets are escaped in injected state.
- Seed unescaping decodes only the extension-reserved `\\u003C` / `\\u003E`; unknown manual escapes remain literal.

## Hard pass 2

The final tree was rerun through deterministic tests, fuzz, syntax checks, release-version parity checks, and static scans.

### Deterministic suite

**38/38 passed.**

Coverage includes:

- generation-local prompt slot placement/replacement;
- text-completion and chat-completion prompt-ready payloads;
- dry-run-only accounting injection;
- manifest interceptor registration;
- release CSS version-banner parity;
- background/replacement/continuation classification;
- timeline guard length selection;
- broad OOC detection;
- byte-for-byte no-control prose preservation;
- control terminal punctuation and atomic stripping;
- embedded comment terminators;
- malformed/trailing control rejection;
- prompt escaping;
- strict seed grammar and reserved escape handling;
- group seed merge/collision behavior;
- strict patch operands and replace capability gating;
- real DOM helper mounting/action wiring;
- state validation/version failure behavior;
- assistant/user lineage editing rules;
- metadata-less portable recovery;
- middle-message deletion rollback;
- revision hard cap;
- damaged branch-head pruning;
- recovery of a compacted old revision from its portable checkpoint.

### Adversarial/fuzz checks

- **2,000** seed serializer/parser round-trips passed with pipes, slashes, brackets, `<`, `>`, `<Inventory>`, `</Inventory>`, `-->`, macro braces, literal unicode escapes, and formerly ambiguous header-like item names.
- **1,000** hidden-control cases with embedded `-->` passed without machine-text leakage.
- **500** hostile prompt-state escaping cases passed.
- **1,000** generation-local prompt-slot isolation/replacement cases passed across text- and chat-completion-shaped payloads.
- A metadata-less **4,000-message** branch with periodic portable checkpoints hydrated in roughly **10-12 ms** in the review container (the prior quadratic path was about 1.6 seconds in the earlier adversarial probe).

### Static/release checks

- `npm run check` passes for `index.js` and every runtime source module.
- Runtime/test source contains no `recentGeneration`, `backgroundGenerationDepth`, `tidyMessage`, legacy seed-header helpers, `Number(op.by)` coercion, or live `setExtensionPrompt` path.
- `src/constants.js`, `package.json`, `manifest.json`, and the CSS release banner all report **0.2.3**.
- Manifest registers `generate_interceptor: "inventoryBlockGenerationInterceptor"`.
- No `GENERATION_ENDED` listener is used to commit or consume Inventory transactions.

## SillyTavern release-source cross-check

Current SillyTavern release source was checked during the pass:

- `GENERATION_AFTER_COMMANDS` runs after slash-command cancellation checks and before prompt assembly;
- extension `generate_interceptor` callbacks receive the working chat and generation type;
- normal generate interceptors are skipped for dry runs;
- text completion exposes `GENERATE_AFTER_COMBINE_PROMPTS` with mutable final prompt data;
- chat completion exposes `CHAT_COMPLETION_PROMPT_READY` with mutable final chat data;
- streaming can finish/unblock and emit terminal events before Inventory receives the final assistant `MESSAGE_RECEIVED`;
- stopping can produce both end/stop terminal events;
- `syncMesToSwipe` copies active message extras into swipe metadata.

The v0.2.3 transaction therefore commits on the assistant message event, not on terminal generation events, while prompt injection is generation-local through the interceptor/final-prompt slot.

## Final result

No remaining reproducible state-corruption or machine-text-leak defect was found in the second hard pass.

A live smoke test in the user's exact SillyTavern + Megumin Suite Beta build is still worthwhile for browser-only visual timing (tab mounting, drawer animation, streaming repaint), because Node tests cannot reproduce every DOM scheduler detail.

### Intentional storage tradeoff

The chat-level backend revision table is bounded. Portable full-state checkpoints remain attached to **state-changing messages** because exact SillyTavern metadata-less Branch/Checkpoint recovery requires state to travel with the branch. Their total storage therefore grows with the number of actual inventory-changing messages; this is intentional and consumes no LLM context tokens.
