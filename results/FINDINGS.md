# Story Suite v2 beta — live matrix findings (newest first)

Format: `[severity] repo: title — repro — owner area`. Full write-ups in `REPORT.md`; failing tests in `tests/<repo>/` (drop into that repo's `tests/v2/break/`).

## Pass 1 (2026-10-22 ~00:25–01:00 UTC; heads SB 5ef7ead, RB 924b9a3, SD affde13, NSD 5243d79)

[medium] rpg_battle: a condition a fight leaves (bleed, 1 round left) becomes stacks 1, never wears off with story time, and the next fight gives it 3 rounds — A3 rat fight leaves "bleeding", still on HUD/tail after `! time +30h`; `tests/rpg_battle/c1-fight-left-condition-grows.test.js` — RB-party2
[low] rpg_battle: battle board shows "bleeding 0" ("0 turns left") on the acting member during their turn — phone fight board, round 2 (`shots/c1-phone/fight-fight1-board.jpg`) — RB-screens2
[low] Story_director: Days screen shows each day's date twice ("CY 611, Goldwane 12 CY 611, Goldwane 12: …") — Days tab after a day crossing; `tests/Story_director/c1-days-date-twice.test.js` — SD-digest
