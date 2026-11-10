# BZ — clearer instructions + safety net (USER: "Add them all to next build", 2 Nov). Ships in SB 2.16.4.
Rules: X-COMMON.md hard rules; if any command is denied, stop that step and report it; never re-run it in another form.
Branch `stage40/prompt-clarity` from Story_block origin/main ceeb2a1; clone $S/bz/; ST port 8214. Two other branches
ship in the same release: BD `stage40/legacy-envelope` (capture.js, envelope.js, turn.js history stripping,
lean-rpg/view/battle-log.js) and BY `stage40/you-first` (domains/scene.js youNote) — stay out of those files/areas; if a
change must touch them, keep it to the minimum and say so.
Evidence (USER, two models): the narrator tells Marrit paying 36 copper but writes no coin line. A model's own thinking
said: the purse (7 silver) was listed under [Happened] / Wallet, so it assumed the pay was already counted and skipped
it to avoid double counting. Also models write `~ time … mid-morning` / `midday` (refused: no clock time), the safety
net invented a place name ("Bluewatch Guild Branch" for the map's "Bluewatch Village / Guild Office") and wrote
`~ time midday`, and a model wrote `~ dm guild-membership — … | letter: F` without `kind:` (only `promote` takes letter).
1. Wallet line in the tail: say it is the amount BEFORE this reply and that any money paid or received in this reply
   needs a coin line, e.g. `Wallet: 7 silver (before this reply: write a coin line for any money paid or received in it)`.
2. The [Happened] note made by character creation / import (and any other [Happened] that sets the purse or inventory):
   say plainly it is the STARTING purse/kit, so later payments are not read as already done. Find where it is written.
3. The coin kind's instruction line: "whenever {{user}} is paid or pays in the story, even a few copper, write the coin
   line". Keep it one short clause.
4. The time kind's instruction: a time line needs a clock time (`~ time Goldwane 12, 9:30 am`; `! time +2h`); "midday",
   "mid-morning" are not times. Check SD's own time grammar text too (Story Director owns time lines? if the instruction
   text lives in SD, report it — the lead will brief SD; do not edit SD here).
5. Safety net (Assist extractor): give it the current place, the known place names near it (the map's names; cap the
   list), and the current story date and time; tell it to use a known name for a known place and a clock time for
   time; its lines that use an unknown place name for a place the map has, or a time without a clock time, are refused
   with a Problems line.
6. Missing `kind:` on a dm line: when exactly one kind of that module (with the line's op) accepts the line's labels,
   use it; otherwise refuse as today. Tests: guild-membership `~ … | letter: F` → promote; ambiguous → refused.
Static prompt bytes may change only where these instruction texts change (say exactly which); prompt-hash fixtures are
regenerated only for those, and say so. Tests for each item. Real ST with a scripted mock: a reply where the persona is
paid with no coin line in the first try → show the new tail text; a safety-net run with a vague time and an invented
place → refused with the Problems line; the dm line without kind → applied as promote. check + full test + diff --check;
push; report head, the exact new texts, counts, anything that needs Story Director.
