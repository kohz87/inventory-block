# Story Suite v2 — views not drawn through templates (audit 2026-10-22 ~07:30 UTC)

## Mounted (redesign candidates) — 14 (SB 13, SD 1, RB 0)
1. SB host-ui.js openSettingsOverlay/renderSettingsHost/moduleFold/field rows + profile-field.js — Settings overlay & field rows — L (needs form widget)
2. SB host-ui.js featuresFold/featureLink — Features fold — M
3. SB host-ui.js prompt size + Show what's sent — M
4. SB host-ui.js diagnosticsFold/versionsFold — M
5. SB packs/panel.js — Packs fold — M
6. SB events/section.js — Events debug — S
7. SB assist/section.js — Assist section — S
8. SD arc/settings.js promptSection — Arc prompt editor — S
9. SB ui-host.js sheet + createTabHost — Story panel + tab bar — S
10. SB ui-host.js bar/notice — Story Suite bar + held-back notice — S
11. SB ui-host.js drawer/menu — ST extensions drawer + wand item — S (keep native)
12. SB reply-notes.js — notes under replies — S
13. SB extras-ui.js — Choices/Chatter strip — M
14. SB view/mounts dialog.js/screen.js — mount frames (dialog, game view nav) — M (CSS may suffice)
Total ≈ 20 h (12–30 h); settings form engine is the main cost.

## Dead/legacy — retire
- SB ui/inventory-tab.js, ui/scene-tab.js (hidden by SCREEN_TABS)
- SB layout/render.js + tabFromLayout (legacy JSON layouts; retire if no outside module ships layouts)
- RB party/tab.js, trade/page.js, items/page.js (replaced by screens)
- RB return/card.js widget ORPHANED: death "Return in time" card never drawn → placed in template (fix-cand-rb, pre-beta)

## Hand-built widgets inside templated screens (~20; large: SB inspector, SB map, RB fight board, SD atlas)

## From the beta live test (2026-10-22), for the UI stage
- World → Now present cards (NSD's cards): the portrait takes too much room, so the text becomes a wall; in the game view the card is too narrow and tall.
- Choices (CYOA) under a reply: one option per row, folded by default.
- Suite settings overlay: part of the redesign (item 1 above).
