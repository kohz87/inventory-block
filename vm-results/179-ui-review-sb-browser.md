# UI cleanup review (rv-ui1): SB stage29/ui-merge + browser of all three

Heads: SB `stage29/ui-merge` 36f31d8 (base 121e49a), SD `stage29/ui-b` f9a1969 (base 4b188c3), NSD `stage29/ui-d` 3d93827 (base 13daee6).
Own test ST port 8171 (pid 19618, stopped). Shots in shots/. No commits, no pushes.

## Verdicts
- Story Block ui-merge: OK (no blockers)
- Story Director ui-b (as seen in the browser + test counts; code review is rv-ui2's): OK
- NPC State Delta ui-d (same): OK

## Test counts
- SB: check 0; npm test 4202 tests / 4186 pass / 0 fail / 15 skipped / 1 todo
- SD: check 0; npm test 994 tests / 992 pass / 0 fail / 2 skipped (base 4b188c3: 981 / 979 / 0 / 2). No test lost: 994 was the total, 992 is pass. The 2 skips need STORY_BLOCK_DIR.
  With STORY_BLOCK_DIR = the new SB: 994 / 993 pass / 1 FAIL (see follow-up 1).
- NSD: check passes; npm test 1520 tests / 1515 pass / 0 fail / 5 cancelled (base 13daee6: 1511 / 1506 / 0 / 5 cancelled, same 5, pre-existing); npm test exits 1 because of them, so its last two steps do not run; compatibility-check and runtime-smoke run by hand: exit 0.
- SB tests removed: 7 test() names, all replaced by updated versions on purpose (RPG-off block tabs, Home stretch, phone header, pinned hint, cards toggle signature, "N edits of yours"). None skipped or weakened.

## Blockers
None found.

## Follow-ups, ranked
1. SD's own test "status card: each reply's card is drawn from that reply's state" fails against the new SB (STORY_BLOCK_DIR). Test-harness only: its render() caches compiled templates by screen.id, and SB's new per-card summary draw passes the same id with the summary template, so the body shows the summary text; it also calls toggle(index, screenId, open), the old signature. Real browser is fine (SB's own cache is keyed by template). Fix in SD before its CI runs against SB 2.12 (key by template, call toggle(index, open)). Host contract note: a host render() must not cache by screen.id alone.
2. Ownership (check 4): SB adds SD ids/words: DEFAULT_BAR in src/v2/view/screens.js names 'story-director/quests', '/world', '/map'; the Tabs help text and a Home comment say "Story Director's World/quests"; a comment cites '{{ q.status.summary }}'. Tests use SD ids as fixtures. Suggest the bar default come from the screen's own flag (e.g. `bar: true`) or by last id part like Party/Fight. No NSD ids/words. The card path is clean (heading = card's own title, summary = card's own slot).
3. Picking a preset writes explicit true/false for every changed switch (also back to Standard), so a later default change by a module will not reach that reader (stored map grows: 16 entries after Lean then Standard). Story state untouched (chat hash identical through Lean, Full, Standard). Consider clearing the stored choice when it equals the default.
4. RPG off: Settings → Blocks still says "Shown by the RPG in the Party tab / Party tab (RPG)" for the RPG-role blocks, but no Party tab exists then (bars are gone too, as intended). Wording only.
5. Phone bar with RPG on is Home, Party, Inventory, Quests, More (World and Map under More); desktop shows all. Lead accepted this already.
6. World → Now: "HERE" heading is left with no lines under it (just a bare heading above People here) once SD dropped place/time/weather. Cosmetic.
7. Old SB + new SD/NSD: Versions says "2 out of step / Newer than this Story Block" and the console warns once per feature: "presets" ... is not a feature field this Story Block knows (7 warnings). Expected; the release must order SB first (already planned).
8. Phone dossier window: header is still translucent (pre-existing, lead knows).
9. Story panel strip is capped at 4 + More even on desktop, so a screen the reader moves "In the bar" can still land under More there when the strip is full (Chronicle moved into the bar, not in the panel's four). Game view bar honours it.

## Check by check
1. Counts above.
2. Off/on and presets. Lean, Full, Standard, Lean, Standard picked in the real UI: chat state hash (chat_metadata + every message's extra) identical before/after each pick; story-block.rpg / encumbrance / inspector / extractor / hud / cards / savepoints untouched (presets:false); tile sizes Lean 3,707 / Standard 4,394 / Full 4,477 (Lean 4,254 with the older SD); Custom tag appears after one switch and Standard re-selects when it is flipped back; one-slower-reply note shown. Default-on prompt: the "exact text" in the What's sent footer is byte-identical (cmp, 9,240 chars) between all three at base and all three at the branches, with the Features page opened first (the counting leaves nothing behind). Footer 887 of 1,500 / 5,718 in all in both. Rebuild == live == reload for the threads-off case is covered by SD's tests (pass); in the browser, edits and switches reload to the same screens.
3. Hidden values. Threads on vs off over Home, Inventory, Quests, World, Map, Chronicle, Director (Behind the scenes still behind Reveal), Dossiers, Party, More sheet and the This reply card: nothing new shows in either state. Off removes World News/Factions, the Chronicle tab and the Behind panel; Director keeps Arc/Quests/Hooks. No secret, agenda or beat text anywhere reader-facing. The closed This reply line carries only changes plus "time, place".
4. Ownership: see follow-up 2.
5. Browser (desktop 1440x900 and phone 390x844), no console errors beyond ST's "Settings not ready" warning:
   - Header: place, time, weather, "Here: names", XP and vitals bars with RPG on, pencils on place/weather/people (and wearing/condition). Edited place + weather + people on desktop and phone, they stick after a full reload; originals restored. Phone wraps the row (no "Bluewatch Vi...").
   - Tabs: bar Home, Party, Inventory, Quests, World, Map, Fight (a fight is on in the test chat), More = Chronicle, Director, Dossiers; with RPG off no Party/Fight and no role-block tabs, vitals hidden, back on restores all and the chat hash is identical. Tabs & Packs "In the bar / Under More" select per row: Chronicle into the bar and Quests under More took effect in the game view at once, stored as inBar/underMore, survive reload; Reset to default works.
   - This reply: closed one line "..., 1:30 pm, Bluewatch Village", full text in title; open shows "Changed this reply" then "Where things stand".
   - Features presets: all three tiles, Custom, phone layout ok.
   - NSD: closed folds Scanning, Roster & continuity, Meter presets, Portrait generation, Data & maintenance, Expert (with its note, Source of truth / Calendar / Scanner rules / What's sent / Advanced inside). Phone dossier is full width and centred, tabs and relationship block reachable.
   - RPG on: hero bars, Party, Fight all draw.
6. Compatibility (same chat, same prompt compare): new SB + old SD/NSD: no errors; sections titled "Status", closed line without the time/place part; old SD still shows scene lines (duplicates with the hero); prompt identical. Old SB + new SD/NSD: loads; only the "presets" warnings (follow-up 7); Where card on Home, old cards; prompt identical; features (threads etc.) work, no tiles (old SB).
