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

---

# Redraw of item 1 (coordinator, 2 Nov): one "Edit" button, no pencils in the hero

Supersedes the single time pencil (`T1-*`, `mock.mjs`) above. Script: `mock2.mjs d|p`; shots in `shots2/` (`-d` desktop 1440x900, `-p` phone 390x844),
real ST on 8194 (bases 79df89f / 1ae570c / f642101), DOM/CSS patched only.

| Picture | File |
|---|---|
| before: today's hero (pencils on place, weather, Here, wearing, condition) | `before-d.png`, `before-p.png` |
| after, closed: lines plain, ONE "Edit" button (desktop: hero's top-right corner; phone: beside the name) | `after-closed-d.png`, `after-closed-p.png` |
| after, open: the editor as opened (current values) | `after-open-d.png`, `after-open-p.png` |
| after, open with edits typed (Day 14, Time 6:00 PM, Weather "clear") | `after-open-edited-d.png`, `after-open-edited-p.png` |
| after, saved: the hero, plain, with the new lines | `after-saved-hero-d.png`, `after-saved-hero-p.png` |
| after, saved: the reply card with the clock change and one other change | `after-saved-d.png`, `after-saved-p.png` |

Exact texts
- Button: pencil icon + "Edit"; tooltip and aria-label "Edit the story and your character". aria-expanded while the editor is open.
- Editor (group label "Edit the story and your character"), two fieldsets:
  - "Story": "Year (CY)", "Month" (select of the story's months), "Day" (1..30), "Time"; "Place"; "Weather"; "Here" (people present, comma-separated).
  - "Character": "Wearing", "Condition" (and "Rank", under the pack's own word, only where the game gives one: it is the hero's third pencil today).
  - Help line, once: "Changes apply from this reply on."  Buttons: "Save" (primary), "Cancel".
- While the editor is open the hero's lines (time/place/weather/Here, wearing/condition) are hidden and the editor takes their place; Cancel or Save brings them back.
- Reply card after Save: header "Clock set to Goldwane 14, 6:00 pm · Weather: clear"; tiles "Clock set to Goldwane 14, 6:00 pm" (tooltip: the full date with era and year)
  and "Weather: clear" (tooltip: "(was heavy rain, rising river)"), each with sub "Your edit"; "Where things stand" shows the new Time and Weather.
  A field left as it was writes nothing and gets no tile. Not drawn: an inline error line (e.g. "Goldwane has 30 days.") and Save off while nothing changed.
- Look: the app's own `ss-input`, `ss-select`, `ss-button`, `ss-button-primary`; only the layout is new (two groups, a small round "Edit" pill). Details of the drawing:
  the Edit pill is `data-ss-hit` (the app's own opt-out of the 44px phone minimum, with a 44px tap area drawn around it, as the u7 mockups did); on desktop the
  vitals bars are pushed down 30px so the pill does not sit on the Health row.

What it replaces (all removed from the hero, nothing else changes)
1. Place pencil ("Edit place", `scene.place`), 2. Weather pencil ("Edit weather", `scene.weather`), 3. Here pencil ("Edit people present", `scene.present`):
   Story Block `src/v2/view/widgets/hero.js`, `cornerPencil(...)` calls ~l.302-304 and the `where` prop (the corner's pencils; Game view header `src/v2/view/game-header.js` ~l.177-191 builds it).
4. Wearing, 5. Condition (and Rank) pencils ("Edit what you wear", "Edit your condition"): same file, the `ss-hero-you-pencil` / `editable.render(entry.pencil, props, api)`
   block ~l.196-222 (`you.command`, `valueKey` wearing / condition / rank).
6. The new date/time editor (the single time pencil of the first drawing is dropped).
The same pencils elsewhere are untouched: Purse, Burr (mount) and the other Home cards keep theirs (the request names the hero only).

Where it goes in the code
- Button + the one editor: `hero.js` (the `ss.hero` widget). With `where` set (the Game view header) it draws the "Edit" button in the top-right of `.ss-hero` (phone: in `.ss-hero-who`
  beside the name) and the editor in `.ss-hero-text`; without `where` (other uses of `ss.hero`) it stays read-only, as today. The editor can reuse `editable.js`
  `kind: 'fields'` (one input per entry) extended with `type: 'choice'` (options; the month and the place list) and `type: 'time'`, grouped under two headings; strings in `src/v2/strings.js`.
- Save: one pass over the fields that changed, each through its existing command (`scene.place`, `scene.weather`, `scene.present`, the wearing / condition command in `you.command`)
  plus the new clock command from Story Director (`src/v2/tracker/` next to `director.seed`; `calendar.toAbs`, `ctx.absolute('director', '/time/minutes')`). Only changed fields send a command;
  a failing one keeps the editor open with its error and the others are not lost. The calendar (months, era, month length) comes from the Director's `director.calendar` query via the header's props.
- Card lines: the commands' own summaries through the changes card (`src/v2/screens/changes-card.js`, the "edits of yours" lines); the status card (Story Director `src/v2/screens/status-card.js`) follows by itself.

Open questions (new)
1. One Save with several commands: if one is refused (e.g. a bad date), keep the editor open and save the rest, or save nothing? (Drawn as: nothing saved until the whole form is valid.)
2. Should "Here" stay a comma-separated text field, or keep its current chip editor inside the form?
