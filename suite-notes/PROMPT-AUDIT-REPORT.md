# Prompt audit, 3 Nov (SB 2.17.0 c53fad6, SD 2.9.3, NSD 1.7.3, Ersveil 2.5.0; real ST copy, mock LLM)

Raw data: $S/paudit/dumps/ (all.json, rows.json, analyze.out), scripts $S/paudit/run/. "OURS" = everything except ST's
main prompt, card, separator and chat history. Chars; tokens ≈ chars/4.

## Main story call
| Case | total | ST own | OURS | lore (pack) | Director | SB | RPG | NSD | other calls |
|---|---|---|---|---|---|---|---|---|---|
| (a) quiet, RPG off (r4) | 16,051 | 1,568 | 14,483 | 8,213 | 3,077 | 2,727 | 0 | 468 | NSD scanner 8.5k |
| (b) quiet, RPG on (r3) | 20,757 | 786 | 19,971 | 8,213 | 3,077 | 2,721 | 5,494 | 468 | planner 2.5k + scanner 8.5k |
| (c) fight (r5) | 22,867 | 1,714 | 21,153 | 8,213 | 3,077 | 2,764 | 6,622 | 468 | planner 2.6k + scanner 8.0k |
| (d) r30, RPG off | 28,855 | 13,112 | 15,743 | 8,213 | 3,077 | 3,007 | 0 | 1,448 | scanner 10.8k |
| (d) r30, RPG on | 33,708 | 12,516 | 21,192 | 8,213 | 3,077 | 3,046 | 5,410 | 1,448 | planner 2.6k + scanner 10.8k |

Findings: the RPG planner runs EVERY reply with RPG on (2.2–2.6k, ~1.9k fixed); NSD's dossier scanner is a second full
call every reply (7.6–10.8k, ~6.5k fixed rules; scanEvery 1 by default). All calls per reply ≈ 31–35k early, ≈ 47k at
r30. OURS is flat over time; growth is ST history (12.4k at r30). The NSD dossier tail adds +1.55k fixed + ~2.05k per
present NPC (≤3). Our prefix is byte-identical reply to reply (cache-friendly).

## Biggest parts
- Pack lore 8,213 (7 constant entries: Authority & Generation 2,274, Classification 1,468, Naming 1,272, Knowledge
  1,028, Causality 943, Premise 800, Currency 735); duplicates with SB money rule, RPG "no plot armor", "soul class
  invisible" twice.
- Director 3,077 (14-kind grammar 1,567 + rules 1,510).
- RPG static 5,197 (module descriptions 1,274; skills learn/practice ×5 945; foes ×4 slots 1,004; [COMBAT SYSTEM]
  1,183; character 358; party 232; header 201).
- SB static 2,355 (header 827, grammar 1,140, money rules 385 — coin rule 3×); tail nags.
- NSD static 468; dossier preamble + rubric 1,552; secrets prefix repeated 4×.

## Candidate cuts
| # | Cut | Saves | Risk | Effort |
|---|---|---|---|---|
| 1+2 | Lore: trim constant entries ~35%, keyword-trigger Classification/Knowledge/Currency/Naming (8.2k → ~3.7k) | 4,500 | rule missed without keyword | M |
| 3 | Director compact grammar + merged rules; rare kinds only when used (3,077 → ~900) | 2,200 | format drift | M |
| 4 | RPG modules: one slot-grammar template, health words once, shorter descriptions | 2,800 | low | M |
| 5 | RPG combat/foes/party grammar only in a fight or when the planner returns foes | 1,400 quiet | narrated fight without a plan | M |
| 6 | SB shorter header/money; mount/weather/you lines only when on | 900 | low | S |
| 7 | NSD dossier preamble/per-NPC trim; merge the secrets prefix | 950 + 850/NPC + 250 | voice fidelity | M |
| 8 | Tail nags (Wallet, look, Carried provenance) | 300+ | low | S |
| 9 | Planner only in a fight or on a risk/combat verb | 2,300/quiet reply (call) | missed unannounced roll | S |
| 10 | Planner head 1,878 → ~1,000 | 900/planner call | low | S |
| 11 | NSD scanner on new/changed names or every Nth reply; cut its 6.5k rules | 8–10k/skipped reply (call) | slower dossier updates | M |

## Halving OUR part
| Case | now | cuts 1–8 | lore untouched |
|---|---|---|---|
| (a) quiet RPG off | 14.5k | ~6.6k (−54%) | −24% |
| (b) quiet RPG on | 20.0k | ~7.9k (−60%) | −38% |
| (c) fight main | 21.2k | ~10.0k (−53%); with planner + #10 ≈ −47% | −34% |
| (d) r30 RPG off | 15.7k | ~7.8k (−50%) | −24% |
| (d) r30 RPG on | 21.2k | ~9.1k (−57%) | −38% |
Extensions alone (no lore) halve with cuts 3–6, 8. The whole request at r30 can't halve (ST history 12.4k): −27%/−36%.
Biggest lever: other calls (9–11) remove 11–13k of the 31–35k sent per reply.
