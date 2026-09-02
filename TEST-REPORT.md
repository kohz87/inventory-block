# Inventory Block v0.2.5 Hotfix Report

Date: 2026-09-02

## v0.2.5 Megumin control-position hotfix

The Inventory machine control no longer has to be the final non-whitespace bytes of an assistant reply. Exactly one complete control with the mandatory terminal period may appear before or after other Megumin/structured blocks. The parser removes only the Inventory control span and preserves all surrounding prose/blocks.

## Scope

v0.2.4 was reviewed against Inventory Block state/protocol behavior and current SillyTavern release ordering:

`GENERATION_AFTER_COMMANDS → user append → generate interceptor → World Info/depth/prompt construction → final prompt-ready → MESSAGE_RECEIVED`.

The pass specifically targeted cross-chat concurrency, quiet/background isolation, no-WI prompt injection, causal timeline guards, machine-control failure safety, strict seed parsing, branch portability, and long-session metadata behavior.

## Implementation pass

The v0.2.3 synthetic prompt-slot architecture was removed. The generate interceptor now binds a prepared state snapshot to the actual foreground generation and records the post-send timeline/probe, but **does not mutate the working chat**. Inventory is injected only into the final text/chat-completion request.

Other changes include lossless JSON InventoryState, stricter replacement authorization, prose-preserving rejected controls, deterministic identity keys, compact portable checkpoints, strict seeds, bounded dry-run/session state, and existing multi-greeting seed recovery.

## Hard pass 1 findings and corrective pass

The first hard pass found additional edge cases in the intermediate v0.2.4 implementation:

1. Reserving prompt budget by pre-removing old working-chat messages still changed the World Info scan even though it removed the fake prompt message.
2. Prompt-ready overflow trimming could break chat-completion tool-call chains if arbitrary history entries were removed.
3. Truncated controls with following prose needed a safer recovery boundary.
4. Replacement authorization still needed to distinguish bracketed narrative prose from a bracketed admin command.
5. A single-session implementation was not sufficient to prove cross-chat overlap safety.
6. Existing group greetings needed a load-time seed path when their MESSAGE_RECEIVED events occurred before extension registration.

Corrections:

- the interceptor no longer mutates working chat at all;
- final prompt injection fails closed on context overflow rather than pruning tool/conversation messages;
- truncated machine spans use JSON/paragraph boundaries where recoverable;
- non-OOC bracket commands must begin with an inventory administration verb;
- a bounded tested GenerationSessionStore binds sessions by chat probes/type;
- initial consecutive group greetings are scanned and merged on load.

## Hard pass 2

Final deterministic suite and adversarial fuzz were rerun after the corrective pass. **33/33 deterministic tests passed.**

Coverage includes:

- lossless Inventory JSON identities and hostile delimiters;
- misplaced, multiple, malformed, truncated, and embedded-terminator machine controls;
- byte preservation of non-machine prose;
- strict first-message seed parsing and round-trip escaping;
- explicit replacement capability gating;
- quiet/impersonate classification;
- post-send causal guard rebinding;
- cross-chat interceptor selection and prompt-ready matching;
- no synthetic working-chat injection;
- context-overflow failure without tool-chain pruning;
- Unicode-normalized backend identity;
- compact and legacy portable checkpoint reconstruction;
- swipe-specific recovery;
- user-edit lineage invalidation;
- randomized middle-message deletion rollback;
- metadata-less portable branch reconstruction.

Adversarial loops include **2,000** seed round-trips, **1,000** control cases containing literal `-->`, **500** lossless prompt-state cases, **1,000** cross-chat generation-session matches, and **200** randomized timeline deletion/recovery runs.

A metadata-less **4,000-message** portable branch hydrated in about **10.3 ms** in the final review container. A representative 160-item portable checkpoint encoded at about **59%** of the former object-key-heavy snapshot size.

`node --check` passes for every changed runtime module and the entry point.

## Result

No reproducible state-corruption, cross-chat Inventory bleed, machine-text leakage, or non-machine prose deletion remained after the second hard pass.

The remaining unavoidable validation is a live browser smoke test in the user's exact SillyTavern + Megumin Suite Beta environment for visual/DOM timing. Backend state and prompt-pipeline correctness are covered by the repository test harness.

## Storage note

Chat-level revisions are bounded. Portable checkpoints still grow with actual inventory-changing messages because exact metadata-less SillyTavern Branch/Checkpoint recovery requires state to travel with cloned messages. v0.2.4 reduces that cost by storing tuple-packed checkpoints rather than repeated object-key-heavy state snapshots; this metadata never enters LLM context.
