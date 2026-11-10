# Clean-up release (USER approved 1 Nov) — rules for every agent

Hard rules: suite-notes/ui-briefs/UI-COMMON.md "Hard rules" (all apply: secrets, user data, exact trailer, clone into
$S/<letter>/, push only your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never touch rpg_battle,
stored state never deleted, never weaken/skip/delete a test, a test per change run after it, `npm run check` + full
`npm test` + `git diff --check` green before push, PID files only, never `pkill -f`/`pgrep -f`, never
`playwright install`). S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad.
If a permission is denied, stop that step and report it; never work around it.
Bases (origin/main): Story_block 79df89f (SB 2.15.1 + Ersveil 2.4.0), Story_director 1ae570c (2.8.0),
npc_state_delta f642101 (1.6.1), Story_studio 3036ab8 (0.5.1).
A real-ST check, when your brief asks for one: UI-COMMON "Browser check" (own st-data copy, own port, never open
secrets.json), with the other extensions at the bases above. Shots desktop 1440×900 + phone 390×844 into
$S/<letter>/shots/. No UI change beyond what the brief names (part B items wait for mockups).
Report: branch + head, per item what changed, tests added, counts, shots folder, open questions. Short.
