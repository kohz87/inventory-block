# UC — Story Block: "How much to track" presets (approved item 3)

Read UI-COMMON.md first. Repo kohz87/Story_block, base origin/main 121e49a, branch `stage29/ui-c`. Test ST port 8163.

Contract (fixed for UB/UD too): a feature entry may carry `presets: { lean?: boolean, full?: boolean }`
(add 'presets' to FEATURE_KEYS in src/v2/features.js). Standard = the feature's `default`. A preset key it omits =
its `default`. A feature with `presets: false` is outside presets (never changed by one).

1. Settings → Features: at the top a group "How much to track" with three radio tiles Lean / Standard / Full
   (`role=radiogroup`), each with one line of what it tracks and the narrator's fixed-prompt size for that preset
   ("≈ N tokens of rules each reply", from the same estimator the "What's sent each reply" footer uses, computed by
   building the static prompt for that feature set without side effects; if that is impossible without side effects,
   leave the number out and say so). Below, the existing groups under a small "Fine-tune" label.
   Texts: Lean "Inventory, money, place, people, quests and time. No world-building threads or travel."; Standard
   "Today's defaults."; Full "Standard plus Choices, Inner chatter and a check roll before each reply." Note under
   the tiles: "Change any switch below and this shows Custom. Your saved story is never deleted."
2. The selected tile is derived, never stored: the preset whose table matches every in-preset feature's current
   state; else none selected and a "Custom" tag shows. Picking a tile sets every in-preset feature to that preset's
   value through the normal feature setter (prompt-changing switches give the usual one-slower-reply note once).
3. Story Block's own presets (src/v2/domains/index.js etc.):
   - lean false: weather, you, loot ("Pick what you take"), mounts, choices, chatter, preroll.
   - full true: choices, chatter, preroll.
   - `presets: false`: rpg, inspector, extractor (safety net), hud, cards, savepoints, encumbered.
4. Older modules without `presets` keys: their features follow `default` in all three presets.
5. Tests: derivation (match / Custom), picking sets switches, presets:false untouched, token estimate per preset.

UB (Story Director) and UD (NPC State Delta) add `presets` to their own features against this contract in parallel.
