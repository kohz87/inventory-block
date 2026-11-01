# Review F (1 Nov): Standard stat formula, Story Block `stage31/fa` b1df710 (base 2.13.0 0a68271)

**Verdict: OK. No blockers.** No commits or pushes. Test ST (8178) and its mock model stopped (PIDs 22836 and 22833).

## Counts
- `npm run check` ok. Full `npm test`: 4353 tests, 4337 pass, 0 fail, 15 skip (sibling checkouts absent), 1 todo (pre-existing C4-2).
- `git diff --check origin/main` (origin/main = 0a68271): clean. No version bump or CHANGELOG edit in the diff.
- `node scripts/sim-standard.mjs` runs (exit 0); duel table matches the V2_LOG (focused 81/73/78/66/62, spread 75/65/53/40/25).
- My own checks (scripts in `$S/rv-f/scripts/`, trees `$S/rv-f/new` = b1df710 and `$S/rv-f/base` = 0a68271):
  - classic-id.mjs: Classic chat, 3 sends + Re-read + swipe + rebuild + delete; planner prompts, narrator tail, receipts, spans, head, the four template hashes, Combat text hash, PRESETS: **identical** new vs base (random ids and 64-hex hashes normalised; the dice are seeded).
  - cross.mjs: a Classic chat saved by the base build loaded by the new build: head equal, rebuild equal, Re-read ok.
  - diff-rules.mjs: 4000 random sheets, my own model of the agreed table (every roll type, skill stat in the main slot, defence dodge/block/ward, social, check, luck window at every LUK 3..20, rank, class, foe d20 + base + 3 x class, hit 1 / decisive 2, skill cost). 0 mismatches; a deliberately wrong model (class x3) gives 3893, so the check bites.
  - fuzz-turn.mjs: 40 seeds x 40 random send/swipe/Re-read/delete/rebuild/reload on Standard and 4 on Classic: rebuild == live == reload, bars within size, delete gives blocks back, Re-read changes nothing. 0 problems.
  - mix.mjs / mix2.mjs: real templates, full host, flipping Standard/Classic between replies (both block sets), plus reader edits of stats and bars, level-ups, deletes: 0 problems.
  - fuzz-plan.mjs: 939 hostile planner answers parsed, validated, prepared and rolled: no throw, no invalid plan.
  - beaten.mjs: a foe killed before its turn is idle "beaten"; quick start at lead >= 10 gives one opening action against the foe the character targets.

## Browser (own ST 8178, mock model: planner answers from a file, narrator reply from a file)
New Standard chat; Wessel made with the wizard (start 5, 10 points, stepper stops at 10 and 3, Points left right, "Health 5 blocks (VIT 7, next at 10) ... Edge -2..+3 (next at LUK 7)"); `+ party Ren` and `+ party Mara | class III` made by Add to party (Ren I: stats 5, INT 9; Mara capped to II: INT 11, DEX 7, Mana 5 blocks). Fought Sluice Rats (Class II, Health 4) and Weir-drake (Class IV, Health 5) over 6 replies.
- Turn order rolled on the first reply (ties: Wessel 23 / Ren 23 -> higher AGI first; party first on foe ties), kept on every later reply, Mara rolled on entry. 5 swipes of the first reply gave 5 different orders; swipes of later replies kept it; Re-read changed nothing; `/del` of replies gave every block back (sheet == snapshot).
- Quick start seen once (Wessel 23 vs Rats 12), area attack rolled once per foe group, support heal vs difficulty, skill cost 1 block each use, then "Wessel cannot use Short blade (Stamina Empty): rolled without it."
- New block arrives full except Down (Spend points: VIT 7 -> 10 took Health 3 -> 4 of 6); stat drop clamps without Down (VIT/AGI/INT to 3: health 6 -> 4; Down stays 0 when stats go to 20); 4 points per Soul Class. Reload (a fresh page each run) gave the same sheet.
- Hero bars, Party cards ("Hurt . 3 of 5", next block / next luck line), Fight tab (turn order row, foe cards by class, battle log with breakdown "Defence, ward: d20 18 + (INT 11 + VIT 5/2)/2 = 6 + Class II 4 = 28 . vs Weir-drake d20 7 + 4 + Class IV 12 = 23"), phone 390x844: no horizontal overflow anywhere (Party, Fight, Settings, wizard).
- Settings -> RPG: Standard/Classic switch, Custom shows Standard's numbers, Add the Combat rules block gives the Standard text on Standard (v2, 1198/1200) and the Classic one (v1) on Classic; Classic chat: wizard 10 x 7, 6 points, v1 blocks, Classic party card as before.
- Tail: the narrator's request holds words only (grep over 18 narrator requests for "N of M", "-blocks", "health N": none).
- Console: no Story Block error. Only the NPC State Delta dossier scan complains (the mock answers prose, not JSON).
- Shots in `$S/rv-f/shots/` (desktop 1440x900 and phone). Note: p-Party-*/p-Fight-* phone shots were redrawn at the end on the Classic chat.

## Follow-ups (ranked; none is a blocker)
1. **Narrator tail disagrees with the cue on bars.** The block summary lines in the tail are the sheet before the reply's roll; the cue's "Bars now" is after it. Real request (req-084): "Wessel - health Wounded" ... "Bars now: Wessel Badly wounded; Weir-drake Wounded", and the Foes line has no Hurt word while the cue says Weir-drake Wounded. The cue says it is authoritative, the sheet and the replay are right, but a narrator can write the stale word. Repro: any Standard reply whose roll hurts someone, read the request. Fix: build the tail summaries after the preview, or label them "before these rolls".
2. **A pack that names Classic (reader chose nothing): `+ party` makes a Standard companion** (stats 5 / best 9, blocks fields) while rolls are Classic. part.js:497 reads `rulesFromSettings(settings())` without the pack (precall, settings and wizard pass it). Repro in `scripts/packjoin.mjs`. Same read decides the extras' formula (Standard Combat rules). No shipped pack asks for Classic.
3. Battle log and cue call a support heal "Ren attacks Wessel - Success (19 vs 15)" (cue says "(support)... heals"); the log line should say heals / helps.
4. Wizard Skills step note is still Classic wording: "Stat is what the roll adds (half of it)" (strings.js:141); Standard puts the skill's stat in the main slot.
5. Reader picks Classic on a chat whose blocks are Standard (or the reverse: old Classic blocks under the Standard default): the planner's sheet text shows "Health ?" for values above 5 (Classic words on a 0..8 bar), and for Classic blocks under Standard a full 5/5 can read "Scratched" when VIT >= 10 (size 6, the block cap 5). Planner-only, cosmetic; the sheet and the tail are right.
6. A same-named foe group arriving within 12 messages after a fight ended continues the old order (carriedOrder takes the nearest rolled reply; `goesOn` matches by name): no new order, no quick start. From code reading and the existing carried-order test, not run in the browser.
7. Rulings to confirm with the USER: (a) a support roll that is "success at a cost" heals 1 block like a success (an attack at a cost also hits); (b) quick start only gives an opening action against the foe the character's act targets, not against every foe 10+ behind; (c) a chat made on 2.13.0 that never chose a formula now plays Standard on Classic blocks (accepted: no migration), blocks capped at 5.
