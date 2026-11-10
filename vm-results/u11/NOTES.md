# u11: World > Now, shorter People here, Around here header, card heights (mockup only, no repo changes)

Method: the real app with DOM/CSS patched in Playwright (`mock.mjs d|p`; desktop 1440x900, phone 390x844). Real ST on port 8194 (own st-data copy, now stopped; secrets.json never opened)
with the released mains: Story Block 768c41a (2.16.0, Ersveil 2.4.1), Story Director d972c4f (2.9.0), NPC State Delta 64af0ac (1.7.0). The Ersveil zip (`ersveil.zip`: pack.json
and its 12 portraits, built from `examples/packs/ersveil`) was imported through Settings > Packs ("Updated Ersveil (open world). 12 portraits saved."). The test chat cannot generate (no API),
so Sister Temiwa "met" is drawn by patching the DOM with the apps' own markup and classes (NSD `inlineCardHtml` / `noteNodes`, SD `world/screen.js` NOW template); her texts and portrait are the pack's own
(`temiwa`: about, look, stage "Tolerates you"/"Patches you without the sermon", the "Why Bluewatch" note, six hidden-note rules). The hidden-note texts follow the USER's screenshot 9.

Shots (`shots/`, `-d` desktop, `-p` phone)
| Picture | Files |
|---|---|
| before-now: today's World > Now (matches the USER's screenshot 9) | `before-now-d.png`, `before-now-p.png` |
| before-pin-open: today with the Pin list open (screenshot 10) | `before-pin-open-d.png`, `before-pin-open-p.png` |
| after-now | `after-now-d.png`, `after-now-p.png` |
| after-pin-open: Key people with the Pin list open | `after-pin-open-d.png`, `after-pin-open-p.png` |
| after-long-place: "Bluewatch Village / Adventurer Guild Office" (hero, Here, Around here); the grey box is an illustration of the tooltip | `after-long-place-d.png`, `after-long-place-p.png` |

## 1. People here (NPC State Delta)

Exact result: one row per person with portrait, name, standing chip ("Tolerates you") and the description on one line with "..." (two lines on a phone). The whole row opens the dossier.
Gone from World > Now: the "Look: ..." line, "Next: Patches you without the sermon - trust 25/45", the field/note line ("Why Bluewatch: ..."), and every "Hidden note - opens at ..." row.
(The "Why Bluewatch" line is an opened hidden note, `npc-state-delta-v2-note-open`; custom fields would come through the same cell lines.) The same lines stay where they belong: the dossier, and the Dossiers screen / Story panel (`track: true`).

Where (repo `npc_state_delta`)
- `src/storysuite-v2.js`, `renderCast(el, { track, cast, list })`: `world = track === false` (the World screen) already skips the meter bars; in the same loop (`for (const cell of el.querySelectorAll('.npc-state-delta-present-cell[data-npc-id]'))`,
  ~l.1049-1061) do not call `noteNodes(owner, entry, { card: true })` / `cell.append(line)` when `world` (that is the Next, field and hidden-note lines), and drop the card's `.npc-state-delta-present-now` span there
  (the Look line, written by `fillPresentSceneText` in `index.js`, called through `api.fillPresentCast(el)` at the end of `renderCast`; either skip the `now` slot for the World pane, or remove the node in the `world` branch above, which already trims the cell for the chatter).
  The stage still goes into `.npc-state-delta-present-card-stage` (`entry.rank`, l.1050), which is the chip's text.
- `style.css` (World cell block, ~l.776-779 `.npc-state-delta-world-cell ...`): the chip = `.npc-state-delta-present-card-stage` as a pill (1px border and soft fill in the accent colour, radius 999px, padding 0 9px, as drawn in `AFTER_CSS` of `mock.mjs`);
  the description = `.npc-state-delta-present-card-role` (l.330 clamps to 2 lines everywhere): inside `.npc-state-delta-world-cell` set `-webkit-line-clamp: 1; line-clamp: 1`, and back to 2 under `@media (max-width: 599px)`.
  The rule at l.777-778 (`.npc-state-delta-world-cell > .npc-state-delta-present-card .npc-state-delta-present-now ...`) can go.
