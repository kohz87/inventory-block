# LEAN3-LORE — prompt diet step 3: Ersveil lore trim, as a PROPOSAL for the USER (USER 3 Nov)

Read ../PROMPT-AUDIT-REPORT.md (cuts #1+2: the 7 constant lorebook entries are 8,213 chars every reply — Authority and
Generation 2,274, Classification 1,468, Naming 1,272, Knowledge 1,028, Causality 943, Premise 800, Currency 735).
This is the USER's world text: make a proposal they can read and approve; nothing ships without their OK.
Rules: X-COMMON.md hard rules (secrets, user data, own clone $S/lean3/, push only your branch, never merge/PR/force/tag,
never weaken/skip/delete a test — pinned changes named; never pgrep -f/pkill -f). If any command is denied, stop that
step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Base: Story_block origin/stage58/gear-bind (latest). Branch `stage59/lean-lore`. Edit ONLY
examples/packs/ersveil/ersveil-lore.json (+ zip rebuild, + tests that pin lore content/sizes).
1. Trim the 7 constant entries by ~35% total: keep every fact and rule the narrator needs; remove repetition, examples
   that restate a rule, and text duplicated elsewhere in the prompt (the money/coin rule — Story Block states it; "no
   plot armor" — the RPG states it; "soul class invisible" twice). Keep the voice.
2. Make Classification, Knowledge, Currency and Naming keyword-triggered instead of constant, with keyword lists that
   fire when the topic comes up (ranks/levels/guild for Classification; coin/price/silver/copper/gold for Currency;
   names/naming/"what's your name" for Naming; lore/history/"what do you know" for Knowledge — read each entry and pick
   the right words). Note any rule that must stay always-on and keep it constant.
3. Write a side-by-side review file for the USER: $S/lean3/LORE-PROPOSAL.md — per entry: old chars → new chars,
   constant or keyword (with the keywords), the full new text, and a bullet list of what was removed and why. Plus the
   total before/after for a quiet reply.
Validate the pack, rebuild the zip, run the Ersveil pack tests. Push the branch. Report: head, totals, path of the
proposal file, anything you were unsure about. Short.
