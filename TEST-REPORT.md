# Inventory Block v0.3.6 Raw Reconciliation Compatibility Report

Date: 2026-09-02

## v0.3.5 manual reconciliation recovery

v0.3.5 adds a guarded manual retry for the latest completed assistant response through both the settings UI and `/inventory-reconcile`. Reconciliation stamps bind successful scans to exact assistant text and revision state so repeated clicks cannot double-charge resources; later Continue suffixes can be scanned without replaying older events.

## v0.3.4 raw reconciliation compatibility

v0.3.4 keeps the post-response architecture but routes its hidden scanner through SillyTavern `generateRaw({ prompt })` instead of `generateQuietPrompt`. This avoids rebuilding a second full chat-generation context for bookkeeping and improves compatibility with strict providers such as Gemini while preserving the same validated patch protocol.

## v0.3.3 post-response reconciliation

v0.3.3 moves inventory writes out of the visible RP generation. The foreground model receives only read-only possession context; after the final assistant message completes, a hidden quiet reconciliation pass emits the validated machine patch internally. Continue scans are suffix-only, Swipe/Regenerate keep their captured base revision, stopped generations do not reconcile, and the visible message is never rewritten by the hidden scan.

## v0.3.2 deep hardening

The post-v0.3.1 audit targeted contradictions between prompt instructions and backend capabilities, stale manual-editor writes, alternate negative-balance paths, grouped numeric resources, generation-terminal cleanup isolation, storage-bytes pressure, repeated lineage rescans, category-order comparison, damaged revision counters, and truncated seed recovery.

The release gate repeats the complete deterministic suite, adversarial fuzz suite, syntax checks, and `git diff --check` ten times without interruption. Any corrective change resets the count to pass 1 before a source commit is allowed.

## v0.3.1 deep hardening

Post-v0.3.0 audit added deterministic Remark-resource arithmetic, overdraw rejection, fail-closed overlapping-generation selection, portable checkpoint retention, single-save history clearing, resilient retention storage, empty-category comparison, and in-place History refresh after restore.

The release candidate was exercised through ten repeated full cycles of `npm test`, the hardpass fuzz suite, syntax checks, `git diff --check`, and focused invariant review. The permanent deep-audit tests include 600 sequential mutations under a 50-revision cap, portable checkpoint pressure, alternate-swipe history clearing, resource overdraws, blocked storage, and ambiguous concurrent sessions.

## v0.2.5 Megumin control-position hotfix

The Inventory machine control no longer has to be the final non-whitespace bytes of an assistant reply. Exactly one complete control with the mandatory terminal period may appear before or after other Megumin/structured blocks. The parser removes only the Inventory control span and preserves all surrounding prose/blocks.

## v0.2.6 operation-shape resilience

The canonical machine format now explicitly requires a string `"op"` field in every patch operation. The parser safely normalizes unambiguous weak-model variants using `"operation"`, `"action"`, or a single recognized nested operation key, while conflicting or malformed selectors remain atomic rejections. Runtime and release version stamps are synchronized.

## v0.2.7 optional terminal sentinel

The HTML-comment control remains the canonical machine envelope and the prompt still prefers a trailing period for SillyTavern sentence-trimming compatibility. A complete comment with valid JSON is now accepted even if the model omits that extra period; truly truncated or malformed controls remain atomic rejections.

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

History is bounded by both count and bytes. The selected 50/100/200/500/768 retention value limits backend revisions and logical portable checkpoint groups, while separate 4 MiB ceilings cap the serialized backend revision trail and portable checkpoint payloads. Exact current-state anchors are protected, so unusually large inventories may retain fewer historical snapshots rather than allowing chat metadata to grow without a byte ceiling. This metadata never enters LLM context.
