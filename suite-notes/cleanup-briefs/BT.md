# BT — investigate: chat blocked after a quick send (ZC, 2 Nov). Root-cause first; fix only after the lead agrees.
Rules: X-COMMON.md hard rules. Never open secrets.json or user data; own data copy; PID files; never pkill -f; never
playwright install; never touch rpg_battle. If any command is denied, stop that step and report it; never re-run it in
another form. Fresh folders under $S/bt/. No pushes until the lead says so.
Released mains: Story Block 768c41a (2.16.0), Story Director d972c4f (2.9.0), NPC State Delta 64af0ac (1.7.0).
ZC's report: with an NSD key person pinned (a backfill runs after each reply), the reader sent the next message ~6 s
after a reply while NSD's scan/relationship/backfill calls were still running (backfill ~13 s after the reply); ZC's
script then closed the browser. The user message was posted but no reply generated: "Generation aborted by extension
interceptors", toast "A native change is finishing; every part must agree before the story goes on." (Story Block
coordinator.js ~l.1094). After reloads the timeline `status` stays "pending" with an NSD checkpoint, `head` says
RESTORE_PENDING, /trigger and generate() stay blocked; `timeline.recover()` refuses without host authority. With 14 s of
quiet between sends all 11 replies went through. Unknown: the quick send or the browser close. ZC's chat data and
scripts: $S/zc/ (st-data, work/) — copy, never modify.
Do:
1. Read the coordinator / timeline / NSD participant code and explain the state machine for this case.
2. Reproduce in real ST (port 8202) with a scripted mock model in three variants: (a) quick send, browser stays open;
   (b) no send, browser closed mid-backfill; (c) quick send then close. Say which wedge, for how long, and whether it
   clears by itself, by reload, or never.
3. Check whether the same happens on the previous releases (SB 2.15.1 d926cf6 / SD 2.8.0 1ae570c / NSD 1.6.1 f642101):
   new in this release or older.
4. Is there any reader-facing way out today (a button, a Settings action, a swipe/delete)? If none, that is a wedge.
5. Propose the smallest safe fix (which repo, which code), with how to prove it. Do not write the fix yet.
Report briefly: root cause, variants table, old-release result, way out today, proposed fix.
