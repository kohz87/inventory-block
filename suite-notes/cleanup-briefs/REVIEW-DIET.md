# REVIEW-DIET — Opus review of Story Block 2.19.0, the prompt diet (read-only)

Read-only. Clone Story_block into $S/rv-diet/ and read origin/stage62/diet-release (82faaa3 or newer) against
origin/main 17a3ce8 (2.18.1). Briefs: LEAN1-SB.md, LEAN2-RPG.md, LEAN3-LORE.md, LEAN-INT.md; numbers in
../PROMPT-AUDIT-REPORT.md. Blocker bar: data loss, crash/wedge, wrong results, replay inequality (a reply rebuilt,
swiped, Re-read or reloaded must give the same prompt, planner decision and state as live), changed behaviour the
narrator depends on (a change line that parsed before must still parse; a stray line outside <Changes> that was taken
before must still be taken), hidden-value leak. Special attention:
- the planner gate (gate.js): stored decision, no re-call on replay; does a skipped reply really behave like a "none"?
  any path where a needed roll silently disappears (an open fight not detected, a skill named by alias)?
- the quiet-reply prompt (lean-rpg/quiet.js + registry contexts(hint)): replay-stable? a narrator-opened fight without a
  plan still parses and gets the full text next reply? existing chats' pinned block text untouched?
- kind `heads` (registry.contexts, capture.grammarHeads, prompt.js filter): empty grammar never reaches the prompt;
  validation; no change for kinds without heads.
- SB trims: Carried note stripping (could it remove a real note part?), look nag once per chat (view.chat.readers),
  coin rule once.
- Ersveil 2.6.1 lore keyword triggers: entries valid; constant entries carry the always-on rules.
- the merge with 2.18.1 (roster) — nothing of the roster lost.
Never read secrets or the USER's SillyTavern data; never pgrep -f/pkill -f; if any command is denied, stop that step and
report it. Report per finding: file:line, repro, severity, fix. Short.
