# Review X (2 Nov): the clean-up release

Heads: SB `stage36/release` 73f98cd (base 79df89f), SD `stage36/release` fc378fe (base 1ae570c), NSD `stage36/cleanup-nsd` 0dee1e8 (base f642101), Studio `stage36/pack-formula` 5c3fbd5 (base 3036ab8). All four sit on their origin/main bases.

Reviewer: Claude agent. I made no commits or pushes and did not touch rpg_battle. I did not read secrets.json or any user data. Processes were stopped through PID files only. No command was denied.

## Verdict: OK (no blockers)

## Counts
| Repo | check | tests | diff --check vs base |
|---|---|---|---|
| SB 73f98cd | ok | 4457 tests, 4446 pass, 0 fail, 10 skip, 1 todo | clean |
| SD fc378fe | ok | 1121 tests, 1119 pass, 0 fail, 2 skip | clean |
| NSD 0dee1e8 | ok (validate) | 1608 tests, 1603 pass, 0 fail, 5 cancelled; compat pass; smoke pass | clean |
| Studio 5c3fbd5 | ok | 855/855 | clean |

- NSD's 5 cancelled tests are all in `tests/storysuite-participant-selection.test.js`. The same 5 are cancelled on base f642101, so they predate this branch (a Node 22 "promise still pending" issue). Because `npm test` chains with `&&`, the suite exits 1 before it gets to compat and smoke, so I ran those two by hand.
- Studio: `npm run build` gives the committed `dist/story-studio.html` byte for byte (5,115,421 bytes). Its vendored copy of SB is still the old one, as the brief says. SB's `sync-testkit` does carry `portrait-fit.js`, so the lead's re-vendor will pick it up.
- Prompts with no edits and no cast pack were byte-identical between main and the heads in real ST: the same chat and the same 3 scripted replies gave 9 requests (dice, story, NSD scanner ×3), all IDENTICAL.

## What was checked (real ST on port 8197, own data copies `st-*`, scripted mock on 5197, desktop 1440×900 and phone 390×844)
1. **SB portraits** (`rv/p2.mjs`, `p2.out`):
   - Shrink: an 8.7 MB PNG, an 8.6 MB JPEG (3000×4000), a 1.1 MB WebP and an 8.3 MB pure-noise PNG were each stored as WebP: 75 KB at 923×1200, 111 KB at 900×1200, 94 KB at 960×1200 and 152,114 B at 625×625. All are within 150 KB and 1200 px.
   - Kept exactly: a small PNG, a small JPEG and an old 63 KB WebP were stored byte for byte.
   - Refused, with plain sentences naming the file: undecodable, >64 MP header, GIF, a pick over 10 MB ("11.5 MB …"), zip-slip, zip-bomb ratio, an entry over 10 MB, and 42 entries.
   - Old pack: Ersveil 2.4.0 at 79df89f (64 KB portraits) imports.
   - Head Ersveil zip: imports and re-import replaces. The 12 stored files are byte-identical to the repo's, and no old files are left behind.
   - Removing the pack removes its 7 files and its index entry; the other pack's files stay.
   - Re-encoding is deterministic: the same hash on a second import.
2. **Card in view** (`s4`, `s14`, `s16`):
   - After every reply the newest card is in view: card bottom 42 px above the chat bottom, gap 0, on desktop and phone. That includes a phone reply carrying "Paths crossed: Sister Temiwa".
   - On base the card sat 41 px below the fold.
   - Not moved: a reader 900 px up when a change is committed. Older cards never scroll.
   - SD's `follow.js` is gone (404), and its wiring with it.
   - No `scrollIntoView` and no bare `focus()` in the changed SB view code.
