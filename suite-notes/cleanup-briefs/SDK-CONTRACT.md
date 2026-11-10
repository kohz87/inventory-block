# SDK-CONTRACT — Story Block as a platform, part 1: public API + events + `{{sb::…}}` macro (DRAFT, 3 Nov)

Status: APPROVED by the lead on the USER's standing instruction (3 Nov night: "proceed with the sdk task … handle everything on your recommendation"). Open questions decided: (1) names `StoryBlock.api` and `{{sb::…}}` kept; (2) v1 read-only; (3) NSD meters through the API later (an NSD change), not in this release. Comes after the prompt diet (SB 2.19.0). Target: one minor release.
Why: MagVarUpdate (MVU) gives card authors a small documented layer (variables in a worldbook, `_.set` lines, three
events, `getvar` for status bars). Story Block has more underneath (replay-exact per-message state, data modules,
`StoryBlock.sdk`, a module registry) but no small, stable, documented surface a card author or a third-party script can
rely on. This contract defines that surface. Pieces 3 (blocks defined in a character card's worldbook) and 4 (tutorial
+ example card) are separate follow-ups (below).

## What exists today (not public)
`StoryBlock.sdk` (apiVersion 2): ready, registerModule, command, preview, commit, query, receipts, rewind, reread,
callModel, view, preflight, on(name) with internal events `committed`, `head`, `turn`, `feature`, `modules`,
substitute, dialog. Built for our own modules; names and payloads change between releases; not documented for others.

## 1. The public API (`StoryBlock.api`, version 1)
A small frozen object, separate from `sdk`, with a promise: names, arguments and payload shapes listed here do not
change within API version 1. Additions are allowed (new fields, new events); removals or changes need API version 2,
announced one minor release ahead, with version 1 kept working for at least two minor releases.
- `api.version` → 1; `api.host` → the Story Block version string.
- `api.ready` → a promise that resolves once the current chat's state is loaded (and again per chat: see events).
- `api.get(path)` → a plain, frozen copy of the value at a documented path in the CURRENT state (the state after the
  latest reply on screen), or `undefined`. Read-only; never a live object. Paths (v1):
  - `scene.place`, `scene.time`, `scene.date`, `scene.weather`, `scene.present` (names)
  - `money` (in the smallest coin), `money.text` ("6 silver 5 copper")
  - `items` (list of `{ name, qty, kind, note }`), `items.<name>.qty`
  - `party` (list of members `{ name, level, xp, health, mana, stamina, stats }` when the RPG is on), and
    `party.<name>.<field>`, plus `party.me.<field>` for the reader's own Character
  - `blocks.<blockId>.<field>` for any data-module block in the chat (pack blocks included)
  - `npc.<name>.<meter>` when NPC State Delta is present (through its own registered public paths)
  Hidden values (secrets, hidden meters, locked notes) are NEVER returned: a hidden field reads as `undefined`.
- `api.paths()` → the list of paths available in this chat right now (for authors and for a macro picker later).
- `api.on(event, fn)` → returns an `off()` function. Events (v1), each payload a frozen plain copy:
  - `story:changed` `{ index, changes: [{ path, from, to }] }` after a reply's changes are applied (live only)
  - `story:reply` `{ index, summary }` after a reply is fully captured (its receipts settled)
  - `story:rebuilt` `{ reason }` after a swipe, Re-read, delete or reload changed the current state
  - `story:chat` `{ chatId }` when the chat changes and its state is ready
  Listeners run after Story Block has saved; an error in a listener is caught and logged, never breaks a reply.
- Writes are NOT in v1 (a card author changes state through the narrator's change lines or the screens). A documented
  write surface (an allow-list of commands) is a possible v2.
Stability tests: a frozen-surface test (names, arity, payload keys), a hidden-value test, a replay test (a listener sees
the same `story:rebuilt` state as a reload), and a no-break test (a throwing listener).

## 2. The `{{sb::path}}` macro (SillyTavern prompts, regex scripts, status bars)
- Registered through SillyTavern's own macro API (read the version we support; register once, unregister on unload).
- `{{sb::scene.place}}` → the value as text; `{{sb::money.text}}`; `{{sb::party.me.health}}`;
  `{{sb::items.Healing Draught.qty}}`. Lists render as a comma list; objects are not rendered (use a leaf path).
- `{{sb::path|fallback}}` → the fallback when the path is empty or hidden.
- Same paths and the same hidden-value rule as `api.get`. Read-only, no expressions, no functions. Output capped
  (e.g. 300 chars per macro) and stripped of newlines unless the path is a list.
- Our own prompt is unaffected: Story Block keeps protecting its own injected text from macro rewriting (turn.js).
Tests: each path family, fallback, hidden → fallback, cap, a status-bar regex script example rendering in real ST.

## 3. Follow-up (separate contract): blocks from a character card's worldbook
A worldbook entry (e.g. named `[StoryBlock]`) on the card holding data-module definitions in the same JSON as a pack's
`dataModules`, validated by the same checker, pinned per chat like pack blocks, so a card works without a pack. Needs
its own contract (loading order vs packs, pinning, Studio support) and possibly a small "comes from the card" note in
the Blocks screen (mockup first).

## 4. Follow-up: tutorial + example card
docs/v2/BUILD-A-CARD.md: install, define a block, make the narrator write it, show it in a status bar with
`{{sb::…}}`, react to `story:changed` from a script. One example card in examples/cards/.

## Open questions for the USER
1. Name: `StoryBlock.api` and `{{sb::…}}` — fine?
2. v1 read-only (no writes) — fine?
3. Should NPC State Delta expose its meters through `api.get('npc.…')` in the same release (small NSD change)?
