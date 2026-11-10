# Review Y (2 Nov) — fix releases SB 2.16.1, SD 2.9.1, NSD 1.7.1 (wedge fix + World → Now)
Claude reviewer agent. Hard rules of suite-notes/ui-briefs/UI-COMMON.md; NO commits or pushes; never touch rpg_battle.
If any command is denied, stop that step and report it; never re-run it in another form. Fresh folders $S/rv-y/; never
delete (S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad).
Heads (on the released mains):
- Story Block `stage37/recover-heal` 84bb6b6 (base 768c41a): recover() aborts a native-mutation whose participant
  answers NOT_FOUND on activate, then releases; one Problems line + toast; native-event untouched.
- Story Director `stage37/world-now` de0db2b (base d972c4f): Around here place ellipsis + day dropped first; Key people
  pin list scrolls inside the card (local revealIn copy).
- NPC State Delta `stage37/release` ea0c780 (base 64af0ac) = world-now a429a69 (People here rows) + hydrate-fix 040f775
  (participant hydrate waits for the chat's state to load; never mints/writes a lineage on an unloaded state).
Read: cleanup-briefs/BT.md, W-COMMON/WN/WD; V2_LOG 2 Nov from "POSSIBLE WEDGE"; mockup
https://claude.ai/artifact/DrUffpTSf8vwt7Vde7MozM; BT's scripts $S/bt/tools/ and logs $S/bt/run/.
Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results, or leaks a
hidden value. Everything else is a follow-up.
Check at least:
1. All three: check/validate, full tests (NSD under Node 24 via the repo's own way), diff --check; NSD compat + smoke.
2. The heal can never drop a change that could still finish: a participant that is merely slow or not loaded yet must
   not get NOT_FOUND-aborted (race of recover() vs NSD load on a slow machine); native-event untouched; heal once only.
3. hydrate-fix: no lineage minted/written while unloaded; retry path terminates; chat switch mid-load; a chat without
   NSD state (new chat, NSD off) still works; byte-identical prompts and saved state in ordinary play.
4. Healed chats (copy ZC's wedged chat from $S/zc, never modify it): after the heal, swipe / middle delete / restore a
   save point back past the lost point — does anything wedge again ("The selected story is waiting for its records")?
   If it wedges, is there a way out? Report exactly.
5. Real ST (free port 8204+, own data copy, PID files, mock model), desktop + phone: BT variants b, bn, c; 5-reply play
   with a pinned key person; World → Now per mockup (People here rows, Around here long place, Key people pin list);
   console errors.
Report: verdict BLOCK/OK, blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-y/REVIEW.md.
