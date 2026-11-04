# CARD-SB — Story Block 2.21.0: the card offer (read CARD-COMMON.md first)

Repo kohz87/Story_block, base origin/main 2ee6318 (2.20.0), branch `stage65/card-offer`, clone $S/card-sb/.

**Build (addendum D):**
1. **Card reading.** Read the card's lorebook entries with the existing `readCharacterLorebook` (st-adapter.js) and recognise the tags `[storysuite:portraits]` and `[storysuite:settings]` beside `[storysuite:pack]` (lorebook.js). Validate each format and its limits; anything rejected writes a Diagnostics line.
2. **`sdk.registerCardSettings`.** Add it exactly as the contract says, and register Story Block's own owner (`story-block`) with rpg, gear and rpgXpRate. Their labels are "RPG", "Gear" and "XP rate", and `valueText` gives "on"/"off"/"150%". Applying them must persist the setting exactly as the settings screens do.
3. **The offer** in the Story panel (mockup sections 1–3): reuse the classes the mockup names; the notice box rule widens to the panel.
   - The checkbox line lists only the settings that differ.
   - Missing owners and capabilities each get a muted line. A missing capability disables Install; a missing NSD only drops its keys.
   - The dot on the Story button (`.ss-screenbar-alert`) shows until the offer is answered.
   - "Not now" is remembered per card + pack id + version.
   - One notice per pack, at most three.
   - The update offer keeps the chat's module choice.
4. **Install:** the existing install, with the portraits handed in as zip-import files. Then enable the pack's data modules in this chat at once: the tab must appear without a reload or a reply; the mockup found the pin saved only after a delay plus a reload, so fix that path. Then apply the ticked settings. Finally show the "Installed …" notice, which states only what was done.
5. **Packs row:** "N data modules" when a pack carries data modules and nothing else countable.
6. **Diagnostics lines,** as the contract lists.
7. **Docs:**
   - BUILD-A-CARD.md: replace the "separate, later piece" line with "Ship your whole world inside the card". Cover the three tags, the formats, Studio's Character card page, recommended settings and the consent click.
   - PACKS.md: the formats.
   - PUBLIC-API.md stays as is; registerCardSettings lives in the internal sdk.
   - Mention it in AI-README.
8. **Version 2.21.0**, bumped in every usual spot:
   - runtime.js VERSION, validate.js HOST_VERSION, manifest and package;
   - tests/v2/preflight.test.js and the bootstrap.test.js pins;
   - README line 1 and its suite line, AI-README lines 1, 17 and 18 and its suite line;
   - a CHANGELOG entry.
   Ersveil's `requires` is unchanged.
9. **Tests:**
   - the format parsers and their limits;
   - registerCardSettings (differences only, unregistered owner, apply persists);
   - the offer states: new, update, not-now remembered, refused (no notice), missing capability (Install disabled), missing NSD;
   - Install enables the modules in this chat immediately;
   - a group chat shows no offer;
   - the dot shows until answered.
   RPG-off prompt bytes must be unchanged; a chat with no card entries must behave exactly as 2.20.0.

Real-ST check at the end, ports 8330/8430, ST data built by copying into a new empty folder:
- Use a test card holding the real Ersveil pack, plus a `[storysuite:settings]` entry and a small portraits entry. You build these entries by hand from the formats; Studio's builder comes later.
- Shoot the offer, Install and the result at desktop 1440 and phone 390, and put the shots in your report folder.
