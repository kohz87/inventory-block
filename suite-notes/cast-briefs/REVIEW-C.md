# Review C (1 Nov) — the living cast + secrets + Studio cast editor
Claude reviewer agent. Hard rules of suite-notes/ui-briefs/UI-COMMON.md; NO commits or pushes; never touch rpg_battle.
Heads: Story Block `stage33/cast` 4d4525c (on main 0b23c3f, 2.14.0) · Story Director `stage33/cast` 57b882b (includes
Key people 96ea544) · NPC State Delta `stage33/cast-nsd` c8fca1a (cast dossier + secrets + Key people 899f787) ·
Story Studio `stage33/cast` 66a7025 (vendored SB 8d648ba). Read C-COMMON.md, CS/CD/CN1/CN2/ST.md, the V2_LOG 1 Nov
entries from "Encounters redesign" on, mockups u7 (https://claude.ai/artifact/5vg7j6CL5zchoC2Rc5tuJE) and u8
(https://claude.ai/artifact/8CxMF61T35t5jcqTxALpN4). Fixture: suite-notes/ersveil-cast/cast.json (12 people, 51 secrets).
Blocker bar: an ordinary-use path that loses or corrupts saved data, crashes or wedges, gives wrong results against
the agreed design, or LEAKS A HIDDEN VALUE (unmet cast names/places to the reader or narrator; locked secret text to the
reader anywhere on screen — dossier, cards, World, What's sent, toasts, Studio preview; secret text in a visible field).
Check at least:
1. All four repos: check, full test suite, diff --check vs their base; NSD compat + smoke by hand.
2. Byte-identity: with no cast pack (SB/SD/NSD), with the secrets setting off / no secrets (NSD), prompts unchanged vs main.
3. Pack: cast kind validation, portraits (multi-file + .zip; refusals: zip-slip, oversize, unknown file, bad type),
   removal with the pack, `packs.portrait`; compact pills on phone (30px drawn, 44px tap, no overlap).
4. SD: join/sync on pack update (new / changed unmet / removed unmet / met stay), off-screen moves only on day change
   or ≥6h skip, meetings by place+routine and by drawnTo, new-faces cap, never in a fight (combat.session AND Lean RPG
   foes), unmet death setting/canDieUnmet, swipe keeps who you met, place match name/slug/alias, screens per mockup.
5. NSD: dossier at the first meeting the same reply (portrait, badge, block, Pin button only when SD offers it),
   pack words kept, secrets: meter + `when` unlocks, scan event watch, `npc.open` (story vs hand; held), generated
   2–5 layers (setting on/off), locked notes injected with never-reveal wording and nearest-first under budget,
   Secrets section (no titles/event words while hidden), redactSent in What's sent (view + copy), one-pass/backfill paths.
6. Replay across all: swipe, Re-read, middle delete, rebuild == live == reload for cast state, meetings, dossier
   creation, secret opens.
7. Studio: Cast part per mockup, portrait shrink, secrets editor, export .zip → import into Story Block (real ST) →
   meet a person → dossier with portrait; round-trip of the 12-entry fixture.
8. Browser on your own test ST (free port, e.g. 8188; own data copy; PID files), desktop + phone, with a scripted mock
   model: import a cast pack (.zip from Studio), meet two people (place and drawnTo), time skip, pack update, pin one,
   open a secret by meter and one by event; console errors.
Report: verdict BLOCK/OK, blockers with exact repro, follow-ups ranked, counts; copy at $S/rv-c/REVIEW.md
($S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad).
