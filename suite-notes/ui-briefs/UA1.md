# UA1 — Story Block: one scene header, five tabs, cleaner Home (approved item 1)

Read UI-COMMON.md first. Repo kohz87/Story_block, base origin/main 121e49a, branch `stage29/ui-a1`. Test ST port 8161.

1. Hero header (`.ss-w-hero`, Game view): the place, time, weather row is the only place these show. Add a "Here:
   <names>" item (the people present) after weather, with the same pencil Home's Where card uses for people; give
   place and weather the pencils Home's Where card has today (same editors, same commands). On phone the row wraps to
   more lines instead of truncating ("Bluewatch Vi…" must not happen).
2. Home: drop the Where card (`section.panel.scene`) wherever the hero header is shown above Home. If Home is ever shown
   without the hero (check the Story panel and any other host), keep the Where card there.
3. Home layout: cards size to their content; desktop puts the cards in rows of 3 (no 5 equal columns, no stretched
   empty bodies); Save points becomes one slim full-width row at the end (title, Save point button, "No save points in
   this chat yet." or the list). Phone stays one column.
4. Game view panel is opaque in every panel style (the chat must not show through it; today Glass lets it). Keep the
   blur/look otherwise. Story panel unchanged.
5. Tabs: the bar shows Home, Inventory, Quests, World, Map; every other tab (Chronicle, Director, Dossiers, Scene,
   custom blocks, …) goes under "More" by default, on desktop too (today More exists only when tabs overflow on phone).
   RPG on: Party joins the bar; Fight joins the bar only while a fight is on. In Settings → Tabs & Packs each tab row
   gets a choice "In the bar / Under More" (stored per reader like hide/order today; a reader's existing hidden/order
   choices keep working). Same rule for the Story panel's bar.
6. Bug: with the RPG off, blocks that carry an RPG role (character/skills/foes) must not appear as tabs (shot
   `$S/u1/40-game-home-with-leftover-block-tabs-d.png`); turning the RPG back on brings them back. Where two tabs would
   have the same name, the Tabs & Packs list must tell them apart (e.g. "Character (2)").
7. Bug: with the RPG on, the hero header shows no Health/Mana/Stamina bars (`.ss-hero-vitals` stays hidden; shot
   `$S/u1/60-rpg-home-d.png`). Find why and show them as the hero was designed to.

Do not touch the cards under replies (UA2) or the Features page (UC).