- The whole row opens the dossier: the card is already a button (`inlineCardHtml`, `index.js` ~l.5136); with the extra lines gone the cell is the card. Also make the cell itself the hit area (click on `.npc-state-delta-present-cell[data-npc-id]` -> `runtime()?.openDossier(id)`, in `bindCastActions`, ~l.702-712,
  next to the existing `.npc-state-delta-story-row` handler) and `cursor: pointer` plus the hover border drawn here.

## 2. Around here header (Story Director)

Exact result: "AROUND HERE" never shrinks; the place is cut with "..." on one line and its full text is the tooltip (`title`); the day part (" - morning") stays. The place never runs into the Key people card (before: the label ran under it).
Cause: `.wv-label` is `white-space: nowrap` and its `<small>` (the heading) has no `min-width: 0` / overflow, so a long place overflows the card.

Where (repo `Story_director`)
- `src/v2/cast/queries.js`, `viewQuery`: besides `heading` (`[party.place, day].filter(Boolean).join(' - ')`) return `place` and `day` separately.
- `src/v2/world/screen.js`, NOW template line ~93: `label('Around here', { count: '{{ q.cast.heading }}', when: 'q.cast.heading' })` becomes a label whose small holds
  `<span class="wv-clip" title="{{ q.cast.place }}">{{ q.cast.place }}</span><span class="wv-day" data-if="q.cast.day">- {{ q.cast.day }}</span>` (the `label()` helper takes the count as text, so either give it a second form for markup or write the h4 for this card by hand like the "Here" label).
- Same file, CSS (~l.176-223): `.wv-around .wv-label { min-width: 0 }`, `.wv-around .wv-label > small { display: inline-flex; gap: .35em; min-width: 0; flex: 0 1 auto; white-space: nowrap }`,
  `.wv-clip { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`, `.wv-day { flex: none }`. The hairline (`.wv-label::after`, `flex: 1 1 0`) already gives way.
- Not changed: the same fix would suit "Key people" (`0 of 10`, short) and "Upcoming" (`next 30 days`) if a pack ever makes them longer; not drawn.

## 3. Card heights (Story Director)

Finding (measured on 2.9.0): the two cards already have automatic height (`.wv-now` is a grid with `align-items: start`; no fixed height or overflow on `.wv-around` / `.wv-key`). What the USER's screenshots show is the Game view's scroll area:
the hero and the screen bar stay on top (about 350 px of a 900 px window), the page scrolls underneath, and the long People here block pushed both cards to the very bottom edge, so they looked cut. Two things fix it:
1. Item 1 moves the cards up (People here is now one row), so Around here and Key people are fully on screen at 1440x900 without scrolling (`after-now-d.png`; "Unmet cast stays hidden. ..." is complete).
2. With the Pin list open the card shows the list inside it and scrolls inside when long, never out of view (`after-pin-open-*`).

Where (repo `Story_director`)
- `src/v2/world/screen.js` CSS: `.wv-around, .wv-key { height: auto; max-height: none; overflow: visible; align-self: start }` (states the intent; they are already so), and
  `.wv-key-choices { max-height: min(260px, 32vh); overflow-y: auto; overscroll-behavior: contain }` (today `max-height: 260px`, l.218; on a phone 32vh keeps the whole card within the space under the sticky header).
- `src/v2/keypeople/widget.js`, `draw()` (the "+ Pin" handler flips `choosing` and calls `draw()`): after drawing with `choosing` true, call `root.scrollIntoView({ block: 'nearest' })` (or scroll the card's top just under the sticky header on a phone) so the opened list is in view
  instead of below the fold. "Close" restores the previous scroll.
- The note "Unmet cast stays hidden. ..." is `q.cast.note` (`viewQuery`, `cast/queries.js`), already one paragraph in a `.wv-note`; nothing clips it once the card is fully in view.

## Notes on the pictures
- Desktop, narrow Around here card: the place is clipped hard ("BLUEWATC...") because the card is 282 px wide and the label plus the day part take most of it; the full place is the tooltip. If that reads too short, drop the day part first
  (`.wv-day { display: none }` below a width) before the place; left as is.
- The tooltip in `after-long-place-*` is an illustration of the native `title` tooltip (a screenshot cannot show it).
- The chip uses the accent colour at 12% fill like the app's pills; no new visual style.

## Open questions
1. Should the description show the pack's `about` (as today) or the shorter `role` the story gave, where both exist?
2. Drop the day part ("morning") of the Around here heading when the place needs the room?
3. Should the Dossiers screen keep the Next / hidden-note lines (drawn: yes, only World loses them)?
