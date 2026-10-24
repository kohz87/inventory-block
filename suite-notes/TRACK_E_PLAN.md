# Track E plan: Story Block host changes (stage 3)

Source of truth: the frozen contract in Story Block, `docs/v2/contract/RB_CONTRACT.md` (§2 lifecycle, §3–4 seams,
§6 replay recording, §7 pack kinds, §8 death and return, §10 E table). This plan only splits the §10 E rows into
packages that can run side by side without editing the same files, and fixes the order. Where this plan and the
contract differ, the contract wins.

Base branch: `main` (v2 became main at beta.2). One branch and one PR per package, into main. Writers never edit
CHANGELOG.md, README.md or the contract docs: the lead adds those lines when merging. Every package keeps today's
behaviour for old stores, old packs and modules that don't use the new APIs, and proves it with tests.

## Packages

| Pkg | §10 E rows | Owns (files it may edit) | Depends on | Writer | Review |
|---|---|---|---|---|---|
| E1 replay core | per-op-block span metadata, ctx.replayGuard / hooks.replayGuard, claims per block; trimReceipts keeps data.v2; carrier source map and stable swipeKey/action/evidence ids; chain stops at the first invalid covers/hash; replaceStory steps with {replayed:true}; atomic suffix reconciler; ctx.absolute on every reset | `src/v2/store.js`, `persist.js`, `ops.js`, `commands.js`, `turn.js` (re-read/replan parts only) and their tests | — | Sonnet | Sol xhigh (VM) + lead |
| E2 lifecycle | sdk.preflight; requires.peers; dormant / ready / restore-pending dispatch before ensureModules; sdk.modules status+reason; dormant commands/capture/hooks/context suppressed (canGenerate suppressed, not false); SD fightRunner migration (patch for SD, applied by the lead) | `src/v2/sdk.js`, `registry.js`, `runtime.js`, `turn.js` (canGenerate/hook gating only) and their tests; SD patch as a file | — | Sonnet | Sonnet + lead |
| E4 inventory seams | purse.currency / rules.moneyPolicy delegation with SB fallback; inventory.definitions + inventory.registerDefinition + rules.registerItem routing; rules.equipPlan validation in inventory.equip / equipOn / item capture | `src/v2/domains/inventory.js`, `money.js`, `packs/content.js` (definitions only) and their tests | — | Sonnet | Sonnet + lead |
| E7a matrix runner | shared testkit/matrix runner and versioned vendor sync; every positive/negative combination of §2 with real modules | `testkit/matrix/` (new), `scripts/matrix.mjs` (new), `scripts/sync-testkit.mjs` | — (uses today's modules first, gains rows as E lands) | Sonnet | lead |
| E5 proof and evidence | ctx.proof contract; story.evidence projection, owner/kind checks, parent pins, retention through trim/reload/snapshots | `src/v2/commands.js`, `store.js`, `persist.js` (after E1 merges), new `src/v2/evidence.js` | E1 | Sonnet | Sonnet + lead |
| E6 timeline and restore | sdk.timeline head/methods/participant registry; internal savepoint.restore host block; all-domain payload/version manifest; batch-result pin; participant prefix map; active-history projection + participant head barrier; ctx.clockBoundary; savepoint.contract | `src/v2/rewind.js`, new `src/v2/timeline/`, `store.js` (after E1/E5), `sdk.js` (after E2) | E1, E2, E5 | Sonnet | Sol xhigh (VM) + lead |
| E3 rules pack kind | register content.rules (limits.js / validate.js), name+slug wrapping, invoke the D checker before wrapping, lookup/count/installed classification, rb-rules-v2 capability; validator opt-in scope for creatures/quests | `src/v2/packs/limits.js`, `validate.js`, `installed.js`, `kind.js` and their tests | Studio S2 (`src/v2/packs/rules-v2.js`) merged | Sonnet | Sonnet + lead |
| E7b assist checks migration | capture.check → SD checks.roll once, no legacy check.roll probe | `src/v2/assist/` | SD's checks.roll (track B, P09) | later, with B | — |

## Order

- Wave 1 (parallel): E1, E2, E4, E7a.
- Wave 2: E5 after E1; E3 after Studio S2; then E6 after E1 + E2 + E5.
- E7b moves to track B's SD checks work; it is listed here so E's table stays complete.
- Shared-file overlaps: E1 and E2 both touch `turn.js` in separate functions; the second to merge resolves the
  conflict with a merge (never a rebase of a shared branch). E5 and E6 start from main after E1 merges.

## Done when

Every §10 E row's "Required tests" exist and pass; old stores/packs/modules unchanged (SB's whole suite plus RB, SD
and NSD run against the new host, as before beta.2); the matrix runner (E7a) covers the §2 rows; each PR reviewed
as above; the lead merges in order and adds the CHANGELOG lines. Then tracks A, B and C start on main.
