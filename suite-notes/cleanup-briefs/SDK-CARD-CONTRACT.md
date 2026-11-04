# SDK-CARD-CONTRACT — Story Block as a platform, part 3: a card that brings its own blocks (DRAFT, 3 Nov night)

Status: USER approved option A (4 Nov). Mockup first (CARD-UI). Needs a mockup approved before any UI work (the notice in step A1).

## What already exists (found while drafting)
A card can already carry a whole pack: a lorebook entry whose Title/Memo has `[storysuite:pack]`, holding pack.json
(plain or in a ```json fence; the entry should be disabled so ST never sends the JSON). **Settings → Tabs & Packs →
"Import from lorebook"** installs it with the normal checker (src/v2/packs/lorebook.js, installed.js `importLorebook`,
panel.js). Its blocks are then pinned per chat like any pack's. So "blocks from the card" works today — but:
1. it is manual: the player must know to press the button; nothing says the card carries a pack;
2. BUILD-A-CARD.md says card blocks are "a separate, later piece" — wrong; the route is undocumented for authors;
3. an updated card (newer pack version in the lorebook) is not noticed;
4. Studio cannot export a pack as a ready lorebook entry.

## Recommendation: option A (small, keeps consent) — about 2–3 h
- **A1. Offer on chat open.** When a chat opens and the character's lorebook has a `[storysuite:pack]` entry that is
  not installed, or is a newer version than the installed one, show one quiet notice in the chat's Story Block
  panel: "This card brings a pack: *Name* 1.2.0 — Install · Not now". Install = today's import (same checker, same
  limits). "Not now" is remembered per card + pack version (settings), so it asks once per version. A pack that
  fails the checker shows nothing on open (the Packs panel still reports why on a manual import). Never installs
  without the click: card content comes from strangers.
- **A2. Docs.** BUILD-A-CARD.md gets "Ship your blocks inside the card": the tag, disable the entry, the fence,
  bump `version` to make players see the update offer; fix the "later piece" line. PACKS.md cross-link.
- **A3. Studio.** "Export as lorebook entry" on a pack: writes the entry JSON (comment with the tag, disabled,
  content fenced) that pastes into ST's lorebook editor. Studio-only, no SB change.
- Tests: notice shown for not-installed and newer; not shown for same/older, refused or "Not now" version; Install
  goes through `importLorebook` (one checker); a chat switch during the read drops the stale answer (as markets do).

## Not recommended now: option B (auto-load card blocks without installing) — about 4–6 h, riskier
Blocks would load straight from the open card, scoped to that card, never written to the installed list. Costs:
a second loading path beside packs (order vs packs, id clashes with an installed copy, what pins when the card is
edited mid-chat), silent code-free but still untrusted content running on open, and Studio/Packs panels that must
show "from the card" rows (more UI). A1 gets the same player experience with one click and no new loading path.

## Open questions for the USER
1. Option A as above (one-click offer, remembered "Not now")? Or do you want B's zero-click loading?
2. Where should the notice sit — Story Block panel top (recommended), or an ST toast?
3. Studio export (A3) in the same round, or later?

## Addendum B (USER 4 Nov): one card = the whole world
The USER asked for everything to ride inside the character card, and approved updating the mockup. Scope added to option A:
- **Carried by the card:**
  - lore (the card's own lorebook);
  - pack(s) (a disabled `[storysuite:pack]` entry);
  - portraits (a disabled `[storysuite:portraits]` entry: the pack's portraits shrunk to about 40 KB each, base64 webp, keyed by file name; checked against the pack's cast and the portrait store's limits);
  - a status bar (the card's own scoped regex scripts, a native SillyTavern feature);
  - recommended settings (a disabled `[storysuite:settings]` entry).
- **Recommended settings** come from a fixed allow-list only: story-block.rpg, story-block.gear, the RPG XP rate, NSD portrait prompt format, NSD Scan every. The list grows only with a release.
  - Only the settings that differ from the player's current ones are shown.
  - They are applied only with the player's click: a checkbox in the offer, ticked by default.
  - NSD reads its own recommendations through the Story Block sdk; Story Block never writes another extension's settings.
- **Install:**
  - installs the pack;
  - turns its data modules on in this chat (the earlier recommendation);
  - stores the portraits;
  - applies the ticked settings;
  - the notice then says what happened.
  - "Not now" is remembered per card and pack version.
- **The extensions themselves cannot ride in a card:** SillyTavern does not let a card install or run code. A card can say which extensions it needs, and the notice says so when one is missing.
- **Studio:** "Build a card…" replaces "Export as lorebook entry". It takes a base character (PNG/JSON, or a new one), writes the pack, lore, portraits, recommended settings and an optional status bar into it, shows the size, and downloads a card PNG.
- Estimate: about 2–3 h on top of option A.

## Addendum C (USER 4 Nov): the whole character card in Studio
The USER asked for the first message and every SillyTavern card setting to be in the same place, and approved redrawing the mockup.
- "Build a card…" opens Studio's Narrator card page, renamed **Character card**, instead of a separate dialog.
- **The page holds:**
  - every standard card field: name, description, personality, scenario, first message, alternate greetings, example messages, creator notes, system prompt, post-history instructions, tags, creator, character version, avatar image, Character's Note (depth prompt + depth) and talkativeness;
  - **Pick a card…**, which loads an existing PNG/JSON card into every field;
  - the "Put in the card" checklist: pack, lore, portraits, status bar and recommended settings, each with its size, plus a total;
  - **Download card** (PNG/JSON).
- Drafts are saved with the pack, so they survive a reload. Studio-only, about 2 h more.

## Addendum D (USER approved the mockup v3 on 4 Nov, with the lead's recommendations): the build contract
The mockup at https://claude.ai/artifact/3T4tuABXMuJVYrQNsHknXE (v3) is the approved UI; its "Lead's recommendations" box is binding.
Decided: a pack needing a capability from a missing extension (e.g. Ersveil `chronicle-lasting` → Story Director) shows "Needs Story Director for world events", and Install is disabled until it is installed. A missing NSD only drops its settings, and Install works. A picked card's own lorebook entries stay on a separate "Card's own lore" line.

**Card lorebook entries** (all disabled; the tag is in the Title/Memo (`comment`); content is JSON, plain or in a ```json fence):
- `[storysuite:pack]` — pack.json, as today.
- `[storysuite:portraits]` — `{ "v": 1, "pack": "<pack id>", "version": "<pack version>", "files": { "<file name as named by the pack's cast portrait>": "data:image/webp;base64,…" } }`.
  - Limits: at most 24 files, each at most 200 KB decoded, 3 MB in total. Type webp, png or jpeg.
  - Every name must be a portrait the pack's cast names; anything else is skipped with a Diagnostics line.
  - Install hands them to the same portraits store a zip import uses.
