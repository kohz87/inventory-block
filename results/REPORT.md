# Story Suite v2: beta-candidate breaker pass, report

## Heads tested (branch `v2`)
| repo | head | previous pass |
|---|---|---|
| Story_block | 6ae03aa | 81b5da3 |
| rpg_battle | 73b3cbb | 3510b50 |
| Story_director | ad7d396 | f18d77c |
| npc_state_delta | 37addac | 1156fd7 |

Breakers: a1 (new capture/display kinds + replay fuzz), a2 (economy and combat edges), a3 (live: settings and screens).
_Status: in progress. The findings sections below get filled in as the breakers finish._

## Previous pass's tests re-run on these heads (by the lead)
| test | result on these heads |
|---|---|
| SB a1-late-rescue-write, a1-late-save-chat-switch, a1-late-save-reload, a1-late-save-rename, a1-unload-behind-hung-save, f1-late-save-overwrites-newer | pass (fixed, #122 / #128) |
| SB a2-reread-after-vouched-click | pass (fixed, #119) |
| SB a3-purify-drops-input-type | still fails, but it's obsolete: it checks raw PURIFY_CONFIG. #120 restores control types after sanitizing (sanitize.js, testkit stPurify). a3 checks this live. |
| RB a2-boss-held-back | still fails, but it's obsolete: `combat.session` became `combat.fights[id]`. Checked by hand: `4 Wolf, Rat King (boss)` now fields Wolf A–C + Rat King, with Wolf D in wave 2. Fixed. |
| RB a2-prices-ignore-money-scale, a2-ranked-boss-below-strong | pass (fixed) |
| SD a3-alone-digest-says-fights, a3-map-centre-me-dead | pass (fixed) |
| Earlier cells' 27 c1–c4 tests in SB/SD/RB `tests/v2/break/` | all pass. `c4-rename-midsave` keeps its upstream todo (old-name ghost copy). |
