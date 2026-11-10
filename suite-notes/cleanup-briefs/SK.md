# SK — chatter count setting, skill slots never overwritten, skills in defense + practice by code (USER 3 Nov)

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, clone into $S/sk/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle, stored state never deleted,
never weaken/skip/delete a test — a pinned assertion or fixture changed on purpose is named in the report, a test per
change run after it, `npm run check` + full `npm test` + `git diff --check` green before push, PID files only, never
`pkill -f`/`pgrep -f`, never `playwright install`). If any command is denied, stop that step and report it; never
re-run it in another form. No real-ST check (the lead runs it). Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main fa94af6 (2.16.9). Branch `stage50/skills-chatter`.

## 1. Inner chatter count (src/v2/extras.js CHATTER_MAX = 3, grammar, display perReply)
- New Story Block setting beside "In the prompt" in the Inner chatter group: **Most chatter lines per reply**, 1–10,
  default 3 (help text: "3 to 5 reads best"). Uses the existing settings-field types; no new layout (the settings
  form already draws an int field — if adding one row counts as a UI change beyond that, say so in the report).
- The grammar line asks for one thought for each NPC in the scene who has something on their mind, up to the setting
  (`~ chatter Name: …` one line each). The cap read at capture is the setting at that time; replay keeps what was read
  (follow how perReply caps are recorded today; old replies unchanged).
- Prompt bytes change only for chats with chatter on; RPG-off/chatter-off fixtures unchanged.

## 2. Skill slots are never overwritten (src/v2/lean-rpg/templates.js skills block learn-N / practice-N; capture in
data-modules/part.js)
Bug (USER): `~ dm astra-skills … | kind: learn-1 | name: Shadow Cut` overwrote slot 1 (Iaijutsu): name/about/stat/uses
replaced, rank and practice kept; a later learn-1 Iaijutsu swapped back. Fix at capture so existing chats' stored blocks
benefit (their kinds are the old copy):
- `learn-N` whose name equals (case/space-insensitive) a skill already in some slot → updates that slot (about, stat,
  uses), whatever N says. A new name → goes to slot N if empty, else to the first empty slot; if no slot is free →
  refused with one Problems line ("No free skill slot for <name>.").
- `practice-N` whose line text (the "— reason" part) names exactly one of the character's skills → credited to that
  skill's slot, whatever N says; otherwise slot N as today.
- The New template's guard: also make learn-N's own `when` refuse a filled slot with a different name (for blocks made
  from now on), consistent with the redirect.
- Receipts say which skill was learned/practised. Replay equal (swipe, Re-read, delete, rebuild, reload).

## 3. Skills in defense; practice by code (src/v2/lean-rpg/precall.js both heads, resolve.js, fight.js or a new step)
- Planner rule (both heads): when a defender has a skill that fits defending (a dodge, step, parry, shield, evasion,
  ward), name it on the foe line. (Replace "only when it plausibly fits".)
- Code gives practice for every skill used in this reply's rolls — an act's skill and a defender's skill — +5 per use,
  per skill, summed, held to the existing 1..20 practice line range per reply per skill (constant in names.js). Only for
  rolls made with the skill (not untrained / Empty resource). Rank-ups follow the block's rules.
- No double count: in that reply, the narrator's practice lines for those same skills are not used (one Problems line:
  "Practice for skills used in rolls is given by code; the narrator's practice line was not used."), same mechanism as
  the fight-XP restore (xpFrom). Practice lines for skills not rolled stay the narrator's.
- Past rolls replay as recorded (version the new behaviour like flow: 2 did).
- Combat rules text for new chats: practice for rolled skills is automatic.

## Tests
Chatter: setting 1/3/10 caps, grammar text, display, replay. Skills: the USER's sequence (Iaijutsu in slot 1, learn-1
Shadow Cut → slot 2; practice-1 "Practiced Shadow Cut" → slot 2; learn-1 Iaijutsu → slot 1 updated, no swap), no free
slot, new-template guard. Defense/practice: planner head text; practice +5 per use (act and defense), cap, untrained
gets none, narrator line refused in that reply and allowed in another, rank-up, replay. Old rolls byte-identical.

## Report
Branch + head; what changed; tests added; pinned assertions/fixtures changed on purpose; counts; open questions. Short.