- `[storysuite:settings]` — `{ "v": 1, "settings": { "<owner>.<key>": value } }`.
  - Allow-list v1: `story-block.rpg` (bool), `story-block.gear` (bool), `story-block.rpgXpRate` (int 50–300), `npc-state-delta.portraitPromptFormat` (that extension's own values), `npc-state-delta.scanEvery` (int, its own range).
  - Unknown keys and values that fail validation are skipped, each with a Diagnostics line.

**SDK** (Story Block, added to the internal `StoryBlock.sdk`, not the frozen public `api`):
`sdk.registerCardSettings({ owner, label, keys: { <key>: { label, valueText(v) → string, valid(v) → bool } }, read(key) → value, apply(values) → Promise<{ applied: [key] }> })` → `unregister()`.
- Story Block registers its own owner `story-block` the same way.
- The offer lists only keys whose `read` differs from the card's value, as "<key label> <valueText>" (e.g. "RPG on · Gear on · NSD portraits Natural").
- `apply` must persist the setting exactly as the extension's own Save does.
- An owner that is not registered means that extension is missing. Its keys are dropped, and the muted line names it with a known reason: `npc-state-delta` → "Needs NPC State Delta for portraits and dossiers".
- A pack's missing capability is named through a small table: `chronicle-lasting` → "Needs Story Director for world events". Unknown capabilities use the checker's own message.

**Offer behaviour (Story Block):**
- **When it shows:** on chat open (single-character chats only), read the card's lorebook with the existing reader. Offer a pack that is not installed, or a newer version than the installed one.
- **Where it shows:** one notice per pack, at most three, at the top of the Story panel, plus `.ss-screenbar-alert` on the Story button until it is answered.
- **"Not now":** remembered per card + pack id + version, in Story Block's settings.
- **Install:**
  - the existing install, with the portraits;
  - enable the pack's data modules in THIS chat at once, so the tab shows without a reload;
  - apply the ticked settings;
  - the notice then says exactly what was done.
- **Update** keeps the chat's existing module choice.
- **Diagnostics:** each "Not now", refusal, skipped key or skipped portrait writes one line.
- **Packs row:** "N data modules" instead of "no content".

**Studio:** the Character card page as in mockup section 7.
- **Card image:** a PNG, JPEG or WebP picked by the author becomes the card's PNG image.
- **Portraits:** shrunk to about 40 KB webp each, in the browser.
- **Fields:** Character's Note and talkativeness go in `data.extensions.depth_prompt` and `data.extensions.talkativeness`.
- **Status bar:** written as `data.extensions.regex_scripts`, from Story Block's examples/cards/status-bar.
- **Lore:** the pack's lore becomes enabled `character_book` entries. The three storysuite entries are disabled `character_book` entries.
- **Pick a card…** reads V2/V3 JSON and PNG (`chara` / `ccv3` tEXt).
- **Drafts** are saved with the pack.

**Versions:** Story Block 2.21.0; NPC State Delta 1.9.0 (with the 1.8.1 follow-ups); Story Studio 0.8.0.
