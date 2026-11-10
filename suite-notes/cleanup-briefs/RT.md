# RT — three fixes from the USER's Ersveil run (USER 3 Nov: "yes, do all three")

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, clone into $S/<letter>/, push
only your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never
deleted, never weaken/skip/delete a test — a pinned assertion changed on purpose is named in the report, a test per
change run after it, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only, never
`pkill -f`/`pgrep -f`, never `playwright install`). If any command is denied, stop that step and report it; never
re-run it in another form, and never run `rm -rf` on copied data (build any ST data folder by copying into a new empty
folder). Never read the USER's own SillyTavern data. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Bases (origin/main): Story_block 0268f7d (2.16.5), Story_director a290af9 (2.9.2), npc_state_delta 81b6a21 (1.7.2).
A real-ST check: copy $S/u12/st-data (Ersveil character + chats, extensions at the bases) into your own new folder,
your own config (copy $S/u12/config.yaml, change dataRoot and port), the mock model ($S/u12/run/mock.mjs, script.mjs,
lib.mjs — change paths and ports). ST lives at /home/user/st-smoke/SillyTavern (`node server.js --configPath <yours>`).
Shots desktop 1440×900 + phone 390×844 into $S/<letter>/shots/. Stop ST and the mock at the end.

## RT1 — Story Block: rule lines on the reply card (branch `stage44/rule-lines`, clone $S/rt1/)
Approved mockup: https://claude.ai/artifact/WAzNw6CvTj2NYNy12mgAmW ($S/u12/shots/after-*.png).
Today `replyRules` (src/v2/reply-cards.js) shows every data-module rule that fired as "Rule: <id>" (strings.js
card.rule), in the card tiles and the one-line summary ("−1 silver · Rule: dues-f-e · Rule: probation").
- A rule that changed nothing (its fields hold the same values before and after) is not shown.
- A rule that changed fields shows one line per changed field: "<Block> <field>: <new value>", e.g.
  "Guild standing: probation". <Block> = the module's screen title when it has one ("Guild"), else its name;
  <field> = the screen's own label for that field when one binds it ("Standing" → "standing"), else the field id
  humanized ("member-years" → "member years"). Same tile, icon, tone as today; summary uses the same text.
- The rule id stays in the Inspector. Works for every pack's blocks. Replay/Re-read/swipe show the same.
- Work out where the before/after values come from (receipt data, or the module state of the reply before vs this
  one); do not store new receipt data if the state already answers it.
Real ST: Ersveil chat, pin guild-membership (`dm.pin`, see $S/u12/run/m1.mjs), a reply with
`+ dm guild-membership — Registered | kind: register` → card shows "Guild standing: probation" only. Shots.

## RT2 — NPC State Delta: the narrator's `~ npc` line goes through the impact tiers (branch `stage44/npc-tiers`, clone $S/rt2/)
Today `captureLine` (src/npc-meters.js ~1149) applies `~ npc Name | trust: +5` with only the per-reply change cap
(15); NSD's own scanner path uses impact tiers (core-mechanics.js DEFAULT_IMPACT_CRITERIA, relationshipCaps
ordinary 1 / meaningful 2 / major 5 / extreme 10, applyRelationshipDelta with resistance). Make the narrator line
use the same scoring:
- Grammar: the line takes `impact: ordinary|meaningful|major|extreme` (missing or unknown → ordinary). The grammar
  line names the tiers and their caps from the reader's settings, short (one line).
- Built-in meters (trust, affection, desire, tension) move exactly as the scanner would move them for that impact
  and raw delta (same function, same caps, same resistance/milestones). `=N` from the narrator becomes a move toward
  N held to the same tier. Custom meters: the tier cap bounds the step too (and their own range).
- The per-reply change cap still applies on top. Replay (swipe, Re-read, rebuild, reload) gives identical numbers.
- Check and report (prove with a test before changing anything) whether, while hosted, the scanner's relationship
  decision AND the narrator's line can both move the same meter for the same reply (double count). Fix only if proved.
- Prompt bytes change on purpose: update pinned fixtures and name them in the report.
Real ST: a reply with `~ npc Sanna | trust: +5 | tension: +5` (no impact) moves each by 1; `| impact: major` by ≤5.

## RT3 — Story Director: a planned meeting counts only if the reply shows the person (branch `stage44/meet-shown`, clone $S/rt3/)
Today the living cast (src/v2/cast/world.js chooseMeetings, apply.js, hooks.js, note.js) records a meeting (`why:
'place' | 'goal'`) before the reply, cues the narrator, and keeps it even when the reply never brings the person in
(USER: "Paths crossed: Sister Temiwa" with no Temiwa in the scene; her NSD dossier was created).
- After the reply, if the narration (shown text, not hidden comments) does not name the person (name or an alias, whole
  word, case-insensitive; a title alone such as "Sister" is not enough) and no `+ present` line names them, the meeting
  is withdrawn: the person stays unmet, no "Paths crossed" note, the pace is not used up, they may come again later.
- `why: 'story'` meetings are unchanged.
- NSD must not keep a dossier for a withdrawn meeting: find how NSD learns of a meeting (SD export / query / event) and
  make sure the withdrawal happens before NSD acts, or that NSD drops it; prove with a test (testkit host with NSD's
  participant if available, else the narrowest faithful test) and say exactly which repo needs a change. If NSD needs a
  change, make it on npc_state_delta branch `stage44/meet-shown` too.
- Replay: swipe (a new swipe may show or not show the person), Re-read, middle delete, rebuild == live == reload.
  Re-read of an old reply where the person never appeared withdraws the meeting.
Real ST: Ersveil chat at Bluewatch Village 6:40 am, mock reply without Temiwa → no "Paths crossed", no dossier;
reply that names her → met as today. Shots.

## Report (each agent)
Branch + head per repo; what changed; tests added; pinned assertions changed on purpose; counts (tests/pass/fail);
real-ST result + shots folder; open questions. Short.
