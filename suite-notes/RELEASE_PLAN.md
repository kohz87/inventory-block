# Release plan (USER, 25 Oct): playable core, then Studio for players

Goal: release Story Block, Story Director, RPG Battle and NPC State Delta as playable without major bugs, plus Story Studio,
so players can build and report bugs. Bug policy: only [normal play][silent wrong state] blocks; everything else is
fixed from player reports.

## A. Core release (must, in order)
1. Pin flow (fresh chats pin a rules pack) — SB stage5/pin + RB stage5/pin, one Sol review, merge.
2. Checks flip — SB #201, RB #148, SD #135, Sol review (083), merge together.
3. Native-death recovery (B6 GAPS "must close before release"): after a companion's death reached NSD, deleting the
   lethal reply recovers through E6b's native checkpoint selection instead of blocking the chat.
4. Live smoke in a SillyTavern the lead spins up in its own cloud container (USER: the VM's ST is unstable): a fresh
   SillyTavern checkout with a separate data root (never the user's data), all four extensions from main, the Ersveil
   pack pinned, a local scripted OpenAI-compatible mock serving replies with change lines, Playwright driving ~20 turns
   (fight, quest, check, restore, reload, delete/swipe/Re-read); no API keys involved. Fix only blockers.
5. Release prep per repo: version bump (2.0.0), CHANGELOG, README install + upgrade notes (v1 chats stay legacy),
   known issues list, tag. Ersveil pack bundled as Story Block's example.
Nice to have before release, else right after: open quest templates + foe variants (082).

## B. Studio for players (after A, in parts)
- Part 2.5: re-sync Studio's Story Block copy (082's schema fields), open + export the real Ersveil pack byte-identically,
  the two part-2 follow-ups (SB exports the skill-slug limit; Studio uses SB's constants).
- Part 3: character card and lore maker.
- Part 4: settings defaults + UI/screen builder.
- Part 5: creator kit — data-defined modules first (a generic data-module runtime in Story Block: state, narrator line
  grammar, conditions → effects, rewards via templates and bounds, screens from part 4; checked live in Studio), then
  code-module scaffolding with the testkit, then optional AI assist on the creator's own key (the Gemini drafting
  prompt becomes a built-in).

## Working split
Codex (Sol) writes and reviews; Claude decides, reads diffs, merges; Sonnet only for critical-path work when Codex is
blocked; Gemini (USER, local) for content.
