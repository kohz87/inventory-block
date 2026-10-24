# Studio, part 2: the pack editor app (brief for the VM)

For: the VM. Sol monitors and writes the exact parts; Gemini writes under Sol. The lead opens the PR, has it reviewed and
merges. Nothing in this brief merges anything.

## What part 2 is (USER decisions)

- **A standalone, local app.** Story Studio is not a SillyTavern extension. People download it and double-click one
  file: `dist/story-studio.html`. It works offline, opened straight from disk (`file://`), with no server and no network.
  MVU Game Maker ships the same way, and is the reference for this.
- **The pack editor only.** Open a pack, edit it with Story Block's checker running live, and export a pack file that RPG
  Battle loads unchanged. Not in part 2: character cards, the screen builder, settings defaults, AI assist and the creator kit.
- **No pack content.** Studio is a tool. Sample text in the UI is a placeholder, like `[YOUR PACK NAME]`. Use the golden
  `smallRulesPack()` and the existing fixtures for tests.

## Look

The mocks are in `suite-notes/studio-mocks/` (`Studio`, `StudioSkill` and `StudioExport` `.dc.html`). They are Design
Component pages: read their markup and `renderVals()` for the layout, the tokens (the `t` objects, dark and light) and
the behaviour. Don't copy their templating syntax (`{{ }}`, `sc-for`, `sc-if`, `x-dc`); build real DOM.
- **Dark and light themes** use the same tokens as the mocks, switchable, with dark as the default. They follow
  `prefers-color-scheme` until the user picks one.
- **Type:** Nunito, with a system fallback. Studio is offline, so ship no web-font request. Use the system stack
  `Nunito, system-ui, sans-serif`, and embed the font only if its licence allows and the size stays under 300 KB. Otherwise
  use the fallback alone.
- **Icons:** from `src/assets/` (the icon PR, assets/icons). Until it merges, use the names in `docs/ASSETS.md` on that
  branch, so swapping in the files changes nothing else.

## Screens and behaviour

1. **Shell:**
   - Top bar: pack name, rules fingerprint (short), Undo/Redo, Open pack…, Problems (count), Export (disabled until valid).
   - Left rail of pack parts with counts.
   - Main area and an inspector panel.
   - At 1024px wide the inspector becomes a drawer. No phone layout is needed, but nothing may break or scroll sideways at 1024.
2. **Classes** (mock `Studio`):
   - The tier 0–3 tree, laid out in columns by tier.
   - Selecting a class shows the inspector: name, ID (rename updates every reference, and shows how many), parent, and
     exactly 3 skills with a count.
   - "+ Child class" and "Remove…". The remove dialog lists everything the cascade removes, then removes it. Undo brings it back.
3. **Skill paths** (mock `StudioSkill`):
   - A tier-3 skill's 12 forms in three columns: base, step 1, step 2.
   - Written forms can be edited. Generated forms are dashed, locked and read-only.
   - A power budget bar per form flags `budget-closure`.
   - Lower-tier classes show their skills as a simple list.
4. **Other pack kinds:** items, foes, places, quests, shops, trainers, and "More kinds" for the rest.
   - A form generated from the schema: Studio already reads the schema as data, so a schema change is a change to one file.
   - A list on the left, a form on the right, fields typed from the schema.
   - Reference fields are pickers of existing IDs.
5. **Problems** (drawer and the `StudioExport` screen):
   - Story Block's own errors, grouped by code, each with "Go to", which selects the record and focuses the field.
   - A draft can be invalid. It saves anyway, and export stays locked until it's valid.
6. **Open and export:**
   - Open a `.json` pack through a file input or drag and drop. A leading byte order mark is fine.
   - Export downloads exactly `exportPack(model)`, byte-identical to the engine, with the fingerprints shown.
   - Unsaved changes warn before closing.
   - The draft autosaves to `localStorage`, wrapped in try/catch: a private window works without it.

Engine: part 1's `src/model.js`, `src/edits.js` and `src/history.js`, unchanged in behaviour. The UI never edits a pack
directly, only through `edits.js`.

## Build

- Add a small build, `npm run build`, that writes `dist/story-studio.html`. It must be a single file: the JS bundled and
  inlined as a classic (non-module) script, the CSS and icons inlined, with no `fetch`, imports or external URLs.
- A dev dependency for bundling (esbuild, pinned to an exact version) is fine. The shipped file has no runtime dependencies.
- `npm start` serves `src/` for development.
- Commit `dist/story-studio.html`, so a download needs no build, and keep it in sync: CI fails if `npm run build` changes it.

## Safety

- Render pack text with `textContent` and `createElement` only, never `innerHTML` with pack data.
- No eval, no `new Function` and no network. CI greps the built file for `fetch(`, `XMLHttpRequest`, `WebSocket`, `http://`
  and `https://`. Allowed exceptions: the licence or credits text, and SVG `xmlns`.
- Test with harmless markers like `<b>x</b>` in names and slugs.

## Part 1 follow-ups to fold in (from the part 1 review)

- **Use Story Block's constants instead of copying them:** `RULES_V2_PROGRESSION` and `RULES_V2_LIMITS` replace the
  copies in `edits.js` (the slug and ID regexes, the derived-form reservation, the 52-character skill slug limit, the tier-3
  maximum). If one isn't exported, list it and the lead adds the export in Story Block.
- **Namespaces:** make class and skill renames agree with `add` on namespaces. Story Block accepts a class named like an
  existing place slug, so Studio must too.
- **Tests:** they import `tests/fixtures/smallRulesPack.js` instead of carrying their own copies.
- **`docs/STUDIO.md`:** add the dev-page codes (`file-read-error`, `no-document`, `refused-edit`, `export-error`) and fix
  the `$H$` at line 52.
- **CI:** install Playwright and run the browser smoke test, opening the built `dist/story-studio.html` from `file://`.

## Tests

- **Unit tests** for the schema-driven forms: every field type, reference pickers, and invalid input that is refused with a code.
- **Browser tests** (Playwright, both themes, desktop 1280 and 1024 wide):
  - open the golden pack;
  - rename a class (the references follow);
  - remove with cascade, then undo;
  - break a class (2 skills), then the problem shows and "Go to" lands on it;
  - fix it, and export unlocks;
  - export equals `exportPack` byte for byte, and the hashes equal the golden values;
  - a hostile pack (`<b>x</b>`, `__proto__` keys, huge text) shows no injected elements and no errors.
- **The single file:** it runs from `file://` with the network blocked, with zero requests.
- **The test rule:** no baseline run. A new test proves itself by reverting only its fix. Run the full runs once at the end:
  `npm run check`, `npm test` with the dot reporter, `npm run build` (no diff), and `git diff --check origin/main HEAD` clean.

## Where

Story_studio, branch `studio-2` off `main`. Files: `src/` (UI), `src/assets/` (from the icon PR), `scripts/build.mjs`,
`dist/story-studio.html`, `tests/` and `docs/STUDIO.md`. Never edit `vendor/story-block/` by hand: re-sync it with
`npm run sync-sb` if needed. No model or tool names anywhere in the repo.
