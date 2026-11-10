# BY — "Your look" fills itself early (USER, 2 Nov). Rules: X-COMMON.md hard rules; if any command is denied, stop that
# step and report it; never re-run it in another form. Branch `stage40/you-first` from Story_block origin/main ceeb2a1;
# clone $S/by/; ST port 8213. Another agent (BD) works on capture/envelope/battle-log files on stage40/legacy-envelope —
# stay out of capture.js, envelope.js, turn.js's history stripping and lean-rpg/view/battle-log.js.
Problem: the hero's Wearing and Condition (feature story-block.you, the `~ you rank: … | wearing: … | condition: …` line)
stay "—" until the story happens to change them; in a new chat they are blank for many replies.
Change: while Wearing or Condition is empty (and the feature is on), the narrator is asked once per reply, in the
prompt's tail (not the cached static part), to set the empty ones on this reply from what it knows (the persona, the
first message, the inventory): one short line, e.g. "Your look is not set yet: on this reply write ~ you wearing: … |
condition: … for Astra, from the persona and what they carry." Rank only when the pack gives a rank word and it is
empty. Once both are set, the note is gone (prompt bytes identical to today). Never overwrite what the reader set via
Edit. Keep it within the tail budget and the existing `~ you` grammar.
Tests: the note appears only while a field is empty and the feature is on; disappears once set; static prompt bytes
unchanged; with the feature off nothing changes. Real ST with a scripted model: a new chat → first reply's prompt holds
the note; a reply with `~ you wearing: … | condition: …` fills the hero; the next prompt has no note. Shots of the hero.
check + full test + diff --check; push; report head, counts, the exact note text, shots.
