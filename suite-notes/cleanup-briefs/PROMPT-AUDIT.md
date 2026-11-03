# PROMPT-AUDIT — measure what every reply sends, and whether we can halve it (read-only; USER 3 Nov)

USER: "I want to know if we can halve the number." Today: ~17k characters per reply without a character / RPG,
21.6–22.6k with RPG, plus a ~2k-character planner call on fight replies.

Rules: X-COMMON.md hard rules (secrets — never open any secrets.json; never the USER's ST data; PID files only; never
pgrep -f/pkill -f; never `playwright install`; never rm -rf copied data — copy into a NEW empty folder). No repo changes.
If any command is denied, stop that step and report it; never re-run it in another form.

Setup: copy $S/lvst (st-data, config.yaml, run/) into a NEW folder $S/paudit/; ports ST 8300, mock 8400 (change paths).
Install Story Block main (2.17.0; clone https://github.com/kohz87/Story_block main into $S/paudit/sb), Story Director
main and NPC State Delta main (clone the same way) into the copy's extensions the way $S/lvst/run/lv.mjs installs SB;
Ersveil 2.5.0 pack imported; Director and NSD enabled as a USER would. The mock LLM records every request
(prompts.jsonl) — read $S/lvst/run/mock.mjs.

Measure (chars and approx tokens = chars/4), for: (a) a quiet story reply with RPG off; (b) the same with RPG on and a
character; (c) a fight reply (main call + planner call); (d) reply 30 of a longer chat (to see growth). For each request:
1. Split the full prompt into its parts: SillyTavern's own (system/main prompt, character card, persona, chat history
   — report but do not count as ours), and every extension injection by its key/source (Story Block parts: grammar
   lines per kind, state/tail per domain, RPG combat text, sheet, rules, chatter, where/time, packs/lore; Story
   Director parts; NPC State Delta dossiers; anything else). Map each to the source file/function that builds it.
2. For each part: static (same every reply) vs dynamic; needed this reply or not (e.g. item/gear grammar on a reply with
   no items, combat rules outside a fight, dossiers for NPCs not present); duplicated text across parts (the same
   state said twice, the plan stored three times, etc.).
3. Then a table of candidate cuts with estimated characters saved each, risk (what the narrator might lose), and
   effort; and a clear answer: can OUR part (everything except ST's own card/persona/history) be halved — at (a), (b),
   (c), (d)? Which cuts get there?
Write the report to $S/paudit/REPORT.md (tables, short), keep raw prompt dumps in $S/paudit/dumps/ (never anything
from the USER). Stop ST and the mock (PID files; ports closed). Report: the headline numbers, the top cuts, the halving
answer. Short.
