# XM: mockups for part B (no repo changes)

Pictures are the real apps with DOM/CSS patched in Playwright (`mock.mjs d|p`, desktop 1440x900 / phone 390x844).
Real ST on port 8194 (own st-data copy, now stopped) with Story Block 79df89f, Story Director 1ae570c, NPC State Delta f642101;
Studio from `ext/Story_studio` at 3036ab8 (`dist/story-studio.html`, opened from file, Ersveil pack loaded).
Files are in `shots/`, suffix `-d` desktop, `-p` phone.

## 1. Story date/time pencil (Story Director)

Where the date and time show today: the Game view hero corner above every screen (Home, World, ...), "CY 611, Goldwane 12, 1:30 pm"
(`.ss-hero-corner-item[data-kind=time]`), also World > Now (right, top) and the chat reply card "Where things stand > Time".
The pencil goes on the hero corner's time item only (place, weather and Here already have one there; one place covers every screen).

| Picture | File |
|---|---|
| closed: pencil beside the time (same pencil as place/weather/here) | `T1-1-closed-d.png`, `T1-1-closed-p.png` |
| open: compact editor under the corner | `T1-2-open-d.png`, `T1-2-open-p.png` |
| after Set: the hero shows the new time | `T1-3-after-game-view-d.png`, `T1-3-after-game-view-p.png` |
| after Set: the card line on the latest reply (card open) | `T1-4-after-card-d.png`, `T1-4-after-card-p.png` |

