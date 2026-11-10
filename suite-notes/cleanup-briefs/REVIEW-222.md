# REVIEW-222 (4 Nov) — Opus reviews of the 2.22.0 pieces (common rules)
Claude reviewer agent. All rules of CARD-COMMON.md and GEN22-COMMON.md apply (secrets, user data, PID files, no
playwright install, no model names). NO commits, pushes, merges or PRs. If any command is denied, stop that step and
report it; never re-run it in another form. Fresh folders $S/rv222-<name>/ only (fresh clones; never touch the
builders' clones); never delete copied data. S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Do NOT use or read $S/userchat or any copy of the USER's chats (being deleted). Use pack/test chats only.
The machine is shared by ~7 agents: run tests with --test-concurrency=2, only the suites your area touches plus
`npm run check`; re-run a timing failure alone before calling it real. Real ST only where the brief asks (free port
from 8600 + your offset, own data copy, PID files, mock model).
Base: Story_block main is now a2d57b1 (2.21.0). The pieces were built on 2ee6318 (2.20.0); review each branch's own
diff (`git diff <merge-base>..<head>`), and say where it would collide with 2.21.0 behaviour (practice rule, fight
fix: 2 mark, ambush, card offer) — an integrator is merging them now on `stage67/sb-222`.
Depth (USER 4 Nov): FULL = saves, replay/Re-read, scanning, fights, XP/practice — find everything at the blocker bar,
trace old chats (pre-2.22 saves) loading, swipe/delete/Re-read, chat switch mid-work. ONE = display-only — one pass,
layouts at 390 px and desktop against the approved mockup.
Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results, or leaks a
hidden value. Everything else is a follow-up, ranked. One test per proposed fix.
Report: verdict BLOCK/OK; blockers with exact repro and proposed fix; follow-ups ranked; what you ran with counts.
Copy at $S/rv222-<name>/REVIEW.md.
