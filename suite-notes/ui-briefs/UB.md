# UB — Story Director: scene duplicates out, a threads switch, status summary, Director layout (approved 1–3)

Read UI-COMMON.md first. Repo kohz87/Story_director, base origin/main 4b188c3, branch `stage29/ui-b`. Test ST port 8164
(use the UA/UC branches' Story Block only if pushed; otherwise main 121e49a).

1. One scene header (item 1): World → Now "Here" drops its place/time/weather lines (the hero header above every Game
   view screen shows them); its people stay. The Director tab drops its clock/place header line for the same reason.
   If Story Block is absent or too old to show the hero, keep them.
2. Status card summary (item 2): the per-reply Status card gets a short summary "<clock time>, <place>"
   (e.g. "1:30 pm, Bluewatch Village") so Story Block's merged "This reply" line can show it. Section title: make it
   "Where things stand" if the host shows module titles (coordinate via the UA2 contract: the card's title).
3. New feature `story-director.threads`, label "World-building threads", default on, `presets: { lean: false }`
   (contract in UC.md). It owns: the agenda, event, clock, beat, secret, faction, world, landmark and route kinds, the
   Pacing, World lines and Under [World] prompt paragraphs, and the Off-screen, Clocks, Beats, Secrets panels, the
   Chronicle tab and World → News/Factions. Off = the registry's normal off (nothing taught, panels hidden, state kept,
   replay identical). Keep `~ time`, `+ quest`, `+ hook`, `? check` outside it. Pack events that write lasting world
   changes from code must keep working with it off (test with Ersveil). Measure the static prompt with it off
   (all-defaults otherwise) and report the token number.
4. `presets` on your other features: `story-director.initiative` lean false; the trip feature (if declared) lean false;
   others omit (= default).
5. Bug: Director tab card grid overlaps (Hooks runs over Behind the scenes; Secrets lands on Hooks after Reveal;
   `$S/u1/27-*`, `28-*`). Fix the layout so cards never overlap at any width.
6. Tests for each item; prompt fingerprint fixtures may change only for the threads-off case (default-on output must
   stay byte-identical).
