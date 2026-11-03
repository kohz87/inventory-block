# REL-DIET — release prep: Story Director and NPC State Delta prompt-diet releases (after Story Block 2.19.0)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clones under $S/reldiet/, push only your branches, never
merge/PR/force/tag, never weaken/skip/delete a test — pinned changes named; never pgrep -f/pkill -f). If any command is
denied, stop that step and report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

A. Story Director 2.10.0 on branch origin/stage59/lean-sd (b5d37ae) — commit on it:
   1. `git merge --no-ff origin/main` (keep both sides).
   2. src/v2/module.js: STORY_BLOCK_WITH_HEADS = '2.19.0' (the range becomes >=2.19.0).
   3. Version 2.10.0 in every place SD keeps it (src/v2/module.js VERSION, README, AI-README lines naming this
      version, manifest, package, tests/v2/integration/host.test.js — grep 2.9.3 and change the ones that mean "this
      version"), README/AI-README "needs Story Block (>= 2.19.0)". CHANGELOG 2.10.0: "Shorter Director text (about
      3.1k → 1.5–1.7k characters a reply): one grammar line per family, merged rules, the Checks rule only without an
      RPG, route/landmark/trip taught on first use; needs Story Block 2.19.0 (kind heads keep stray lines working)."
   4. Testkit: if SD's tests use a vendored Story Block testkit, re-sync it from Story_block origin/main ONLY AFTER the
      lead says 2.19.0 is merged; until then leave it and say so.
   Full test + check + `git diff --check origin/main HEAD`; push.
B. NPC State Delta 1.8.0 on branch origin/stage63/nsd-prose (92f8d33; it contains stage59/lean-nsd) — commit on it:
   1. `git merge --no-ff origin/main` (1.7.4 is already in its base; keep both sides).
   2. Version 1.8.0 in every place (core.js NPC_STATE_VERSION, bootstrap.js, manifest, package, runtime-modules.json,
      the tests that pin it incl. the escaped regex in hydration-recovery-safety, README 1/106, DEVELOPMENT 5/259,
      AI-README 1/19/297 — grep 1.7.4). CHANGELOG 1.8.0: "The dossier scanner runs only when a reply names someone
      new or tracked (plus a safety scan every 5 replies; a saved 'Scan every' of 1 is kept); shorter dossier text;
      hidden-note wording said once; Natural portrait prompts are written as plain prose for natural-language image
      models (Flux, Krea, SD3-class)."
   Full suite on node 24 (`npx -y node@24 --import ./tests/active-runtime-test-setup.mjs --test tests/*.test.js
   tests/v2/break/*.test.js`), compatibility-check, runtime-smoke, `git diff --check origin/main HEAD`; push.
Report per job: branch + head, files, tests/counts. Short.
