# BK — Blocks move to Story Suite settings (mockup v10 section 9; APPROVED 31 Oct)

Mockup: https://claude.ai/artifact/Gn22FRyEzDvufqZDgdbR4R (local copy suite-notes/rpg-briefs/mockup-v10.html; shots
/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/mock-rpg/shots9/101-*, 102-*).
Code: Story Block's block editor and the Game view's "Blocks" tab (strings.js `blocks`, the custom blocks screen),
the Settings window pages (src/v2/view/settings/*). Rules: suite-notes/rpg-briefs/COMMON.md. Branch `stage20/blocks-settings`
from origin/main. No version bump/CHANGELOG. Another agent works on src/v2/view/settings/money.js (Money card removal)
and slider CSS on stage20/settings-fixes: don't touch those.

1. Remove the generic **Blocks** tab from the Game view (and its tab-list/Tabs & Packs entry). Nothing else in the Game
   view changes: a block whose Show as is its own tab keeps its own tab; Home cards stay.
2. Story Suite settings gets a **Blocks** page (in the side list after Tabs & Packs; searchable): title, help line,
   **New block** (empty) and **From a template**, the count line ("5 blocks in this story · 2 tabs, 1 card"), one row per
   block in this chat: name, (RPG role chip for role blocks), a meta line (fields · buttons/rules · where it shows),
   **Show as** (Its own tab / A card on Home / Both / Hidden; RPG role blocks show their RPG tab, disabled), **Edit**
   (the existing block editor), ⋯ (Save as template, Remove with confirm). The note under the list as in the mockup.
   "Hidden" is new: the block keeps working for the story but has no tab or card.
3. The existing editor, templates and limits are reused, not rewritten. Old chats keep their blocks and where they
   showed. With no chat open the page says plainly that blocks belong to a story.
4. Tests (after the fix only). Docs (docs/v2: the block editor / GUIDE pages that mention the Blocks tab). Browser-check
   in a real ST copy, desktop and 390 px, and attach screenshot paths.
