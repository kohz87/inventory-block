# Morning report — 4 Nov

## Released (all merged to main with green CI, merge commits)
| What | PR | Main |
|---|---|---|
| Story Block 2.17.0 — levels | [kohz87/Story_block#256](https://github.com/kohz87/Story_block/pull/256) | c53fad6 |
| Story Block 2.18.0 — gear in fights + Ersveil 2.6.0 (cast levels, signature gear) | [kohz87/Story_block#257](https://github.com/kohz87/Story_block/pull/257) | 233b131 |
| NPC State Delta 1.7.4 — gear-aware dossiers | [kohz87/npc_state_delta#236](https://github.com/kohz87/npc_state_delta/pull/236) | b6b6f8d |
| Story Studio 0.7.0 | [kohz87/Story_studio#27](https://github.com/kohz87/Story_studio/pull/27) | 7b79c3c |
| Story Block 2.18.1 — party roster from Character blocks | [kohz87/Story_block#258](https://github.com/kohz87/Story_block/pull/258) | 17a3ce8 |
| Story Block 2.19.0 — prompt diet + Ersveil 2.6.1 (lore trimmed) | [kohz87/Story_block#259](https://github.com/kohz87/Story_block/pull/259) | 3eb517b |
| Story Director 2.10.0 — prompt diet | [kohz87/Story_director#158](https://github.com/kohz87/Story_director/pull/158) | 012c354 |
| **Story Block 2.20.0 — SDK** (public API v1, `{{sb::…}}` macro, Build-a-card guide + status-bar example) | [kohz87/Story_block#260](https://github.com/kohz87/Story_block/pull/260) | 2ee6318 |
NSD_LINE

Every release had an Opus review; all blockers were fixed and re-checked before merge.

## Savings (prompt diet, measured in a real ST copy)
- Story Block's own prompt text: quiet reply, RPG off −21% (14.5k → 11.5k chars); RPG on −32% (20.0k → 13.6k); fight −28% (21.2k → 15.3k).
- Planner runs only when a reply can need it (1 of 5 early replies in the test chat).
- Story Director text roughly halved (3.1k → 1.5–1.7k).
- NSD scanner: about 2 of 10 quiet replies instead of every reply, shorter dossiers.
- Together: about 31k → 14k chars per quiet RPG reply (~3.5k tokens, roughly −55%). The suite's part stays well under 10k tokens; the full request still depends on your card and chat length.

## What you need to do
1. Update the extensions in SillyTavern (Story Block, Story Director, NPC State Delta).
2. Re-import the Ersveil lorebook (2.6.1) to get the trimmed lore.
3. NSD: set **Portrait prompt format → Natural** for Krea 2 (prose prompts now). If "Scan every" was saved as 1, set it to 5.
4. Turn on **Gear** (needs RPG on) to try gear in fights.
5. Try the SDK: docs/v2/BUILD-A-CARD.md, and examples/cards/status-bar (regex status bar using `{{sb::…}}`). The regex example was format-checked, not run in a real ST yet.

## Waiting on you
- **SDK part 3 — a card that brings its own blocks:** draft in suite-notes/cleanup-briefs/SDK-CARD-CONTRACT.md. Finding: cards can already carry a pack in a `[storysuite:pack]` lorebook entry (Packs → "Import from lorebook"), it's just manual and undocumented. Recommendation: a one-click "This card brings a pack — Install / Not now" offer on chat open (mockup first), a docs section, and a Studio "export as lorebook entry". ~2–3 h. Three short questions at the end of the file.

## Open follow-ups (not blockers, in TODO_NEXT.md)
- XP rate on Re-read (F2); stale "Points per Soul Class" row; commands during the RPG load window; template blocks get cap 99.
- SB strings.js duplicate key `card`; Studio: tracked node_modules symlink, AI-README version line, no `bonus` field.
- Roster guard check by another module; NSD meters through the public API (`npc.<name>.<meter>`).
- Sync the SB testkit (now returns `api`) into the module repos' vendored copies.
