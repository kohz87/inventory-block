# UF1 — Story Block review fix-ups on stage29/ui-merge (from review 179)

Read UI-COMMON.md. Repo kohz87/Story_block, work ON branch `stage29/ui-merge` (head 36f31d8; fetch it, add commits,
push the same branch; never force). Test ST port 8173. Review: /home/user/inventory-block/vm-results/179-ui-review-sb-browser.md.

1. Ownership (179 follow-up 2): Story Block must not name another module's ids or words. Replace `DEFAULT_BAR`'s
   `story-director/...` ids with an owner-declared screen flag: a screen/tab registration may carry `bar: true`
   ("in the bar by default"); Story Block's own Home and Inventory carry it; Party/Fight keep their current rule.
   Validate the key like other screen keys (unknown on older hosts is ignored). Story Director will add `bar: true` to
   its Quests, World and Map screens in parallel (agent UF2). Remove Story Director words from help text and comments
   ("Story Director's World/quests", the `{{ q.status.summary }}` comment); tests use neutral fixture ids where they
   pin host behaviour.
2. Presets (follow-up 3): when a preset (or a switch flip) sets a feature to its `default`, clear the stored choice
   instead of writing an explicit value, so later default changes still reach the reader. Derivation unchanged.
3. Settings → Blocks wording with the RPG off (follow-up 4): RPG-role blocks say they are used by the RPG when it is on
   (no "Shown by the RPG in the Party tab" while there is no Party tab).
4. Story panel strip honours "In the bar" (follow-up 9) the same way the game view bar does, within its slot limit
   (if more are "in the bar" than fit, the reader's order decides; the rest go under More).
5. Tests per item; check + full test green; push; short report with head commit.
