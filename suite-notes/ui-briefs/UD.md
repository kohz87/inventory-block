# UD — NPC State Delta: settings folds, a scan-cadence switch, phone dossier (approved item 4 + USER note)

Read UI-COMMON.md first. Repo kohz87/npc_state_delta, base origin/main 13daee6, branch `stage29/ui-d`. Test ST port 8165.

1. Settings panel (Story Suite Settings → Modules → NPC State Delta, and NSD's own panel if it is the same code):
   - USER, 1 Nov: "Nsd preset should be stored in a preset category fold." The Meter presets block (Companion / Rival /
     Mentor + Use) moves into its own closed fold "Meter presets", placed like the other groups.
   - Everyday groups stay as they are: Scanning, Roster & continuity, Portrait generation, Data & maintenance.
   - Source of truth, Calendar & birthdays, Scanner rules, What's sent and Advanced move into one closed fold
     "Expert" (hint: "Source of truth, calendar, scanner rules, what's sent, advanced"), last, with one line at its
     top: "Rarely needed. With Story Director installed its calendar is used, so the calendar here only matters on
     its own." (show that line only when it is true; if NSD has no Story Director calendar link, say so instead).
   - Every setting stays; ids, storage keys and behaviour unchanged. NSD standalone (no Story Block): same layout.
2. New feature "Scan after every reply" (id `npc-state-delta.scan-every-reply`), default on,
   `presets: { lean: false }` (contract in Story Block's UC brief: suite-notes/ui-briefs/UC.md). Off: auto scan runs
   every 3 replies (or the "Scan every" setting if larger). Manual scans unaffected. Other NSD features: stages and any
   prompt-costly feature `presets: { lean: false }`; say which you marked.
3. Bug: the dossier window on phone (390 px) is ~310 px wide, not centred, tabs and the relationship block cut off
   (`$S/u1/30-game-dossier-open-p.png`). Make it full-width on phone with everything reachable.
4. Tests for each item. NSD's own test command(s) per its README/DEVELOPMENT.md must pass.
