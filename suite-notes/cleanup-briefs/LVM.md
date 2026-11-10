# LVM — mockup: Level 1–99 with ranks (USER 3 Nov: "yes, draw the mockup"; "hand the mockup to another agent")

Mockup only: no repo changes, no pushes. Rules: cleanup-briefs/X-COMMON.md hard rules (secrets, user data, PID files,
never `pkill -f`/`pgrep -f`, never `playwright install`, never `rm -rf` on copied data — copy into a new empty folder).
If any command is denied, stop that step and report it; never re-run it in another form.

## Setup
Copy $S/u12 (SillyTavern data copy `st-data`, `config.yaml`, `run/` with mock.mjs, script.mjs, lib.mjs, char.json, m3.mjs)
into a NEW folder $S/lvm/ (cp -r into it). Change dataRoot/port in your config (ST 8280) and the mock port (8380) and
all paths in run/*.mjs. ST: `cd /home/user/st-smoke/SillyTavern && node server.js --configPath $S/lvm/config.yaml`
(PID file). Extensions in st-data are at Story Block main (2.16.9), Story Director 2.9.3, NSD 1.7.3.
$S/u12/run/m3.mjs already does: RPG on, new Ersveil chat, character import, an ambush reply with a battle log, then
opens Game view → Party and Fight and screenshots them ("before"). Reuse it.
Shots desktop 1440×900 + phone 390×844, to $S/lvm/shots/: before-* (today) and after-* (patched DOM), as u11 did
(patch text and add small elements using the app's own classes; inline CSS only where needed).

## What "after" shows (the design the USER approved in words)
Soul Class I–IX is replaced by **Level 1–99**; a pack may name level bands as ranks (Ersveil: F 1–9, E 10–19,
D 20–29, C 30–39, B 40–49, A 50–59, S 60–69, SS 70–79, SSS 80–99). 100 XP per level. A story/pack level cap (default 99).
1. **Party card**: "Soul Class II" → a chip "Rank E · Lv 14"; XP row "24 / 100 to Lv 15". Same in the Home hero XP.
2. **Fight card**: foe card "Class II" → "Rank F · Lv 7"; the help line "Foe Health grows with class…" → "Foe Health
   grows with level"; turn-order note "(d20 + class + AGI/2; foes d20 + 2 × class)" → "(d20 + level ÷ 5 + AGI/2 …)".
3. **Battle log**: turn order "Astra (Lv 14) 13 > Mud-Scale Crawlers (Lv 7) 17"; Status "Mud-Scale Crawlers ×6 ·
   Rank F · Lv 7: Down".
4. **Changed this reply**: "Astra +6 XP (fight won)" and a level-up line "Astra reached Lv 15 (+1 point to spend)"
   (assumption to label on the page: 1 stat point every 3 levels — not yet decided by the USER).
5. **Settings → RPG**: a "Level cap" number (1–99, default 99) and the existing roll table text showing "level ÷ 5"
   instead of "2 × Soul Class"; the new "Practice per skill use" (1–5, default 3) row next to it.
6. **New character window**: starting level (default 1) where Soul Class is chosen today.
A story with no rank table shows just "Lv 14" (show one Party card variant like that too).

## Deliver
- $S/lvm/mockup.html: one self-contained page (shots embedded as data URIs) with Today / Proposed pairs per screen,
  desktop and phone, and a short "what changes" list per screen; title "Levels and Ranks". Theme tokens for light/dark,
  16px side gutter, no horizontal scroll (see the page at $S/u12/mockup.html for the pattern).
- Stop ST and the mock (PID files) at the end.
Report: shots list, the HTML path, anything you could not show, open questions. Short.
