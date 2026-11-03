# CARD-UI — mockup for "a card that brings its own blocks" (SDK part 3, option A, USER-approved 4 Nov)

Read suite-notes/cleanup-briefs/SDK-CARD-CONTRACT.md (option A) first.

**Rules**
- Do not edit or push any code repo; this is a mockup only.
- Never read secrets or API keys, and never open or print ST's secrets.json.
- Never read the USER's SillyTavern settings, chats, characters or personas.
- Use PID files. Never `pkill -f` / `pgrep -f`. Never `playwright install`. Chromium is /opt/pw-browsers/chromium; Playwright is /opt/node22/lib/node_modules/playwright.
- Build the ST data folder by copying into a NEW empty folder ($S/cardui/st-data), on ports 8320/8420. Never `rm -rf` copied data.
- If any command is denied, stop that step and report it; never re-run it in another form.
- S=/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad.

**Method** (same as the gear mockups): $S/grm7/mockup.html, its builder $S/grm7/build7.py, the flows in $S/grm7/run (lib.mjs, g7*.mjs) and config.yaml.
- Run real Story Block from origin/main 2ee6318 (2.20.0) in a real ST copy.
- "Today" shows the live screens.
- "Proposed" shows the same screens with the new parts drawn with the app's own classes and icons (injected DOM).
- Shoot at 1440×900 and 390×844 (phone), deviceScaleFactor 2.
- Measure alignment in the live DOM and note it, as round 7 did.

**Setup**: a test character whose lorebook has a disabled entry titled `Sealcrown Blocks [storysuite:pack]` holding a small valid pack (one data module, e.g. a "Reputation" block, version 1.2.0). Build the pack with the repo's own examples or checker so it validates. Open a chat with that character.

**Screens**
1. **Story Block panel, chat open, pack not installed.** One quiet notice at the top of the panel:
   - "This card brings a pack: **Sealcrown Blocks** 1.2.0 — adds Reputation", then **Install** and **Not now**.
   - It is a quiet notice, not an alarm. Reuse the app's existing notice or banner style if one exists; say which class.
   - Today: the panel without it.
2. **Update offer.** Installed is 1.1.0 and the card has 1.2.0: "This card has a newer **Sealcrown Blocks**: 1.2.0 (installed 1.1.0)", then **Update** and **Not now**.
3. **After Install.** The notice is replaced, for one reply or until closed, by "Installed Sealcrown Blocks 1.2.0. Its blocks start in this chat." Show the Blocks screen with the new block present.
4. **Install refused.** Shown only where the Packs panel reports it today (no notice on open). Show today's message for an entry that fails the checker, for reference only.
5. **Settings → Tabs & Packs**: today's "Import from lorebook" button, unchanged, with today's "from a lorebook" row label. Reference only.
6. **Story Studio pack page** (Studio main 7b79c3c, 0.7.0; run it the way earlier Studio mockups did, see $S/grm7 or the GR-STU brief):
   - an **Export as lorebook entry** action next to the existing export;
   - its result: a small dialog with the entry JSON (comment with the tag, disabled, content fenced), **Copy** and **Download**, and one line of help: "Paste into the character's lorebook in SillyTavern. Keep the entry disabled."

**Write**: $S/cardui/mockup.html, built like build7.py: a self-contained page with base64 images, a title of 2–4 words, and light/dark tokens as in grm7.
- Each section: what changes, wording, choices, open questions.
- Note anything drawn by hand.
- Report the file path and anything that could not be shot. Short.
