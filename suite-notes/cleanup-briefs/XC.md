# XC — NPC State Delta clean-up (branch `stage36/cleanup-nsd` from origin/main f642101; test ST port 8193; clone $S/xc/)
Read X-COMMON.md first.
1. Checkpoint 404s (pre-existing): the vault's put() reads the file first, so a new checkpoint logs a 404 in the
   browser console/network. Find the path, make a first write not produce a 404 (e.g. know it is new, or check without
   an erroring request) without changing what is stored or when. Test + real-ST check that a fresh chat's first reply
   produces no 404 for NSD files.
2. Verify (no change unless broken): `.delta-panel` and the dossier jump-chip bar are opaque on desktop and phone (no
   chat or content shows through while scrolling). Shots. If either is still see-through, fix it with the existing
   panel colours.
3. If you find anything else broken on the way, report it; do not fix outside these items.
