# SDK-CARD-CONTRACT — Story Block as a platform, part 3: a card that brings its own blocks (DRAFT, 3 Nov night)

Status: DRAFT for the USER. Not started. Needs a mockup approved before any UI work (the notice in step A1).

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
