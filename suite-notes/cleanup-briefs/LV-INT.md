# LV-INT — integrate the levels release (Story Block 2.17.0)

Read LV-CONTRACT.md (all addenda) first. Shared rules as there (secrets, user data, exact trailer, own clone $S/lvi/,
push only your branch, never merge to main/PR/force/tag, never weaken/skip/delete a test — pinned changes named,
`npm run check` + full `npm test` + `git diff --check` green before push, PID files only). If any command is denied,
stop that step and report it; never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/main cea0b4b. Branch `stage53/levels-int`. Merge with `git merge --no-ff` (merge commits, no
rebase), in this order, resolving conflicts so BOTH sides' intent survives:
1. origin/stage51/lv-ranks-xp (LV-C: the real src/v2/lean-rpg/levels.js, rpg.rank, validation, fight XP, rpgXpRate)
2. origin/stage51/lv-foes (LV-B: foes.js, level{n}, foe term, initiative, opened-foe levels and cap)
3. origin/stage51/lv-slim (LV-E: slim rpg.resolve receipts, cue rebuilt)
4. origin/stage51/lv-lazy (LV-F: rpg-lazy.js; note prompt.js now imports lean-rpg/cue.js — keep it in the static set)
5. origin/stage51/lv-ersveil (LV-G: Ersveil 2.5.0 data; its validation failures must clear once LV-C is in)
6. origin/stage51/lv-ui (LV-UI: views; REMOVE its shims — its own levels.js, packLevels shape, settings shim names —
   and wire the views to LV-C's levels.js/levelLabel/playerRankValue and the real settings)
LV-A (stage51/lv-character: Character level/xp/cap, rise rules, party roll term, rpgLevelCap) is still being built;
leave clear seams and a short list of what LV-A's merge must reconcile (the lead or you merge it when it lands:
`git fetch origin stage51/lv-character` — if it appears while you work, merge it last as step 7).
Reconcile names: one `LV_VERSION`/`lv: 1` mark (dedupe LV-B's and others'), one `levelBonus`, one divisor setting
(`rules.levelDivisor`, default 5), `xpFrom` remembers `level`. Version stays 2.16.10 (the lead bumps).

Then: full `npm test` on this quiet machine (re-run any timing test that fails alone once and report), `npm run
check`, `git diff --check`. Push and report: head, every conflict and how it was resolved, shims removed, remaining
seams for LV-A, counts. Short.
