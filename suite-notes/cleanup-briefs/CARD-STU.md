# CARD-STU — Story Studio 0.8.0: the Character card page (read CARD-COMMON.md first)

Repo kohz87/Story_studio, base origin/main 7b79c3c (0.7.0), branch `stage65/character-card`, clone $S/card-stu/.

**Build** (mockup section 7 and addendum D):
1. **Rename** the Narrator card page and its rail item to **Character card**. "Build a card…" on Check / export (quiet style, under the two exports) jumps there. Update the docs.
2. **Top of the page:**
   - "Saved with the pack." replaces the session-only line, and drafts really are saved with the pack, so they survive a reload.
   - **Pick a card…** reads V2/V3 JSON and PNG (`chara` and `ccv3` tEXt chunks) into every field. The picked card's own `character_book` entries are kept as "Card's own lore".
   - Reset card from pack, as today.
   - Card image with Change… (PNG, JPEG or WebP, written as the PNG image; a canvas is fine for decoding in the browser) and Remove (back to today's cover).
3. **Fields:**
   - **Main:** today's five fields, plus alternate greetings (add and remove).
   - **More:** example messages, system prompt, post-history instructions, Character's Note (`extensions.depth_prompt` {prompt, depth, role}), talkativeness (`extensions.talkativeness`, 0–1), tags (chips), creator, character version, creator notes.
   - More is collapsed on the phone.
4. **"Put in the card"** checklist with real computed sizes and a total (the PNG total includes base64 and the image):
   - **Pack:** a disabled `[storysuite:pack]` entry.
   - **Lore:** the pack's lore as enabled `character_book` entries, the same entries the Lorebook page builds.
   - **Portraits:** a disabled `[storysuite:portraits]` entry, each image shrunk in the browser to webp of about 40 KB or less. Make the shrink an injectable function so node tests can fake it.
   - **Status bar:** `data.extensions.regex_scripts` from Story Block's examples/cards/status-bar regex JSON. Vendor a copy and say where it came from.
   - **Recommended settings:** a disabled `[storysuite:settings]` entry. The rows are editable: RPG on/off, Gear on/off, XP rate, NSD portrait prompt (Natural/Hybrid/…), NSD scan every. Only ticked rows are written.
   - **Card's own lore**, when picked.
5. **Download card PNG** (primary) and **Download card JSON**, under the checklist. Keep the PNG writer deterministic: the same inputs give the same bytes.
6. **Version 0.8.0** with a CHANGELOG entry. Fix in passing: the AI-README version line, and the tracked `node_modules` symlink if it is still tracked (say what you did).
7. **Tests:**
   - the round trip: pick card → download → pick it again gives the same fields;
   - the PNG `chara` chunk;
   - `character_book` entries: tags, disabled flags, the portraits entry's limits (≤24 files, ≤200 KB each, ≤3 MB);
   - only ticked settings are written;
   - drafts survive a reload;
   - sizes add up.

Real-browser check: open dist by file:// with the real Ersveil zip (Story_block examples/packs/ersveil.zip), then build and download the Ersveil card. Put the card at $S/card-stu/ersveil-card.png and its JSON beside it, for the SB real-ST check later.
