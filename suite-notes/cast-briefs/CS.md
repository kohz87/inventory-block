# CS — Story Block: cast content kind, pack portraits, compact pills
Read C-COMMON.md first. Repo kohz87/Story_block, branch `stage33/cast` from origin/main (0b23c3f, 2.14.0). Test ST
port 8184.
1. Pack content kind `cast` (C-COMMON §1): limits, validation messages in the existing plain style, `packs.content`
   support, docs (docs/v2 pack format). Ersveil test pack: add 2 sample entries (Fenna, Sera as in the mockup).
2. Pack portraits (C-COMMON §1): import with the pack (multi-file pick), storage, `packs.portrait` query, removal with
   the pack, refusal messages (too big, wrong type, a file the pack does not name). Re-importing a newer version
   replaces its portraits.
3. Compact pills (USER: phone buttons oversized): segmented choices and small pill actions may opt in (e.g. a class
   `ss-pill` / `data-ss-hit`) to be drawn ~30px tall with an invisible 44px-tall tap area (::after) instead of the
   44 × 44 minimum, never overlapping a neighbour (row gap ≥ 12px when they wrap). Use it for Story Block's own
   segmented choices; document it for modules. Mockup v3+ shows the look.
Report: head SHA, counts, shots, and the exact `packs.content` / `packs.portrait` shapes.
