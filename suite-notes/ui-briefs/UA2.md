# UA2 — Story Block: one card under each reply (approved item 2)

Read UI-COMMON.md first. Repo kohz87/Story_block, base origin/main 121e49a, branch `stage29/ui-a2`. Test ST port 8162.

1. Under each reply the cards registered by all modules (today "Changed this reply" from Story Block and "Status" from
   Story Director, plus any others) show as ONE card titled "This reply" (`src/v2/reply-cards.js` and its UI).
   - Closed: one line = each module card's summary joined with " · " in card order (Changes first), e.g.
     "+1 Oilskin Coat, −1 Weir Hook · +1 silver 2 copper · Hooded courier left · 1:30 pm, Bluewatch Village".
     It may truncate with an ellipsis on one line; the full text is in the title attribute.
   - Open: each module card's body as a section in order, each after a small heading (the module card's own title;
     Story Director's status section reads "Where things stand" — use a host-level heading override or ask SD to set
     the title; say which in your report). Bodies keep their own layout (the Status rows table must look as today).
   - Lazy bodies (filled on open) keep working; opening the one card fills every section.
   - Each module card's own on/off switch still works (an off card is simply not a section). With only one card on,
     it is still titled "This reply". "Cards under replies" off hides it all, as today.
   - The re-read warning bar and per-reply notes stay where they are.
2. Bug: the Status strip (`story-block.hud`) is on but `.ss-hud` is empty and hidden in every state (U1 finding 3).
   Find why. If it is broken, fix it; if it only fills from a module that no longer feeds it, say so and propose
   (don't build) whether to remove the switch.
3. Tests: merged summary text, section order, one card when a module adds a card, off switches.

Do not touch the hero/Home/tabs (UA1) or the Features page (UC).