Exact texts
- Pencil: tooltip and aria-label "Edit story date and time".
- Editor (group label "Story date and time"): fields "Year (CY)" (number, 611), "Month" (select of the story's own months: Dawnwane, Rainmoot,
  Greengale, Highsun, Goldwane, Haywane, Emberwane, Nightfall, Frostfall, Deepwinter, Icewane, Yearsend), "Day" (number 1..30, the month's length),
  "Time" (time of day, 01:30 PM). Buttons "Set" (primary) and "Cancel". Help line: "Changes the story clock from this reply on."
  The "(CY)" is the calendar's era word; a calendar without an era shows just "Year". A calendar with weekdays would show the weekday
  read-only beside the date, never as a field.
- Card (collapsed header line): "Clock set to Goldwane 14, 6:00 pm". Tile in "Changed this reply": main "Clock set to Goldwane 14, 6:00 pm"
  (tooltip: the full "Clock set to CY 611, Goldwane 14, 6:00 pm"), sub "Your edit". "Where things stand > Time" shows the full new date.
  The short form leaves out era and year while they did not change (the Director's own short form, `calendar.format(abs, { era: false })`);
  a change of year or era writes them in. On a phone the tile text clips with an ellipsis like every tile does.
- Not drawn (words if wanted): an inline error line under the fields, "Goldwane has 30 days." / "Pick a date and a time."; Set stays off until the fields are valid.

Where it would go in the code
- Pencil: Story Block `src/v2/view/widgets/hero.js` (the corner, near `editing = where !== null && kind !== 'time'`, and the `cornerPencil` calls for place /
  weather / here); the Game view header `src/v2/view/game-header.js` passes `where`, so it would pass the calendar and the time too.
- Editor: a multi-field form. `ss.editable` (`src/v2/view/widgets/editable.js`) has `kind: 'fields'` (text/number inputs, as the mount editor on Home)
  and `kind: 'choice'` (a select) but not both in one form; the month select and the time input need a small extension of `fields`
  (`type: 'choice'` with `options`, `type: 'time'`). Strings in `src/v2/strings.js`.
- Calendar (months, era, month length): Story Director `director.calendar` query (`src/v2/tracker/calendar-settings.js`, `src/calendar.js` `makeCalendar`: `toAbs`, `format`).
- The write: a new Story Director command in `src/v2/tracker/index.js` `commands` (next to `director.seed`), file e.g. `src/v2/tracker/clock-set.js`, that turns
  the fields into minutes with `calendar.toAbs` and stores them as a set (`ctx.absolute('director', '/time/minutes')`, as `capture.js` does for `~ time <date>`), so replay,
  swipes and middle deletes stay exact. A user edit is not bound by the 30-day-a-reply limit of the story's own `! time` lines; going back is allowed (a rewind),
  which the cast and deadlines already follow (`cast/world.js` `reset`).
- The card line: the command's `summary` ("Clock set to ...") through Story Block's changes card (`src/v2/screens/changes-card.js`, the "edits of yours" lines) and
  the status card in Story Director `src/v2/screens/status-card.js` (the Time row follows the clock by itself).

## 2. Pack formula in Studio

The pack field: `content.rpg.formula`, `'standard'` or `'classic'` (Story Block 2.14.0, `docs/v2/RPG.md` "A pack may name the formula and its numbers",
`src/v2/packs/limits.js` `LEAN_RPG_FIELDS`, `validate.js` `RPG_FORMULAS`). It is kept as one record of the `content.rpg` list, `{ slug: 'formula', formula }`
(the numbers sit in the same record as `numbers`). Absent: the reader decides, and a chat that never chose plays Standard. The reader's own choice always wins
(Settings > RPG says "From the pack: Ersveil" while the pack decides). Today `content.rpg` is only a JSON card at the bottom of Pack settings.

| Picture | File |
|---|---|
| before: Pack settings today | `T2-1-before-d.png`, `T2-1-before-p.png` |
| after, field not set | `T2-2-after-reader-choice-d.png`, `T2-2-after-reader-choice-p.png` |
| after, Classic chosen | `T2-3-after-classic-d.png`, `T2-3-after-classic-p.png` |
| after, Standard chosen | `T2-4-after-standard-d.png`, `T2-4-after-standard-p.png` |

Exact texts (the help lines are Story Block's own Settings > RPG words, `src/v2/lean-rpg/strings.js` `formulaStandardHelp` / `formulaClassicHelp`)
- Card title "Stat formula"; row label "Plays on"; one segmented choice (Studio's `.cf-seg`, as "at a meter / on a story event" on a cast secret) with three
  segments: "Reader's choice" | "Standard" | "Classic".
- Help line under it, one line, changes with the choice:
  - Reader's choice: "The reader picks in Settings → RPG; a chat that never chose plays Standard."
  - Standard: "A main stat plus half a second one, stats start at 5 and grow, and the bars grow with VIT, AGI and INT."
  - Classic: "One stat on its own, stats start at 10, and the bars are fixed."
- Placement: first card of Pack settings, under the two grey hint lines, above the JSON fields (the JSON list is twenty collapsed rows, so a game rule would
  otherwise be at the very bottom as `content.rpg`).

Where it would go in the code (Story Studio)
- `src/screens/pack-settings.js` `renderPackSettings`: build the card before the `PACK_FIELDS` loop with `el`, `button` (as `src/screens/cast.js` ~l.460, `cf-seg`,
  `aria-pressed`) and `cf-hint` classes already in `src/studio.css`.
- The write: through Studio's edit pipeline (`src/edits.js`, the same `save`/apply path the other screens use, so Undo/Redo and Check work): set or replace the
  `{ slug: 'formula', formula }` record in `content.rpg` (create the list when missing, keep `numbers` and the skill sets as they are); "Reader's choice" removes
  `formula` and drops the record only when it also has no `numbers`.
- The JSON `content.rpg` card stays as is (it shows the same record).
- Studio's check already uses Story Block's validator (`vendor/story-block/src/v2/packs/validate.js`), so a bad value shows in Problems.

## Open questions
1. Third segment "Reader's choice" (writes nothing) beside Standard / Classic: wanted, or only the two (then an already-set pack could never be cleared except in the JSON card)?
2. Time editor: the clock's day may go backwards (a rewind) when the reader sets it; allowed, or only forward like the story's own `! time` lines?
3. Pencil on World > Now's time (top right) and Home's Where card (shown only without the hero) as well, or the hero only?
4. Studio: should Pack settings also expose the formula's `numbers` (nine of them) later, or only the choice?
