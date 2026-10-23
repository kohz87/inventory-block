# Studio, part 1: the pack engine (brief for the VM)

For: the VM. Codex (Sol) is the monitor; Gemini Flash (through Antigravity, `agy`) writes. The lead (the cloud
coordinator) opens the PR, has it reviewed and merges. Nothing in this brief merges anything.

## What Studio is

Studio is the creator kit's editor for packs: a creator builds a rules pack (classes, skills, branches, items, foes) and
Studio checks it while they work, previews it and exports a pack file that RB loads unchanged. Part 1 is the engine
only, with no styled UI. The screens wait for mocks the lead draws in the concept artifact after the reset.

The pack format is the draft in `suite-notes/RB_PHASE0.md` section 6 (pack schema v2), with the rules numbers in
section 5. It is a draft and will change after review, so the engine reads the schema as data: a change to the schema is
a change to one file, not to the code.

## Where (two repos)

- **Story Block** (kohz87/Story_block), branch `studio-1` off `v2` (47b2806 or later): S1–S2, the pack format and its
  checker, because Story Block checks every pack on import. New files only: `src/v2/packs/rules-v2.js`,
  `tests/v2/packs/rules-v2/` (tests and fixtures). Picked up by `npm run -s test:dot` (`tests/v2/**/*.test.js`).
- **Story Studio** (kohz87/Story_studio), branch `studio-1` off `main` (72db624 or later): S3–S7. Read its AGENTS.md.
  Files in `src/`, `tests/`, `docs/STUDIO.md`; Story Block only through `vendor/story-block/`, made with
  `npm run sync-sb -- --from <the Story Block clone on studio-1>` after S2 (re-run it whenever S1–S2 change).
- Do not edit any existing file in Story Block. If a task seems to need one, stop and say so in the report. The lead adds
  CHANGELOG lines and any wiring at merge time.

## The tasks (one writer run each, in this order; each ends green before the next starts)

In Story Block:
1. **S1 Schema as data** (`src/v2/packs/rules-v2.js`). Section 6 as a frozen description: the kinds (classes, skills,
   branches, items, foes, optional trainers/shops/questTemplates), each field's type, limits and references, the 8 slots
   (main hand, off hand, head, body, legs, feet, accessory 1, accessory 2), the 7 stats (STR, VIT, AGI, DEX, INT, LUK,
   CHA; a pack may rename their labels), and the constants from section 5 (level cap 99, class tiers 0–3 at levels
   0/10/20/30, 3 skills per class, skill max 5, 2 pathway steps per skill, 2 written branches per step).
2. **S2 Checker** (same file, `validateRulesPack(pack) → { ok, errors: [{ path, code, message }] }`). Never throws.
   Static checks only: unique ids per kind, every reference resolves, each class has exactly 3 skills, tiers chain by
   `parent` (tier n's parent is tier n−1, tier 0 has none), each skill has 2 written branches for each of its 2 steps,
   slots and stats are from the lists, `hands: 2` only on main hand, text fields capped with no `<` or `>`, numbers
   finite and in range. The power budget is a stub (`budgetOf() → null`, documented); its formula comes later from RB.
   Error codes are stable strings (`dup-id`, `bad-ref`, `class-skills`, `tier-chain`, ...) so Studio can show them.
   Fixtures in `tests/v2/packs/rules-v2/fixtures/`: a minimal valid pack (2 tier-0 classes, 1 tier-1 class, their skills
   and branches, 3 items, 2 foes) and one broken pack per error code.

In Story Studio (after `npm run sync-sb`):
3. **S3 Pack model** (`src/model.js`). `openPack(json)`: parse, check with the vendored `validateRulesPack`, normalise
   (field order, defaults), index the references (who points at what). `exportPack(model) → string`: stable key order
   and stable array order, so one change gives a small diff; `exportPack(openPack(x))` is identical for a normalised x.
4. **S4 Edit operations** (`src/edits.js`, `src/history.js`). Pure functions on the model: add, rename an id (every
   reference follows), delete (refused with the list of references, or with `cascade: true`), move a class to another
   parent, set a field. Each returns a new model plus `{ undo }`; an undo/redo stack with a cap.
5. **S5 Dev page and smoke test** (`src/dev.html`, `src/dev.js`). An unstyled page that loads a pack file, lists its
   contents with the checker's errors, applies one edit and exports. DOM calls only. A Playwright smoke test (Chromium at
   /opt/pw-browsers if the VM has it, otherwise skip it and say so) that opens the page from a local file and checks the
   error list for a broken fixture.
6. **S6 Fixtures** (`tests/fixtures/`): copies of S2's valid pack and two broken ones, plus edit scenarios.
7. **S7 Docs** (`docs/STUDIO.md`): what part 1 does, the API of each file, the error codes, how to run the dev page.

## Roles and the loop

- The monitor (Codex, Sol at `high`) reads this brief, RB_PHASE0.md, Story Studio's AGENTS.md, and Story Block's
  `src/v2/packs/validate.js` and `src/v2/view/widgets/dom.js` for style. For each task it writes the writer's prompt (files, functions, the tests to
  write, the done-check), runs the writer, then reviews the diff and runs the checks. Findings go back to the writer;
  at most 3 rounds per task, then stop and report what is left.
- The writer (Gemini Flash via `agy -p`) works only in the clone, only on the task's files, and never pushes.
- After S2 and after S7 the monitor runs every check below, commits per task if the writer didn't, and pushes
  `studio-1` in that repo.

## Rules (all of them, every task)

- Match the surrounding code: plain ES modules, no build step, no new dependencies, comment density like
  `packs/validate.js`.
- No `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `DOMParser`, `eval`, `new Function`. No network calls.
- No model or tool names in any file or commit message, and no trailer lines in commits.
- Only branch `studio-1` in each repo. Never push to `v2` or `main`, never force-push, never open a PR, never merge.
- No keys, tokens or secrets anywhere; never read SillyTavern's data folder.
- Checks before the push: `npm run -s check`, `npm run -s test:dot` (all green; note any test that already fails on
  `v2`), `git diff --stat` against the base (`origin/v2` or `origin/main`) shows only the allowed files, and
  `git grep -n -E "innerHTML|insertAdjacentHTML|DOMParser|eval\(" -- src/v2/packs/rules-v2.js` (Story Block) and
  `-- src` (Story Studio) print nothing.
