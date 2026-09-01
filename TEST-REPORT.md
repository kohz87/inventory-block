# Inventory Block v0.2.1 Hard-Pass Test Report

Date: 2026-09-01

## Scope

This review re-ran the extension adversarially after the earlier 0.2.1 hardening and expanded the scope beyond pure state/protocol behavior:

- SillyTavern Branch/Checkpoint portability;
- alternate swipe recovery inside a newly branched chat;
- generation-event ordering;
- quiet/impersonate/dry-run isolation;
- normal vs replacement/continuation target selection;
- broad OOC administration detection before SillyTavern appends the new user message;
- manual-edit/generation concurrency;
- message deletion and edited lineage;
- hidden update placement/authorization;
- destructive category operations;
- strict scalar validation and size ceilings;
- first-message seed escaping/multiplicity;
- long-chat lineage performance;
- Megumin-owned vs standalone block boundaries.

## Hard pass 1

The first implementation pass addressed all findings from the fresh v0.2.1 review:

- portable state checkpoints in message metadata;
- metadata-less SillyTavern branch hydration;
- quiet/background generation isolation;
- correct normal-generation targeting;
- manual writes blocked during generation commit;
- lineage-v2 stable assistant identities and rolling prefix hashes;
- hard branch-head cap;
- one-time capability-gated full replacement;
- destructive-category confirmation;
- strict primitive validation and inventory/control limits;
- lossless seed escaping;
- popup validation that can prevent close;
- integrated fuzz script in `npm test`.

The first hard pass caught additional implementation defects before commit:

- escaped seed values could double-unescape literal backslashes;
- an overly strict cleanup test treated an intentional paragraph break as corruption;
- object-valued patch fields could still reach JavaScript string coercion.

All were corrected.

## Hard pass 2

The next review found integration cases that direct state tests had not covered:

- post-reply prompt refresh could briefly remain pinned to the pre-generation revision if the pending session was cleared too late;
- alternate swipes copied into a metadata-less branch needed lazy local revision materialization;
- a newly generated swipe had to drop any portable checkpoint inherited from the rejected swipe;
- SillyTavern's non-streaming multi-swipe path can copy active `message.extra` to additional candidates after `MESSAGE_RECEIVED`, so duplicate Inventory metadata needed cleanup and independent lineage protection;
- the current broad OOC instruction is still in `#send_textarea` at generation preparation time and is not yet the latest chat user message;
- dry-run generation must not increment background-generation bookkeeping.

All were corrected and new regression tests were added.

## Final SillyTavern source cross-check

Current SillyTavern `release` source was checked directly during the final pass:

- `GENERATION_STARTED` is emitted before slash-command processing;
- `GENERATION_AFTER_COMMANDS` is emitted only after commands permit the generation to proceed and before the composer text is cleared;
- streaming completion can emit `GENERATION_ENDED` before the final `MESSAGE_RECEIVED` callback;
- `MESSAGE_SWIPED` identifies the swiped message;
- SillyTavern Branch/Checkpoint creation clones message/swipe data but constructs separate branch chat metadata;
- quiet and impersonate are real generation types used by background features.

Inventory Block therefore prepares tracked transactions on `GENERATION_AFTER_COMMANDS` when available, retains a short end-to-message bridge for streaming ordering, and falls back to `GENERATION_STARTED` only for older SillyTavern builds.

## Final results

Deterministic suite: **33/33 passed**.

Adversarial/fuzz checks:

- **1,000** first-message seed serializer/parser round-trips passed, including pipes, backslashes, and `]` in names/categories/remarks.
- **300** randomized timeline deletion/recovery runs passed.
- **200** metadata-less branch reconstruction runs passed, including periodic manual edits.
- Branch-head hard-cap stress passed.
- Selected-swipe branch portability passed.
- Alternate swipe lazy materialization passed.
- Blindly copied active-swipe metadata was confirmed not to leak that swipe's inventory into another candidate.
- Unknown backend state versions still throw without resetting stored state.
- Static scan found no legacy latest-ledger chat scan, no fallback-snapshot architecture, and no blocking `await ctx.saveChat()` inside the message event path.
- Standalone Inventory still does not claim Megumin's `.meg-blocks` root.
- `node --check` passed for `index.js` and every source module.

Performance probe:

- 4,000 chat messages;
- 512 retained branch heads;
- 201 inventory revisions;
- 50 active-revision resolutions completed in ~234 ms in the review container, roughly **4.7 ms per resolve**.

## Known design choices

- Complete backend revision snapshots are intentionally retained for reliable History/Restore behavior. Portable message checkpoints duplicate state only on state-changing/manual checkpoints so SillyTavern branches remain self-recovering without visible inventory text.
- The full current inventory remains intentionally injected each generation because the schema is compact and complete possession awareness is preferred over retrieval heuristics.
- Full replacement is available only for a recognized broad inventory-administration request and requires an exact one-time capability generated by the extension.
- There is intentionally no v1.x chat-ledger migration/scanning path.

## Remaining environment verification

No further state-corruption defect was identified in the final source/test pass. A live browser smoke test in the user's exact SillyTavern + Megumin Suite Beta build is still recommended for visual/event-order confirmation because repository tests cannot reproduce every browser DOM timing detail.
