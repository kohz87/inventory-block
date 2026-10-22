# a1 — new capture and display kinds, replay (story-suite break pass 2)

Heads: Story_block 6ae03aa, rpg_battle 73b3cbb, Story_director ad7d396, npc_state_delta 37addac (clones in
/home/user/cell/a1/, branch v2). Nothing pushed. Every test below was copied into the matching clone's
tests/v2/break/ and fails there with `node --test` on the asserted invariant (setup asserts pass). None is a
duplicate of a test already in those folders (checked by name and content: grep for stray/choice/chatter/
coins/maxJump+Continue). Previous-pass findings (final-FINDINGS.md) are not refiled.

Summary: 16 findings, 0 critical, 0 high, 6 medium, 10 low; 16 test files (31 failing cases). Owner areas: SB-capture
(#123 stray lines, hidden comment, Continue) 8, SB-extras 2, SB-inv (coins) 2, SD 2, RB 1, NSD 1. No replay/rebuild
divergence in 125 host fuzz seeds; the replay-type findings are all Re-read (re-capture) differences, middle-delete
rules (NSD) and Continue (SD) — see "Fuzz totals".

| id | sev | repo | title |
|---|---|---|---|
| B-a1-1 | medium | SB | dialogue "+ coin 5, she said …" taken from the story and paid |
| B-a1-2 | medium | SB | change lines in code fences / blockquotes / HTML taken and cut out |
| B-a1-3 | low | SB | Re-read of a stopped reply takes the cut story line live refused |
| B-a1-4 | low | SB | display caps recounted per Continue, extra lines dropped silently |
| B-a1-5 | low | SB | choices told "not used" (feature off) are shown once it is on |
| B-a1-6 | medium | SD | maxJump (and the per-reply turn) resets on every Continue |
| B-a1-7 | low | SB | "+ item Silver Coins", "? loot 2 gold pieces" become items, not money |
| B-a1-8 | low | SB | currency name outside Coins read as the smallest coin |
| B-a1-9 | low | SB | "– coin 5", "− coin 5", "＋ coin 5", "+ coins 5" near misses not told |
| B-a1-10 | low | SB | Re-read after a Continue takes far story lines live refused |
| B-a1-11 | medium | SB | hidden comment turns "--" into "- -": Re-read changes names/notes/foes |
| B-a1-12 | low | SB | story line with a <Changes> tag in it reads differently on Re-read |
| B-a1-13 | medium | RB (+SB) | story-time heal kept after the time is edited out and Re-read |
| B-a1-14 | low | SB | block cut mid-line by length: half line applied, rest unreadable |
| B-a1-15 | medium | NSD | middle delete: new reply inherits the old meter window by index (cap bypassed) |
| B-a1-16 | low | SD | quest rewards in coins under-read ("1 gold 5 silver" → 100, "3 gp" → 3) |

## Findings

### B-a1-1 [severity: medium] A line of dialogue that starts like "+ coin 5" is taken from the story, pays, and is cut out of the story
- repo: Story_block
- file:line: src/v2/capture.js:509-526 (strayClass: 'C' when the line starts with a known head and `parseLine` parses), :596 (taken); src/v2/domains/money.js parseNumber (no coins: words after the number are ignored)
- repro: core host (no Coins), `host.send('Pay me.', 'Fenna laughed at him.\n\n+ coin 5, she said, and not one more.')` (also with a `<Changes>` block after it).
- expected: a sentence of dialogue is story ("a mention in a sentence is neither", SPEC "Change lines written in the story"): wallet 0, the line stays shown.
- actual: wallet 5; the spoken line is removed from the story and kept in the hidden comment as a change line. With a block after it, same (50 paid for "+ coin 50, she said, ...").
- invariant: 3 (model prose sets a number outside the narrow #123 rule), and story text vanishes from the reader's view. (By the letter of #123 the line "starts exactly as a kind's grammar line does and parses", because the coin amount reader ignores the words after the number; the break brief lists such dialogue as prose that must never be taken, so this is filed for the owner to decide the rule.)
- suggested fix: For a line found in the story (not in a block), require a clean change line, not just one `parseLine` accepts: no sentence after the name/amount (refuse a name part holding `, ` followed by words, closing quotes, or ending in `.`/`!`/`?` after words), and for `coin` require the amount to be the whole name (`^\d[\d,]*(\s+<coin word>)?$`). Lines that fail become a STRAY Problem and stay in the story. Consider making parseAmount refuse extra words even without coins ("+ coin 5 fish" pays 5 today).
- test: tests/Story_block/a1-stray-dialogue-coin.test.js (2 cases)
- owner area: SB-capture (#123 strayLines)

### B-a1-2 [severity: medium] A change line inside a code block or a blockquote is taken and cut out (an empty fence is left)
- repo: Story_block
- file:line: src/v2/capture.js:528-541 (strayLines blanks reasoning, hidden comments and blocks only; fences, indented code and `>` quotes are scanned as story), :114 stripMarkdown / stripDecoration
- repro: `host.send('What does the ledger say?', "He showed the ledger's format:\n\n```\n+ coin 40\n```\n\n<Changes>\n~ place Bluewatch Village\n</Changes>")`. Same with a `~~~` fence, a 4-space indented line, and `> + coin 40`.
- expected: quoted and code text is something shown (a note, a letter, an example of the format); it stays in the story and pays nothing (at most a STRAY Problem).
- actual: 40 coin paid each time; the shown story keeps an empty ``` fence (or loses the quote line). Also taken: lines inside `<details>`, `<style>`, a multi-line `<!-- … -->` author comment, a hidden `<div>`, and even inside a multi-line HTML attribute value (scripts/stray-probe.mjs, htmlcomment.mjs).
- invariant: 3 (prose mints) and the reader's story text is changed.
- suggested fix: In strayLines, blank fenced code (``` / ~~~ pairs; an unclosed fence to the end), indented code (4 spaces or a tab after a blank line) and blockquote lines (`^\s*>`) before classifying, as reasoning is blanked (places kept), so none of their lines is ever taken; optionally tell them as STRAY. `<details>`/`<style>`/`<pre>` elements can be blanked the same way.
- test: tests/Story_block/a1-stray-code-quote.test.js (4 cases)
- owner area: SB-capture (#123 strayLines)

### B-a1-3 [severity: low] Re-read of a stopped reply takes the last story change line the live capture refused
- repo: Story_block
- file:line: src/v2/turn.js:679-693 (reread: `extractBlock(mes, 'Changes', null, { heads })` and `strayProblems(index, mes, heads)` with no `stopped`), src/v2/capture.js:594 (cutStart only when `stopped`)
- repro: `host.send('Open it.', 'A purse lies in the mud.\n\n+ coin 12', { stopped: true })` → wallet 0 and STRAY "stopped in the middle of it" (live). Then `host.turn.reread(last)`.
- expected: Re-read reads as the live capture did (SPEC: live, Re-read, swipes, Continue and the rebuild read the same): wallet 0.
- actual: wallet 12 after the Re-read. For a block, the cut line is dropped from the hidden body so a Re-read never sees it; a refused stray line stays in the story with nothing marking it as cut. At capture.js level (scripts/stop-idem.mjs, 140,000 random stopped replies) every live/Re-read difference is of this kind; an open block's cut line never differs. Likewise when a Continue finishes that line ("+ coin 1" + Continue "2"): the Continue reads nothing before `from`, so nothing is taken or told live, and a Re-read later takes "+ coin 12".
- invariant: 1/2 (Re-read of an unedited reply changes the state).
- suggested fix: When the live capture refuses a stray line as cut, remember it: move it into the hidden comment marked cut (like an open block's unfinished line, CUT_MARK), or store it in the record (`record.cut`) and have reread/strayLines skip a last line equal to it. A Continue that finishes it should read the joined line as its own (from the start of that line).
- test: tests/Story_block/a1-stray-stopped-reread.test.js
- owner area: SB-capture / SB-turn

### B-a1-4 [severity: low] Display-kind caps are counted afresh by each Continue: the 5th choice and 4th thought are dropped with no Problem
- repo: Story_block
- file:line: src/v2/turn.js:591 (`const shown = new Map()` per capture call), :613; src/v2/extras.js:130-145 (displayLines reads the whole reply, keeps the first 4 / 3)
- repro: Choices and Inner chatter on. Reply: 3 `? choice` + 2 `~ chatter`; Continue: 2 more choices + 2 more chatter lines.
- expected: extras.js: "the first lines in reply order are kept, the rest get a Problem" — `? choice Hide` and `~ chatter Fenna: four` told LIMITED.
- actual: the display shows Climb, Knock, Wait, Run and three thoughts; nothing is told about Hide or "four".
- invariant: 4 (a line dropped silently).
- suggested fix: For a Continue (and a Re-read), seed `shown` with the counts of the reply's display lines already kept (displayLines over the text before `at.from`, or the hidden comment) so the cap holds for the whole reply.
- test: tests/Story_block/a1-display-cap-continue.test.js
- owner area: SB-extras (MODULES §F115)

### B-a1-5 [severity: low] Choices told "not used" while the feature was off are shown when it is turned on
- repo: Story_block
- file:line: src/v2/turn.js:606 (FEATURE_OFF "was not used" for a display kind too), src/v2/extras.js:139 (`entry.off` is the feature now, not at capture)
- repro: Choices off; reply with `? choice Open the door`, `? choice Go back` → two FEATURE_OFF Problems ("was not used: Choices is turned off"). Turn Choices on.
- expected: a line told as not used is not shown later (or is not told as not used).
- actual: the latest reply now shows both choices as buttons.
- invariant: 4 (told one thing, shown another); minor.
- suggested fix: Either do not tell FEATURE_OFF for display kinds (they are re-read on every draw, so "off" only hides them), or keep display lines read while their feature was off out of the hidden comment (or marked) so turning the feature on does not resurrect them. The first is simpler and matches "what is shown is read again from the reply's hidden block".
- test: tests/Story_block/a1-display-off-then-shown.test.js
- owner area: SB-extras (MODULES §F115)

### B-a1-6 [severity: medium] maxJump per reply resets on every Continue: one reply moved the story clock 90 days
- repo: Story_director
- file:line: src/v2/tracker/capture.js:85 (beginTurn: `fresh = reply !== turn.reply || (index >= 0 && index <= turn.index)`), :375-380 (applyTimeLine `from`)
- repro: SD with fakeRpgBattle (vendored testkit). `~ time March 3, 8:00 am`; reply `! time +30d` (30 days); Continue with `<Changes>! time +30d</Changes>`; Continue again → 90 days. With all four modules and the Ersveil pack: the same, also when the Continue writes the line bare in the story.
- expected: C2-5 "maxJump holds for the whole reply": a reply and its Continues move the clock at most 30 days.
- actual: 30 more days per Continue. A Continue's lines are numbered from 0 again, so `index <= turn.index` starts a new reply turn with a fresh `from`. The rest of the per-reply draft resets too (scripts/sd-turn.mjs, all four modules): each Continue adds 1 to `director.turn.n` (the turn count that tracker rules and `message` positions use) and starts a new `turn.now` entry with `paid: 0, added: 0, vouched: null` for the same reply id (`sw_…`).
- also: a Re-read after a Continue gives a different `director.turn` than live (live counted the Continue as one more turn: n 18 vs 17), 29 of the 87 Re-read differences in scripts/reread-fuzz.mjs (rr.log).
- invariant: 3 (a per-reply cap bypassed by model text); 1/2 (Re-read after a Continue differs from live). Time drives RB recovery (6 h at once is a full rest), effects' `until`, quest due dates, market days.
- suggested fix: In beginTurn, when the host gives the reply's record id (carrierKey → `sid`, which a Continue keeps), decide "same reply" by `reply === turn.reply` alone; keep the `index <= turn.index` test only for hosts that give no id. A Re-read already starts from the state before the reply (turn.reply there is the previous reply), and a swipe has its own sid, so both still start fresh.
- test: tests/Story_director/a1-time-jump-continue.test.js
- owner area: SD-tracker (time)

### B-a1-7 [severity: low] With Coins, "+ item Silver Coins", "+ item Silvers" and "? loot 2 gold pieces" become items, while "+ coin 3 silver coins" is money
- repo: Story_block
- file:line: src/v2/domains/money.js:104-121 (coinValue drops "coin(s)/piece(s)/of/in" and reads "<coin>s"; isCurrencyName wants the exact name or plural), src/v2/domains/inventory.js:773 (loot), :1461 (item → coin)
- repro: Coins copper 1 / silver 10 / gold 100. `+ coin 3 silver coins` → +30. Then `+ item Silver Coins | qty: 3` → a "Silver Coins" x3 stack; `+ item 3 silver coins` → a "3 silver coins" stack; `+ item Silvers | qty: 3` → a "Silvers" stack; `? loot 2 gold pieces, Rope` → an item "2 gold pieces" offered, no coin. Also `? loot 1 gold 5 silver, Rope` offers an item "1 gold 5 silver" (scripts/loot-forms.mjs).
- expected: the same words mean the same money on every path: +30 copper each; the loot offers 200 copper.
- actual: money held as story items the wallet, prices and the per-reply coin budget do not see.
- invariant: 3 (money outside the wallet and its budget) / the one-currency rule (MODULES F1, §F108).
- suggested fix: Make isCurrencyName use coinValue's word rule (filler dropped, `<name>s` accepted), e.g. `isCurrencyName = (text, c) => coinValue(text, c) > 0`, so item, loot and coin lines agree.
- test: tests/Story_block/a1-coin-item-forms.test.js (4 cases)
- owner area: SB-inv (money, §F108)

### B-a1-8 [severity: low] With Coins that do not include the currency's name, "+ coin 2 gold" is paid as 2 of the smallest coin
- repo: Story_block
- file:line: src/v2/domains/money.js:111 (coinValue: the currency's own name/plural = 1), parseAmount
- repro: Story Block settings `coins: copper 1, silver 10`, currency name left at the default "gold". `+ coin 3 silver` → 30 (ok). `+ coin 2 gold` → 32 (2 copper paid). Also "+ coin 3 Gold Coins" → 3.
- expected: parseAmount's own promise, "any other word is refused, so no amount is read in the wrong coin": refused with "not a coin here".
- actual: paid as 2 copper, no Problem.
- invariant: 3 (an amount read in a coin the model did not mean, with no Problem).
- suggested fix: With coins, accept only the coins' names/plurals (the base unit's included), not the currency name unless it equals one of them; or have currencyOf rename the currency to the base coin when coins are set.
- test: tests/Story_block/a1-coin-currency-name.test.js
- owner area: SB-inv (money, §F108)

### B-a1-9 [severity: low] Near-miss story lines with a typographic op ("– coin 5", "− coin 5", "＋ coin 5") or a plural kind ("+ coins 5") are neither taken nor told
- repo: Story_block
- file:line: src/v2/capture.js:509-516 (strayClass: `/^([+\-~!?])([ \t]*)(\p{L}…)/` and `words.has(kind)`: only ASCII ops and the exact kind word)
- repro: `host.send('Go.', 'The hall.\n\n– coin 5\n\n<Changes>\n~ place Bluewatch Village\n</Changes>')` (same with U+2212 minus, U+FF0B fullwidth plus, `+ coins 5`).
- expected: SPEC: "A line close to one that is not taken (another op, a capital, no space or a colon after the op or kind …) is a Problem (STRAY)". The reader is told why the coin did not arrive.
- actual: no Problem at all; the line stays in the story silently (`+ Coin 5`, `+coin 5`, `+ coin: 5`, `~ coin 5` are told correctly).
- invariant: 4 (bad input silently ignored instead of a Problem).
- suggested fix: In strayClass, accept the dash/plus look-alikes (\p{Pd}, U+2212, U+FF0B, U+FE62/FE63) as an op for the 'N' (near-miss) class only, and treat `<kind>s` as a near miss of `<kind>`; they are told as STRAY and never taken.
- test: tests/Story_block/a1-stray-dash-nearmiss.test.js (4 cases)
- owner area: SB-capture (#123 strayLines)

### B-a1-10 [severity: low] Re-read after a Continue takes a story line the live Continue refused as too far up
- repo: Story_block
- file:line: src/v2/capture.js:539-543 (strayLines anchor: the first span after `from`; Re-read passes `from` 0, so the anchor is the original reply's hidden comment and every later paragraph is "after the block"), :556-560 (paragraph.start >= anchor → in region); src/v2/turn.js:690-693 (reread)
- repro: reply `The hall.\n\n<Changes>\n~ place Bluewatch Village\n</Changes>`; Continue `\n\n+ coin 7\n\nOne.\n\nTwo.\n\nThree.\n\nFour.\n\n<Changes>\n+ coin 1\n</Changes>` → live wallet 1 and STRAY "+ coin 7" (too far up). `host.turn.reread(last)`.
- expected: Re-read of the unedited reply gives the same state (SPEC: live, Re-read, swipes, Continue and the rebuild read the same): wallet 1.
- actual: wallet 8: the Re-read takes "+ coin 7". At capture.js level (scripts/cont-idem.mjs, 200,000 random reply + Continue pairs) 2,164 pairs read differently live and on Re-read: 2,150 of this kind (the Re-read reads all the live lines plus story lines of the Continue's text that sit after the reply's first hidden comment and were too far up for the Continue), and 14 of a related shape with the same root (the Re-read reads the reply and its Continue as one text): a paragraph that starts in the reply ("+ Coin 5", a near miss) and goes on in the Continue (" She waits.\n- present Kael") counts as "only change lines" on Re-read, so its `- present Kael` is taken, while live it was refused as part of a story paragraph (or a `+ coin 5` in it is no longer counted against the 3 paragraphs and is taken).
- invariant: 1/2 (Re-read of an unedited reply changes state); 3 (a line the rule refused is paid).
- suggested fix: Make "near" mean the same thing on both paths: in strayLines without `from`, measure the region against each block (the last 3 story paragraphs before every block, hidden or bare, and the text after the last one), or record in the reply's record which story lines were taken (their text) and let Re-read take exactly those. The second also closes B-a1-3.
- test: tests/Story_block/a1-stray-continue-reread.test.js
- owner area: SB-capture (#123 strayLines) / SB-turn

### B-a1-11 [severity: medium] Re-read reads "--" in a reply's change lines as "- -": names, foes and notes change on a Re-read of an unedited reply
- repo: Story_block
- file:line: src/v2/capture.js:351 (`commentSafe = text => text.replace(/-(?=-)/g, '- ')`, used by hideBlock for every kept body, block lines and #123 story lines alike); nothing undoes it when extractBlock reads a hidden pair again
- repro: core host. `host.send('Look.', 'A coil in the corner.\n\n<Changes>\n+ item Rope -- frayed\n+ item Lantern | note: tied -- twice\n</Changes>')` → items "Rope -- frayed" (note "") and "Lantern" (note "tied -- twice"). `host.turn.reread(last)` → "Rope" (note "- frayed") and "Lantern" (note "tied - - twice"). With all four modules: `! encounter 3 Weir Rat -- cellar pack | tier: weak` is offered as "Weir Rat -- cellar pack ×3" live and "Weir Rat ×3" after a Re-read (scripts/commentsafe2.mjs).
- expected: Re-read of an unedited reply gives the same state (SPEC: live, Re-read and the rebuild read the same).
- actual: a different item name (a new stack/def), a different note, a different foe name; Inner chatter shows "a - - b" for a thought written "a -- b" (scripts/display-idem.mjs). Present since the hidden comment was made comment-safe (#77), and now also for every story line #123 hides. Models write "--" for a dash routinely (the break harness's own reply generator, gen.mjs:172, writes ` -- ` for ` — ` as a known model drift).
- invariant: 1/2 (Re-read of an unedited reply changes the state).
- suggested fix: Make the escape reversible: write `--` as `-\u2060-` (a word joiner between) (or any marker the parser never sees) inside the hidden comment and strip that marker when a hidden pair's body is read back (extractBlock/hiddenPairs, continuation, displayLines), so the body read is byte-equal to what the live capture read. Keep the existing "- -" reading only for comments written before the change (or accept the one-off difference for old chats).
- test: tests/Story_block/a1-reread-double-dash.test.js
- owner area: SB-capture (hideBlock / hidden comment)

### B-a1-12 [severity: low] A story change line with the block's tag in it ("+ item Rope </Changes>", "+ item Rope <Changes>") reads differently live and on Re-read
- repo: Story_block
- file:line: src/v2/capture.js:541-555 (strayLines: a line is taken whole when it has `</Changes>` and no block opens; a line with a mid-line `<Changes>` is not a whole line), :361-384 (hideBlock wraps the taken line in `<Changes>…</Changes>`)
- repro: `host.send('Look.', 'The hall.\n\n+ item Rope </Changes>')` → live item "Rope </Changes>" (def story/rope-changes); Re-read → "Rope" (the inner `</Changes>` now closes the hidden block early). `host.send('Look.', 'The hall.\n\n+ item Rope <Changes>')` → live nothing (the tag opens an empty open block; hideBlock leaves "+ item Rope" alone in the story); Re-read → item "Rope".
- expected: the same items live and after a Re-read.
- actual: different items.
- invariant: 1/2; also markup-ish text kept in an item name.
- suggested fix: In strayClass, refuse (as STRAY) a story line that holds `<Changes` or `</Changes` anywhere; it is never a clean change line. Optionally escape the tag inside kept bodies the same reversible way as B-a1-11.
- test: tests/Story_block/a1-stray-tag-in-line.test.js (2 cases)
- owner area: SB-capture (#123 strayLines)

### B-a1-13 [severity: medium] Story-time heal stays after the time is edited out of the reply and Re-read (rested left past the clock)
- repo: rpg_battle (with Story_block's Re-read rule)
- file:line: rpg_battle src/v2/party/recovery.js:180-187 (`party.recover`, kept on the reply whose time it was), :192-199 (recoveryBeforeReply); Story_block src/v2/store.js:646-690 (replaceStory: "ui and system receipts stay, after the new story ops"; their ops are applied again on the new story state)
- repro: RB + a story clock (tests' CLOCK, or Story Director). `~ time 600`; `~ wound Ren — fell into the weir | harm: severe` (HP 45/90); reply R: `! time +8h`; next reply → the cue heals Ren to 90/90 (full rest) and moves `party.rested` to 1080, both kept on R. Edit R to "They do not sleep after all." and Re-read it.
- expected: the state as if R had never passed the time, as a middle delete of R gives (recovery.test.js "deleting the reply that moved the clock takes its heal back"): clock 600, HP 45/90, rested ≤ 600.
- actual: clock 600 (the story receipt is replaced) but HP 90/90 and rested 1080: the system receipt's ops are replayed after the new story ops. The next 8 story hours heal nothing. The same keeps any heal after a Re-read that shortens the time ("+8h" edited to "+1h").
- invariant: 2 (edit + Re-read do not restore the state of that point); 3 (a full heal with no time behind it).
- suggested fix: A cue derived from story state should be planned again, not replayed, when the reply under it is Re-read: let Story Block re-run `cause: 'system'` cue commands of the re-read carrier (or those a module marks `rerun: true`) after the new story ops instead of re-applying their stored ops; party.recover then plans from the new clock (nothing to heal, rested stays). Alternatively RB keeps the cue's receipt on the reply it runs before (the new reply), so a Re-read of the time reply leaves the heal to the next fold, which a clock set back already handles (rested stays, nothing healed twice) — but then the heal still stands, so the first fix is the one that restores the state. (SD's `time.settle` day digest kept on the same reply has the same shape, but the next reply's settle drops a day the clock is back on, so it heals itself one reply later; scripts/settle-edit.mjs. RB's heal never does.)
- test: tests/rpg_battle/a1-recover-kept-after-reread.test.js
- owner area: RB-party (recovery) / SB-turn (Re-read)

### B-a1-14 [severity: low] A block cut mid-line by the length limit applies the half line ("+ item Ro"), and the Continue's rest of it is unreadable
- repo: Story_block
- file:line: src/v2/capture.js:193 wholeLines / :207 cutLine (an open block's unfinished last line is left out only when `stopped`), :293 continuation (the Continue's first text is read as a line of its own)
- repro: `host.send('I search.', 'You find things.\n\n<Changes>\n+ coin 5\n+ item Ro')` (not stopped: the reply hit the length limit), then `host.cont('pe | qty: 2\n</Changes>')`.
- expected: the line the Continue finishes is read once, whole: "Rope" x2 (or, at least, the half line is held back until the Continue, as for a stopped reply).
- actual: a story item "Ro" x1; "pe | qty: 2" is not a change line. The same truncates amounts ("+ coin 5" + "00" pays 5) and names of foes, NPCs and quests. When the reader stopped the reply instead, the half line is left out (CUT_OFF) and the Continue's "pe | qty: 2" is UNREADABLE, so no Rope at all (scripts/stopped-join.mjs). (The earlier c2-continue-split-block test covers only the stopped reply, and only that no bare text is left.)
- invariant: 3/4 (a number or name the model never wrote is applied; the real line is dropped).
- suggested fix: Treat the last line of a block that is still open at the end of the reply, with no line break after it, as unfinished whether or not the reader stopped: leave it out, keep it in the hidden comment after the `open` mark, and have continuation() join the Continue's text up to its first line break onto it before reading. A reply that ends there with no Continue can then read it on the next reply or a Re-read (or tell CUT_OFF), as the stopped path does today.
- test: tests/Story_block/a1-open-block-cut-line.test.js
- owner area: SB-capture (Continue split block)

### B-a1-15 [severity: medium] After a middle delete, a new reply inherits the last reply's meter window by index: +25 trust in one reply past the cap of 15 (or nothing)
- repo: npc_state_delta
- file:line: src/npc-meters.js:917 (story line: `reply = ctx.carrier.index`), :555-558 (moveMeters: the window `record.turn = { reply, from }` restarts only when `turn.reply !== reply`)
- repro: SB + NSD (vendored testkit; same with all four modules and the pack, scripts/nsd-window2.mjs, nsd-window3.mjs). A: `+ present Fenna`, `~ npc Fenna | trust: +1`; B: `~ place Bluewatch Village`; C: `~ npc Fenna | trust: -25` → trust -14 (cap 15, window from 1, `turn.reply` = C's index 6). Delete B's two messages (C moves to index 4). D (a new reply, now at index 6): `~ npc Fenna | trust: +25`.
- expected: D is its own reply: trust moves at most 15, to 1. (SPEC, ctx.carrier: `sid` "stays with the reply when an earlier message is deleted, so a claim a module keys on a reply should use `sid`".)
- actual: trust 11 (+25 in one reply): D is taken for C because it sits at C's old index, so its window starts at C's start (1) and the cap is counted from there. With C moving +25 instead, D moves nothing. No Problem either way; rebuild == live (the bookkeeping is consistent, the rule is not).
- invariant: 3 (a per-reply cap bypassed) and 2 (a middle delete changes what a later reply may do).
- suggested fix: Key the window by the reply's record id, as RPG Battle and Story Director do (`ctx.carrier.sid`, which a middle delete never moves): `reply = ctx.carrier?.sid ?? index`, stored as text in `turn.reply` (validator: a string or a whole number). `headReply()` (the reader's own values) can give the latest reply's sid the same way (`store.carrierSid(index)`).
- test: tests/npc_state_delta/a1-meter-window-after-delete.test.js
- owner area: NSD-meters (change cap)

### B-a1-16 [severity: low] Quest rewards in coins: "1 gold 5 silver" reads as 1 gold, and "3 gp", "2 platinum", "5 crowns" read as that many of the smallest coin
- repo: Story_director
- file:line: src/v2/quests/parse.js:144-148 (coinWorth: an unknown coin word is worth 1), :167-186 (parseReward: the first "<n> <coin>" match only)
- repro: currency copper with coins copper 1 / silver 10 / gold 100 (the Ersveil pack's, or the reader's Coins). `parseReward({ reward: '1 gold 5 silver' }, '', { currency })` → amount 100; "1 gold and 5 silver" → 100; "3 gp" → 3; "2 platinum" → 2; "5 crowns" → 5 (in a live chat the same `+ quest … | reward: …` stores those amounts on the thread; scripts/quest-reward.mjs).
- expected: read whole (150) or not read as money (amount null, the story settles it, as for "a horse"), as Story Block's money reader does for a coin line (it refuses two coins and unknown coins with a Problem).
- actual: a smaller amount than written, silently; the Quests screen shows the reward as that amount. Side by side over 12 coin words × 4 amounts, Story Block's coin line and this reward reader agree on 32 and differ on 16 ("coins", "gp", "crowns": refused by the coin line, read at worth 1 here).
- invariant: 3 (code sets a number the story did not mean) and consistency with §F108's "no amount is read in the wrong coin".
- suggested fix: When the chat has coins, price a reward only from the chat's coins (`currency.coins`; the generic COIN_WORDS then only mark "this is money" and give amount null when the word is not one of the coins), and sum or refuse several "<n> <coin>" parts in one reward ("1 gold 5 silver" → 150, or null), never take the first alone.
- test: tests/Story_director/a1-reward-coin-forms.test.js (5 cases)
- owner area: SD-quests (rewards in coins)


## Fuzz totals

All runs: Story Block + RPG Battle + Story Director + NPC State Delta on Story Block's testkit (RB's
tests/v2/break/helpers/suite.js, copied into the SB clone's tests/v2/break/helpers/), Ersveil pack installed, PC
created; replies from the harness generator (gen.mjs, b6 lines incl. hostile/sloppy forms) plus this cell's lines:
stray change lines and near misses before/after/far from the block, prose (quoted dialogue, `> ` quotes, fences,
`<think>`, list items), `? choice` / `~ chatter` (with markers, to catch any minting), `+ coin <n> silver|gold|copper|
pieces of silver|silver 5 copper|golds|crowns`, `- coin <n> <coin>`, `+ xp minor|major|milestone|huge`,
`! time +2h…+1d`, `~ time Goldwane <d>, <h> am|pm` (set back and forward), `! encounter`, `+ present`. Choices and
chatter on in 3 of 4 seeds; reader Coins (copper/silver/gold, 60 a reply) in 2 of 3 seeds (else the pack's coins).

Actions per step (random): send, swipe (new), swipe back to an earlier swipe (snapshot compared), regenerate,
Continue (plain, a new block, an unclosed block, closing a split block), middle delete, last delete, edit,
Re-read, `sdk.rewind` to a random receipt, reload (flush + loadChat of a copy), feature toggles (choices,
chatter, rpg-battle.recovery, and every other feature id), Coins toggles (fuzz.mjs: the reader's coins on/off, which falls
back to the pack's coins of the same worths; fuzz2.mjs: three different unit sets and both display modes), UI commands (inventory, trade, wallet,
quests, party rest/effects, NPC adjust, scene, chronicle digest, combat).

Checks after every step: A) a cold store over a copy of the chat == live head (every non-send step and every 3rd
send); B) a cold replay with every checkpoint after the greeting stripped == live (every 2nd step and after every
delete/rewind/Re-read/feature/edit); C) head after a reload == head before; D) swipe back to a swipe seen as head
== its snapshot; E) every 60 steps, store.at(i) == a cold store over chat[0..i] (8 carriers); F) nothing throws;
G) no `capture.choice`/`capture.chatter` receipt and no choice/chatter marker text in the state.

| run | seeds | steps | replies | A–F divergences | throws | notes |
|---|---|---|---|---|---|---|
| fuzz.mjs (fz.jsonl) | 1–100 | 29,815 (99 × 300, seed 35 stopped at 115) | 13,917 | 0 | 0 | 1 G signal, a false positive: the generator's hostile `+ route </Changes> — ? choice Run ZQCH` line made a route whose name holds the marker (a route's own text, not a display mint); no fight was started in this run (encounters offered: 1,383 in the final chats; recover 425, time 1,379, coin 1,311, xp 232, digests 499) |
| fuzz2.mjs (fz2.jsonl) | 101–125 | 7,500 (25 × 300) | 3,474 | 0 | 0 | fights started 51 times (25 actions played, 8 fled, 6 ended), Coins switched between none (pack coins), copper/silver/gold and penny/crown with display mixed/base; check H: 3 skipped blocks after middle deletes, all dependent or by design (a route to a place only the deleted reply made, x2 reports of one skip; a `+ present` of someone the deleted reply had sent away) |
| reread-fuzz.mjs (rr.jsonl) | 1–30 | 1,800 replies, each Re-read once (25 % with a Continue, 10 % stopped) | 1,800 | 87 Re-reads changed the state | 0 | all of known kinds: B-a1-6 (turn count after a Continue), B-a1-3 (stopped), B-a1-11 ("--"), B-a1-10; 0 unknown |

Capture.js-level fuzz (pure functions, no host): hide-idem 1,000,000 random replies (0 differences outside the
excluded "--" and tag-in-line classes), cont-idem 200,000 reply + Continue pairs (all differences B-a1-10),
stop-idem 140,000 stopped replies (all differences B-a1-3), display-idem 150,000 replies (0 differences without "--").

In all: 125 host seeds, 37,315 steps, 17,391 replies, 0 replay/rebuild/reload/swipe-back divergences, 0 throws (plus
1,800 Re-read checks). Owners' delete fuzzers on these heads, with more seeds: RB tests/v2/break/fuzz-delete.test.js
with FUZZ_DELETE_SEEDS=24 FUZZ_DELETE_REPLIES=30 (27 cases incl. the 3 pinned) all pass (scripts/rb-fuzz-delete.log);
SB tests/v2/qa/delete-fuzz.test.js default seeds + QA_DELETE_SEED 7, 13, 23, 31, 41 all pass (scripts/sb-delete-fuzz.log);
SD tests/v2/break/fuzz-delete*.test.js pass.

## What held up (tried, not filed)
- Stray lines (#123): exact heads near the block are taken and hidden; quoted dialogue in "…" or “…”, `*…*` italics, `<p>`, table rows, headings, `(OOC: …)`, `[…]`, NBSP/zero-width/tab variants, one-line `<!-- … -->`, `<think>`/`<thinking>`/`<reasoning>` (closed or unclosed) are never taken; far-up lines (4+ story paragraphs) and `+ Coin`, `+coin`, `+ coin:`, `~ coin`, `+  coin`, `+ present:`, `+ Present` are told as STRAY and stay shown; a `- ` bullet in a story paragraph is told, not taken; kinds of a feature that is off have no head. Linear time: 40,000 candidate lines (360 KB) in ~110 ms.
- Display kinds (§F115): no receipt, no op, no rev for `? choice`/`~ chatter` in any fuzz step (check G over every step); display read from the shown swipe after swipes, swipe-back, deletes and reloads; a display-only reply still gets a record and shows its lines; markup in names/thoughts is text (textContent).
- Coins (§F108): "3 silver(s)", "3 of silver", "silver 3", "3 SILVER", "3 silver coin(s)", "3 silver." convert; "3 coins", "three silver", "-3 silver", "3 silver 5 copper", "3 silver's", "3 sliver", "3 copper in silver" are refused, not guessed; payments: "- coin 5 gold" with 3 silver is NOT_ENOUGH (nothing paid), "- coin 2 silver" pays 20, "+ coin 0 silver" and "+ coin 99999999999999 gold" are refused, "+ coin 1,000 copper" is 1000; loot purses ("? loot 90 gold") are held to the reply's coin budget before anything else in the reply; `+ coin` budget holds across a reply + two Continues (stray lines included), swipes and Re-read.
- Story XP (`+ xp`): one major/milestone and two minor per reply hold across Continue (block and stray), swipe (a new swipe gets its own slots), swipe back, Re-read; written numbers (`| amount: 999`, `| xp: 500`, `+ xp 50`) are never paid; `- xp`/`~ xp` refused; no award without a character (generation is held).
- Recovery (rpg-battle.recovery): heals once per stretch; Re-read of the time reply and of the next reply leave the state equal; a clock set back heals nothing and keeps `rested` (by design: recovery stalls until the clock passes `rested` again); deleting the first clock set keeps rebuild == live with no skipped block.
- SD clock: maxJump holds inside one reply (C2-5, including +29d, set back, +29d); `~ time` with a far year neither throws nor jumps forward (the year is ignored; outside this area).
- SD day digest with the clock set back: the written day is dropped at the next settle and written again (same facts) when the clock passes it; rebuild == live (scripts/digest-back.mjs). Middle delete of the first clock set: no skipped block, rebuild == live.
- capture.js level (scripts/hide-idem.mjs): 1,000,000 random replies (paragraphs, exact/near-miss/prose change lines, closed and open blocks, reasoning): the lines read live == the lines read again from the hidden text, and hiding twice changes nothing — outside the two known classes ("--", B-a1-11; a block tag inside a line, B-a1-12), which were excluded.
- Inner chatter back to the story (`chatterInPrompt`): one optional tail line with the answered reply's thoughts (cut to 140 points each), the same reply after a swipe of the newest one, none with the feature off (scripts/chatter-tail.mjs).
- capture.js level, Continue and stopped replies (scripts/cont-idem.mjs, stop-idem.mjs): 200,000 reply + Continue pairs and 140,000 stopped replies; the only live/Re-read differences are B-a1-10 and B-a1-3.
- Earlier-cell tests in this area now pass on these heads: SB c1-wear-after-middle-delete, c2-coin-amount-forms (11), c2-cut-mid-reasoning, c2-hide-masked-body, c2-spoof-marker-reread, c2-extractor-failed-no-note, and the final cell's a1-late-save-* / a1-unload-behind-hung-save / a1-late-rescue-write (#122); SD c1-time-after-middle-delete, c2-time-jump-per-reply, c1-days-date-twice, c2-digest-back-on, c2-digest-off-queries; RB a2-boss-held-back, a2-prices-ignore-money-scale, a2-ranked-boss-below-strong, rx-fight-keyed-session, rx-pools-middle-delete.
- Display kinds at the pure level (scripts/display-idem.mjs): 150,000 random replies with choice/chatter lines in blocks and in the story: what one capture keeps == what displayLines shows from the hidden text, except "--" in a thought, shown as "- -" (B-a1-11's escape; 2,890 of 10,000 with such a line).
- Not filed (by design or for the lead): a `+` change line inside a story paragraph near the block is taken ("He listed his take:\n+ coin 5" pays 5) — SPEC #123 allows it, only `-` lines need a paragraph of change lines; lines after the block are taken however far down (SPEC: "or after it"); a clock set far back stalls story-time recovery until it passes `party.rested` again; a later `~ time` absolute set after a middle delete lands earlier by the deleted move (SD CHANGELOG #98, by design); Coins "Money one reply may give" help says "in whole coins" (it is the smallest coin with Coins set); many near misses in one reply give one STRAY Problem each (20,000 for a 360 KB reply), linear time; after a middle delete these later blocks are skipped and reported, all dependent or by design: a `~ npc` line on an NPC entry only the deleted reply made, a route to a place only the deleted reply made (scripts/route-delete.mjs), and a `+ present` of someone the deleted reply had sent away ("listed as present twice", SB qa/oracle-validators.test.js keeps that by design).

## Scripts and logs (out/scripts/)
- fuzz.mjs        main replay fuzz (100 seeds x 300 steps): all four modules + Ersveil pack, stray lines / near misses / prose,
                  ? choice, ~ chatter, + coin <n> <coin>, + xp, ! time / ~ time, encounters; sends, swipes (new + back),
                  regenerate, Continue (split blocks), middle/last deletes, edits, Re-read, rewinds, reloads, feature toggles
                  (choices, chatter, recovery, all others), Coins toggles. Checks A-G after each step (see header + G).
                  node fuzz.mjs <from> <to> <steps> [out.jsonl]   -> fz.jsonl / fz.log
- fuzz2.mjs       same + fights started/played/ended, Coins switched between three unit sets and display modes, and
                  check H (a middle delete skips no later block that did not depend on the deleted reply). -> fz2.jsonl / fz2.log
- reread-fuzz.mjs Re-read of every unedited reply must leave the state equal (receipt ids normalised). -> rr.jsonl / rr.log
- totals.py, finish2.py  totals over the jsonl files.
- hide-idem.mjs, cont-idem.mjs, stop-idem.mjs, display-idem.mjs  capture.js-level fuzz: live read vs Re-read of the saved text.
- *.mjs probes    one per finding / area (stray-probe, stray-live, nearmiss, display-probe, coin-probe, coin-live,
                  xp-probe, xp-forms, recovery-probe, recover-edit, clock-probe, sd-turn, commentsafe*, cont-reread,
                  open-stray, stopped-join, settle-edit, digest-back, loot-probe, loot-forms, coin-pay, coin-cut, stray-perf,
                  htmlcomment, stray-hostile, tagname, nsd-window*, quest-reward, chatter-tail, sid-swipe, time-forms,
                  rested-delete, xp-nopc, verify-claims, display-record; fuzz-dbg.mjs re-runs a fuzz seed with dumps).
- fuzz-prev.mjs   the previous pass's fuzzer (base of fuzz.mjs).
