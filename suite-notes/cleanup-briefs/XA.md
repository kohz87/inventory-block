# XA — Story Block clean-up (branch `stage36/cleanup-sb` from origin/main 79df89f; test ST port 8191; clone $S/xa/)
Read X-COMMON.md first.
1. Portraits shrink on import (USER: not everyone uses WebP). A pack portrait (zip or multi-file pick) may be PNG,
   JPEG or WebP up to 10 MB in; Story Block decodes it in the browser, scales the long side to ≤ 600 px, encodes WebP
   and steps quality down until ≤ 64 KB (the stored limit stays 64 KB — NSD keeps a copy per chat). Same approach as
   Studio's portrait shrink (kohz87/Story_studio, grep "webp" / 64 KB in src) — read it, keep the results alike.
   Already-small WebP stays byte-identical (no re-encode). A file that cannot be decoded or still exceeds 64 KB at the
   lowest step is refused with the existing plain message style naming the file. Raise the zip caps (per-entry and
   total) so 32 × 10 MB images fit, keep the zip-bomb guards (ratio/total) sensible, and update docs (docs/v2 PACKS
   "The cast" portraits, authoring kit LIMITS) and refusal tests. Node tests: inject a fake encoder (no canvas in
   Node); a real-browser test with one large PNG and one JPEG in your test ST proves the stored file is WebP ≤ 64 KB.
2. "This reply" card below the fold: ST scrolls to the new message, then SB draws the card just after, so the card
   sits under the fold. After drawing (or growing) the card for the newest message, if the reader was at the bottom
   before the draw, scroll the chat to the bottom again (use view/scroll.js helpers — no scrollIntoView, no bare
   focus). Never scroll when the reader had scrolled up. Story Director has a workaround (src/v2/cast/follow.js) that
   will be removed once yours lands — read it for the cases. Test (DOM/unit) + real-ST check (desktop + phone).
3. Built-in NSD preset ids for Studio: Studio needs the list of NPC State Delta meter preset ids a cast entry's
   `meters.preset` may name. Find how SB's pack validator knows them today (or not) and export one constant list from
   SB (with a test pinning it against NSD's built-ins; read kohz87/npc_state_delta main for the real ids) that
   Studio's vendored copy can import. Do not edit Studio.