3. **Hero Edit** (`s2` d/p, `s11`, `s12`):
   - No pencils are left in the hero; the purse pencil remains.
   - One Edit pill: drawn at 24 CSS px (19.6 px at the view's zoom) with a 44 px tap area. Desktop: top-right. Phone: far right of the name row.
   - A long name truncates with an ellipsis and does not overlap the pill or the close button.
   - The editor shows Story (Year (CY), Month with the 12 Ersveil months, Day, Time, Place, Weather, Here) and Character (Guild Rank, Wearing, Condition). Focus starts on Year; `aria-expanded` is set.
   - Day 31 with a weather change: shows "Goldwane has 30 days.", the editor stays open, and neither the clock nor the weather is saved.
   - Rewind two days plus weather "clear": both saved. Forward three days to 6:00 pm with a long Here name: saved.
   - Saving with nothing changed only closes the editor (nothing written). Cancel and Escape save nothing; focus returns to Edit.
   - With old SD 1ae570c, and with no SD at all, the editor has no date or time fields.
4. **SD clock** (`s2`, `s3`):
   - The tiles "Clock set to Goldwane 13, 6:40 am" and "Clock set to Goldwane 18, 6:00 pm" are on the edited reply.
   - Status Time row reads "CY 611, Goldwane 18, 6:00 pm".
   - Re-read keeps the edit. A swipe drops it (Goldwane 15, 06:40 am), swiping back restores it, and a reload gives the same clock.
   - After a middle delete (`/cut`) and a reload the set clock is unchanged.
   - Deadlines, cast and the chronicle across a rewind are covered by SD's tests and fuzz.
5. **Key-people removal line** (`s5`, `s8`):
   - After an NSD archive, "Sister Temiwa is no longer a key person" appears on the next reply only, not the previous one.
   - A swipe shows it once on the new swipe. Deleting that reply removes it, and the following reply says it again. It survives a reload.
   - An NSD death (deceased, archived) gives the line on the next reply with `removed.reason: died`.
6. **NSD portrait files** (`s1`, `s6`, `s7`, `s9`, `s10`):
   - Meeting 2 cast writes 2 content-addressed files, byte-equal to SB's. The sidecar holds no `data:image` and there are no `portraitAssets`.
   - A fresh chat makes 0 NSD 404s out of 79 NSD requests (base: 1 × 404).
   - No `data:image` or file paths appear in any story or scanner prompt.
   - Swipe, swipe back and re-meet: no duplicate files, and the restored dossier carries `[file]`. This matches base step for step.
   - Pack removal: NSD files stay and portraits show. Export then import into a new chat gives file records with no new files.
   - Missing file: a placeholder shows, the record is kept, with no console error and no 404.
   - An old chat made by NSD f642101 with a dataUrl portrait: its portrait records and `portraitAssets` are unchanged byte for byte after load and a save, and no files were written.
7. **Studio**:
   - The card writes `content.rpg.formula` on the object form, which matches SB's validator.
   - Reader's choice deletes `formula` and drops an empty `rpg`. Undo, Redo, Check and export are covered by unit and browser tests.
   - `portrait.js` reads `PORTRAIT_LIMITS.bytes`/`side` and falls back to 600.

Console errors in every real-ST run: none (the only 404 was my own probe for `follow.js`).

## Blockers
None.

## Follow-ups (ranked)
1. **Phone: "at the bottom" reaches far up.** The slack is half the screen, at most 400 px; on a 390×844 phone that is 357 px. A reader who has scrolled up to 300 px, for example to re-read the end of a reply, is pulled to the bottom by any committed change (repro: `s4.mjs p`, `commitUp300` 5194 → 5494). This is the agreed design and it never fires at 900 px, but it reads against "a scrolled-up reader is never moved". A smaller slack on phones is worth considering.
2. **Escape in the hero editor closes the whole Game view, not just the editor.** Nothing is saved. Base pencils did the same (checked), so this predates the branch. Stopping the key's propagation in the editor would fix it.
3. **No busy state while a pack's portraits shrink.** 4 large images took 7.6 s on desktop Chromium; phones will be slower. The panel shows nothing during that time, and a second pick can start in parallel.
4. **Memory on phones.** The whole zip, up to 322 MB, is read into memory, and a picture up to 64 MP decodes to a full-size bitmap of up to 256 MB before scaling. A phone tab could die on a big pack. Passing `createImageBitmap(..., { resizeWidth/resizeHeight })` would decode at the target size; a lower phone cap is another option.
5. **Wrong sentence for an undecodable file with a garbage header.** It says "lothar.webp has 802673881 × 2186702728 pixels, which is too many…" instead of "could not be read as a picture." A sanity cap (for example any side over 65535 means unreadable) would fix it.
6. **Small images with a large pixel size are treated differently.** Studio re-encodes a picture of 150 KB or less that is larger than 1200 px; SB stores it byte for byte at any size. Results are not alike for such files.
7. **Known, still present:** `director.time.text` keeps "06:40 am" with a zero pad, unlike the hero. The removal line is deferred on a reply with no change lines (accepted).
8. **Before this branch:** on desktop, the newest card sits under the fold right after a chat is opened (gap 694 px; the same on base). Opening an older card while at the bottom shifts the view by browser scroll anchoring (+236 px; the same on base). The Studio build warns about a duplicate `card` key in the vendored SB `strings.js`.

## Files
- Scripts and outputs: `$S/rv-x/rv/` (`p1`/`p2`/`s1`–`s16` .mjs and their .out files, `prompts-main.jsonl` / `prompts-head.jsonl`)
- Logs: `$S/rv-x/logs/` (`*-tap.log`, `nsd-compat.log`, `nsd-smoke.log`, `*-check.log`, `*-diffcheck.log`)
- Shots: `$S/rv-x/shots/` (desktop `-d`, phone `-p`)
- Data copies: `$S/rv-x/st-*`, stopped. Test assets and zips: `$S/rv-x/assets`, `$S/rv-x/packs`.
