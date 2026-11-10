# ZC — post-release check + README screenshots (USER, 2 Nov). No repo changes. Working folder $S/zc/; ST port 8198.
Rules: X-COMMON.md hard rules (secrets, user data, PID files, no playwright install, never touch rpg_battle). If any
command is denied, stop that step and report it; never re-run it in another form. Use fresh folders; never delete.
Released mains: Story Block 768c41a (2.16.0, Ersveil 2.4.1), Story Director d972c4f (2.9.0), NPC State Delta 64af0ac
(1.7.0). Studio 0.6.0 is not released yet — skip Studio; the lead sends it later.
1. Check: fresh clones of the three mains; `npm run check`, full `npm test`, `git diff --check` each (NSD: compat + smoke).
2. Real ST (own data copy of $S/bc270/st-data, never open secrets.json) with the three mains and a scripted mock model
   writing good story text (no "test", no lorem): `/go Ersveil`, import the Ersveil 2.4.1 zip (pack.json + portraits),
   play ~8 replies: meet two cast (one by place, one drawnTo), take a quest, a trip, a clock edit via Edit, a key person
   pin, a secret opened. Console errors: none expected — report any.
3. Screenshots for READMEs — the released look, no error toasts, no API/connection panels, no settings with personal
   data, no "Not connected to API!" text visible (crop or hide the ST input bar). Desktop 1440×900 (crop to the
   relevant area, ~1200 px wide max) and phone 390×844 where it helps. Save as optimized PNG or WebP, each ≤ 300 KB,
   into $S/zc/shots/<repo>/ with plain names:
   - story-block: game-view-home (hero with Edit), hero-editor (open), reply-card ("This reply"), inventory, packs
     (Settings → Tabs & Packs with Ersveil), phone-home.
   - story-director: world, map, quests, status-card, clock-tile (card line "Clock set to …"), phone-world.
   - npc-state-delta: dossier (a cast person with portrait), dossier-secrets (hidden notes look), dossier-library,
     present-card (in-chat), phone-dossier.
   Write $S/zc/shots/INDEX.md: each file, what it shows, size, and a one-line caption for a README.
Report: counts per repo, console errors, any bug found (with repro), the shots index path.
