# Review K (1 Nov) — Key people: Story Director `stage32/key-people` 47c6a0d + NPC State Delta `stage32/key-people` 2aea5c3 (on Story Block main 2.14.0 0b23c3f)

Claude reviewer agent. Hard rules of suite-notes/ui-briefs/UI-COMMON.md; NO commits or pushes; never touch rpg_battle.
Read KA.md, KB.md, the 1 Nov V2_LOG entries on Key people (USER: SD owns; cap 10 adjustable; token budget default 300,
no upper cap; auto-removed when archived or dead from NSD; NSD reads one way only; kept in Lean), the KA/KB reports
(V2_LOG), SD docs/dev/key-people.md and NSD docs/dev/storysuite-adapter.md "Key people". Mockup:
vm-results/u5/mock.mjs (https://claude.ai/artifact/762b4QY8JkjjNqvLGiJkVu).

Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results (a pin,
away record, return, removal or tail line that differs from the design), or leaks a hidden value. Anything else is a
follow-up.

Check at least:
1. Both repos: `npm run check`, full `npm test`, `git diff --check origin/main`; NSD compat + smoke by hand
   (`node --import ./tests/active-runtime-test-setup.mjs tests/compatibility-check.js`, runtime-smoke). NSD's 5
   cancelled barrier tests are pre-existing on Node 22 (confirm on origin/main).
2. Byte-identity with the feature off (SD) and with no key people (both): prompts and the NSD injection unchanged vs main.
3. SD: pin/unpin, cap (default 10, changed), budget (300, larger, 0), `+ away` / `~ away` / `! away` / `- away`,
   `- key Name | died`, only pinned may be away, tail ordering and cut, passed date "due back", Lean keeps it.
4. Removal: archived or dead in NSD → `keypeople.sync` unpins with the reason; KA reads `npc.known` + dossier
   lifeState because `npcProfiles()` is unreachable on a Story Block 2 host — check the "was known" rule cannot unpin
   someone who never had a dossier, and that NSD never gets written by SD.
5. NSD: Key badge, While away timeline, ★ rows/cards, return note once (≤360 chars, in budget, swipe repeats, next
   reply drops), drift/stage freeze while away, auto-scan holds stable fields (reader Refresh does not), the
   `keyAway` memory in the saved npc slice survives reload, `npc.keyAway` query.
6. Replay across both: swipe, Re-read, middle delete, rebuild == live == reload, for pin, away, return and removal.
7. Browser on your own test ST (pick a free port, e.g. 8183, own data copy, PID files), SB main + SD + NSD branches,
   desktop + phone, with a scripted mock model (KA used one on port 5181): pin two people, send them away, a return,
   a death; check World → Key people, This reply, the dossier, settings; console errors. Known: KA notes a dangling
   " ·" in the closed status line when clock/place are unknown, and the removal line landing on the previous reply's
   card — confirm or refute.
Report: verdict BLOCK/OK, blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-k/REVIEW.md
($S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad).
