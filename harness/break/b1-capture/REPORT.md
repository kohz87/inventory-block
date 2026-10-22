# B1 capture break report (saved by coordinator). Heads: SB a1cf5b1, RB 7b75abc, SD 65b9202 (pre-corefix, pre-RB-B, pre-quests2: re-verify).
17 findings: 0 crit, 3 high, 7 med, 7 low. Tests in tests/<repo>/ (SB 6 files, RB b1-capture-rpg.test.js, SD b1-capture-director.test.js). Fuzz harness in fuzz/ (suite-host.mjs, gen.mjs, fuzz.mjs [seed] [seeds] [replies]).
SB:
- 1 HIGH capture O(lines²): persist.js:64 writeRecord deep-copies record into swipe_info per line (store.js:233 append via turn.js:340-349); no line cap; 2000 lines 24–33s. Fix: cap lines/reply (setting ~150 + Problem), one record write per reply. Test b1-capture-volume.
- 2 HIGH story `+ coin`/`+ item` no clamp/claim/per-reply cap (inventory.js:591 captureCoin → :283; money.js:26-34). Fix: per-carrier story budget, clamp coin (level-scaled setting), item qty ~20/line, merge/refuse repeats. Test b1-capture-coin-cap.
- 3 MED [Happened] never trimmed (prompt.js:12,107-110): 150 `! rest` → 2328-token tail. Fix: collapse extras into "…and N more". (RB side: one rest per reply.) Test b1-capture-happened-budget.
- 4 MED Continue: block added by continuation never read, stays visible (turn.js:273,:384). Fix: remember length before continue, read bare blocks after it, hideBlock whole. Test b1-capture-continue.
- 7 LOW constructor label → Object (capture.js:131,:113) — corefix may have fixed (null-proto); verify.
- 8 MED `| qty:3` (no space) read as text (capture.js:24 LABELLED). Fix: accept label:value when label starts with a letter. 
- 9 LOW nested <Changes> loses later lines (capture.js:34-49). Fix: depth counting.
- 10 LOW `--!>` ends hidden comment (capture.js:100). Fix: escape every `--`.
- 11 LOW names not NFC-normalized; zero-width/RTL kept (names.js:17 aliasKey, scene present). Fix: NFC + strip format chars in cleanName. Test b1-capture-unicode-names.
(parser tests 7–10 in b1-capture-parser.test.js)
RB:
- 5 HIGH item.define trusts note numbers for heal/worth (items/define.js:68-112): "heals 999999 HP" sells 250,000; "ATK +9999" value 699,930. Fix: clamp heal/MP to largest built-in potion; clamp stats to rarity/level gear caps before itemWorth; legendary only from packs/loot.
- 6 MED up to 20 checks/reply (pre-RB-B; likely fixed by F80 3rd-check refusal) — verify.
- 12 LOW party.offers unbounded (party/commands.js:771 addOffer). Fix: cap per kind.
- 3 (RB side) party.rest narrated, no per-reply limit (party/commands.js:418). Fix: claim rest:<carrier>.
SD:
- 13 MED threads unbounded name length/count; compose over all threads each reply (tracker/capture.js; tracker/note.js:60 → src/note.js:246): 400 threads → 2.9s/reply, 8.3MB. Fix: key ≤120, new threads/reply 10–20, tail top-N.
- 14 LOW full problem list (50) rewritten each time (tracker/capture.js:134 slice(-50)) → 9.6KB ops/line. Fix: ring keyed by counter or out of state.
- 15 MED `! time +99999999999d` no ceiling (tracker/time.js:105-118, :126). Fix: maxJump setting (~30 days).
- 16 LOW invalid `~ time … 25:99 pm` moves clock back (tracker/time.js:136 → calendar.js:397). Fix: parser refuses invalid h/m/y.
- 17 MED lines with `qty:`/`id:` labels refused whole: raw labels stored in record.fields collide with SB ops.js:215,264 checkOps rules (tracker.js:390). Fix: keep known fields only or prefix unknown labels.
Held up: no exception reached reader over ~6,600 hostile replies; rebuild==live, fresh replay==live; static byte-identical; bounded lists (host problems 200, SD 50, combat offers 10, present 40); numbers refused cleanly; one blow/heal per person per reply; blocks/think handling; cross-module conflicts.
Low not filed: mismatched <thinking>…</think> not treated as reasoning.
