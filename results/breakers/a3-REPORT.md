# Breaker a3 (live angle) — Story Suite v2, pass 2 — live settings and screens

Heads: Story_block 6ae03aa, rpg_battle 73b3cbb, Story_director ad7d396, npc_state_delta 37addac (clones in /home/user/cell/a3/).
Live: SillyTavern 1.19.0 + mock model (instance a3, ST 8301, mock 5301), Playwright + preinstalled Chromium, one browser at a time.
Scripts: /home/user/cell/a3/out/scripts/ (lib.mjs driver, uiaudit.mjs + walk.mjs = overflow/blank/dead-control audit and
click-all ported from the previous a3, matrix.mjs, diag.mjs, wizard.mjs, lines.mjs, features.mjs, fight.mjs, unload.mjs).
Logs: /home/user/cell/a3/out/scripts/run-*.log, *.errors.json. Shots: /home/user/cell/a3/out/shots/.
Not refiled (known from the previous pass): NSD "dossier scan failed" console.error with stack on an empty side answer (prev a3-4),
the DOMPurify type= loss (fixed in #120, verified fixed live: wizard cards are buttons, pick/unpick works).

## Findings

### B-a3-1 [severity: medium] Unload saving counts UTF-16 units, not bytes: a non-English chat's keepalive save is refused by the browser and nobody is asked
- repo: Story_block
- file:line: src/v2/chat-file.js:49 (`keepalive && text.length <= KEEPALIVE_MAX`), src/v2/runtime.js:146 (`keepaliveFits`: `JSON.stringify(...).length + 256 <= KEEPALIVE_MAX`), used by saveOnUnload (runtime.js:303-330, #128).
- repro: (unit) tests/Story_block/a3-keepalive-counts-chars-not-bytes.test.js: one reply of ~25k Japanese characters (≈74 KB as UTF-8, <61,440 code units). `createChatFile().write(..., { keepalive: true })` sends it WITH keepalive; `storeSaving().keepaliveFits()` returns true. (live) scripts/ka.mjs in SillyTavern 1.19 / Chromium: `fetch(url, { method: 'POST', body: '雨'.repeat(30000), keepalive: true })` and even `'雨'.repeat(20000)` (60 KB) → `TypeError: Failed to fetch` (rejected before sending); 50k ASCII goes out. scripts/unload.mjs builds a 58k-unit / 161 KB CJK chat: beforeunload shows no prompt (fits() says it fits). (The end-to-end loss was not reproduced in headless because the command's own immediate save landed before the close; the loss needs a close inside the debounce window or a pagehide/hidden save.)
- expected: a body over 64 KiB **in bytes** never goes with keepalive, and beforeunload asks (as #128 does for big ASCII chats).
- actual: for CJK/emoji/Cyrillic-heavy chats between ~21k and 61k code units (most such chats) the keepalive save is rejected by the browser at once, beforeunload does not ask, and the hidden/pagehide save (the whole point of #128) silently fails.
- invariant: 7 (saves never lose a reply's state).
- suggested fix: measure bytes: `new TextEncoder().encode(text).length` (or a cheap UTF-8 length loop) in chat-file.js post() and in keepaliveFits(); keep some margin under 64 KiB for headers (Chromium's quota is shared by in-flight keepalive requests; 60 KB of CJK was refused live, so 60 KiB of bytes may already be too close).
- test: tests/Story_block/a3-keepalive-counts-chars-not-bytes.test.js (2 failing cases; verified failing in /home/user/cell/a3/Story_block).
- owner: SB persistence (unload / chat-file).

### B-a3-2 [severity: medium] Settings → Diagnostics report contains chat text (story item names, text around quotes in Problems)
- repo: Story_block
- file:line: src/v2/diagnostics.js:65-72 (`QUOTED` + scrubLine only blanks text inside a balanced pair of quotes), :311 (Problems' messages), messages built in turn.js / domains (e.g. "There is no {name} in the inventory.", "The party has only 0 {currency}s").
- repro (live, scripts/diag.mjs 1440 norb and 390 norb; SB+SD+NSD): reply with `<Changes>` `- item NOPEMARK_9 | qty: 1` → Settings → Diagnostics → Copy report and Save report both hold `- [NOT_FOUND] story-block, reply 4: "[26 characters]" was not used: There is no NOPEMARK_9 in the inventory.` (scripts/diag-report-1440-norb.txt). Unit: a line `- item Bob's "Lucky" mug of LeakyWords | qty: 1` gives `"[13 characters]"Lucky"[27 characters]" ... There is no Bob's "[5 characters]" mug of LeakyWords in the inventory.` — the quote mark in the story text breaks the pairing so `Lucky` survives too.
- expected: "no chat text" (diagnostics.js header, CHANGELOG, MODULES §F116–F118): a Problem shows its code, where, and a fixed sentence, not the story's words.
- actual: names the story wrote (items, people, places in refusal sentences) are copied verbatim; quoted runs inside a quoted line leak. Also the report copied/saved is rebuilt on click, so it can differ from what the reader saw (timestamps differed live; a Problem arriving in between would be shared unseen).
- invariant: the Diagnostics privacy contract (no chat text), F116–F118.
- suggested fix: do not print Problem messages free-form: report `code`, module, reply index and, if wanted, a per-code fixed sentence (or the message with every substring of the stored `line` replaced by its length, then scrubLine), and replace `QUOTED` with a scrub that removes from the first quote to the last quote on the line. Copy/Save the text currently shown (rebuild only on Refresh).
- test: tests/Story_block/a3-diagnostics-problems-leak-chat-text.test.js (2 failing cases, real Problems through the testkit → buildReport).
- owner: SB diagnostics.

### B-a3-3 [severity: low] Diagnostics keeps common API-key shapes found in settings text
- repo: Story_block
- file:line: src/v2/diagnostics.js:46-54 (SECRET_VALUE)
- repro (live, scripts/diag.mjs): put `era Xq7L…(fake 32-char key)` (a 32-char mixed-case key, Mistral-style) in Story Director's calendar era, `AKIA…(fake AWS example id)` (AWS access key id) in RPG Battle's XP word, `sk-FAKE12345` in an NSD stored value → all three appear verbatim in Copy report / Save report. (Held: `sk-ant-…` and a key named `openaiApiKey` were removed.)
- expected: "no API keys/secrets": any key-like token removed.
- actual: only hex ≥32, base64-ish ≥40, and a few prefixes are caught.
- invariant: Diagnostics contract (no keys).
- suggested fix: add patterns for mixed alphanumerics ≥ 24 with both letters and digits (`\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9_-]{24,}\b`), `AKIA[0-9A-Z]{16}`, and any `sk-`/`pk-` token of ≥ 8 characters; the false positives (long ids) cost nothing in a bug report.
- test: tests/Story_block/a3-diagnostics-key-shapes-kept.test.js (2 failing).
- owner: SB diagnostics.

### B-a3-4 [severity: low] "Create your character" never shows on the card under a reply (the one case it can: RPG Battle added to a chat with replies)
- repo: rpg_battle (screen) / Story_block (card host)
- file:line: rpg_battle/src/v2/screens/status-card.js:30 (`data-if="len(state.party.order) == 0"`), entry added in #99 (37c7728).
- repro (live, scripts/replycard.mjs and scripts/cards-reload.mjs add, 390 and 1440): Story Block alone, new chat, two replies; enable RPG Battle (+SD, NSD), reload, open the chat. The HUD strip shows "Create" and Home/Party show "Create your character", but the replies' cards (Changed this reply / Status → "PLACE Quay") have no RPG Battle part and no Create button. Since RB holds generation until a character exists, there is no other way to get a reply with an empty party, so the reply-card entry is unreachable.
- expected: per #99, the card under a reply offers "Create your character" while there is none (at least on the latest reply).
- actual: absent; nothing throws. Other entries work (HUD strip, Home "Before you start", Party empty state; a second click while the wizard is open never stacks a second dialog).
- invariant: none of 1-8 (UI promise).
- suggested fix: draw the status card's empty state when `state.party` is missing (`state.party == null || len(state.party.order) == 0`) and let the host draw module cards for replies whose stored state predates the module (or restrict the promise to the latest reply).
- test: live only (scripts/replycard.mjs, scripts/cards-reload.mjs; shot shots/card-status-1440.jpg).
- owner: RB-screens2.

## What held up
Matrix (scripts/matrix.mjs = new chat, wizard character when RB is on, two replies with `<b>MARK</b><img onerror>` markers in
story text, item, NPC and quest lines, then walk.mjs: every panel tab, every game-view screen, every settings fold opened
(18–37 folds), click-all of every non-destructive control, cards under replies opened; audit for document
scrollWidth > innerWidth, off-screen elements, unlabeled/tiny controls):

| modules        | 390 px | 1440 px |
|----------------|--------|---------|
| SB alone       | clean  | clean   |
| SB + RB        | clean  | clean   |
| SB + SD        | clean  | clean   |
| SB + NSD       | clean  | clean   |
| all four       | clean  | clean   |

Harness caveat: the first matrix pass ran before I found SillyTavern's first-run welcome popup was holding its init
(characters loaded by hand, settings saves deferred); the all-four row was re-run at both widths after the fix
(lib.mjs welcome()) with the same clean result, and every targeted script below ran after it.

688 control clicks in the matrix (plus the targeted scripts); 0 pageerror, 0 console.error from our code (only the
already-filed NSD "dossier scan failed" with stack, prev a3-4), no sideways scroll at either width on any surface,
`window.__xss` never set, no blank screen/pane. The only audit flags were the Features overview's 1x1 switch inputs
(visually hidden checkboxes with a visible switch/label: false positive), and "Create your character" on Home
reported dead only because the wizard was already open (dialog.current() refuses a second dialog — correct).

Targeted, all at 390 and 1440 unless said:
- Diagnostics (diag.mjs): Copy (clipboard) and Save (download `story-suite-diagnostics-YYYY-MM-DD-HHMM.txt`) work;
  the report box wraps (pre-wrap, scrolls inside, never widens the page at 390); a settings key named like a key
  (`openaiApiKey`) is left out and listed; `sk-ant-…` replaced; no user message, reply text, NPC name, place or quest
  title appeared — only refused-line Problems leak (B-a3-2). NSD's own section has no names or prompts.
- Assist profile dropdown (lines.mjs): "Same as chat" + Connection Manager profiles by name, a profile named
  `<b>MARK</b><img onerror>` drawn as text, duplicate names shown once, pick stored by name and kept after reload; a
  deleted profile stays as "Fast helper (not found)" with the plain "not in the Connection Manager any more" note;
  no profiles → "There are no connection profiles yet" note. NSD scanner profile: lists profiles after load, its
  "no connection profile yet" note shows with none and hides with some (it refreshes on Connection Manager events,
  which a direct settings poke in the script bypasses — not a bug).
- Lists as text (lines.mjs): blank lines, CRLF, leading/trailing spaces, `<b>MARK</b>` names (stored and shown as text),
  "Day: of Ash: 29" (extra colons go to the name), "Soul Class II: 11" ranks, "penny/pennies: 1" coins; a bad line
  ("B: 0") is named and the stored list is untouched; 100 lines ok, 101 refused by line; 20,000 lines refused in 65 ms;
  a 200k-character line cut to the field's max in 60 ms; Edit as rows / Edit as text round-trip on all four lists
  (months, ranks, coins, carry items); all four identical (stored and shown) after reload. (Node probe: a line ": 30"
  is accepted as a month/coin with an empty name — not filed, cosmetic.)
- Features fold (features.mjs): one sub-fold per module A–Z with "N of M on"; the filter (by name/description) for
  "fight", "DIGEST", markup, regex characters, whitespace, 100-char nonsense ("No feature matches …"), restores the
  hand-opened state when cleared, keeps the filter and focus while a switch is toggled under it; every module's
  "Features: N of M on — change" opens its sub-fold (clearing a filter that hid it). NSD settings: max depth 2
  (module fold → its groups), 79 controls.
- Prompt-size panel: instructions / this reply / in all, context size and share; Share clamps 0/-5/4.5 → 10, 95 → 90;
  tail budget 99,999,999,999 → 20,000; the "too small" line comes and goes with the share. Observation (not filed):
  with all four modules at defaults and SillyTavern's default 4,095 context, the instructions (~2,300 tokens) are over
  the 40 % share, so every new all-four chat starts with "Your context size … is too small".
- Create-your-character entries (wizard.mjs): HUD strip "Create", Home "Before you start → Create your character",
  Party empty state: each opens exactly one wizard (a second click while open does not stack); only the reply card is
  missing (B-a3-4).
- RB wizard: race cards are buttons with aria-pressed; pick → unpick (click again) → pick another; talents: max 2,
  others disabled at the cap and re-enabled on unpick, points left follow (10→9→8→9); Random talent rolls/"Keep it";
  stats steppers spend to 0 with "−" disabled at the floor; You step review lists race/talents/stats; Create → dialog
  closes, toast "User is ready — User (Dwarf; Keen Eyes) is ready. See them on the Party screen.", the story is no
  longer held (next send goes through). With no race picked the You step says "Choose a race." (Create refused).
- Fight + last fight in parts (fight.mjs, SB+RB and all four, 390/1440): offer from `! encounter 2 Weir Rat <markup>`,
  Fight → Attack + target cards → Victory → Finish → the Fight screen shows "Last fight": result line, member row with
  HP/MP/SP, key moments, foes defeated/fled, loot, XP; foe names with markup render as text; no overflow at 390.
- NSD Cast in SB's game view: the Cast screen beside the Cast tab draws the same cards, its control clicked at both
  widths, no errors.
- Unload: scripts/unload.mjs (CJK) and ka.mjs — see B-a3-1. Settings persisted across reloads once SillyTavern's
  first-run welcome popup is dismissed (harness note: until it is, ST never finishes init, characters are not
  loaded and every settings save is "Settings not ready"; lib.mjs `welcome()` handles it).

Exceptions from our code across all runs: 0 (excluding the known NSD scan error line).
Instance stopped at the end (ST 8301, mock 5301).
