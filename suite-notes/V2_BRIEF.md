# Brief for Story Suite v2 agents

Read first: the spec, `docs/v2/SPEC.md` on Story Block's `v2` branch (a copy is in your worktree). It is the
contract. If something you need is missing or contradictory, do NOT invent a private alternative: write it
under "Spec questions" in your report, pick the most conservative reading, and keep it isolated behind the
spec's interface names so the coordinator can adjust it.

## Isolation
- Work ONLY in your worktree (given in your task) on your own branch (off `v2`). Never edit /home/user/<repo>
  main checkouts, /home/user/_main/*, or another agent's worktree.
- You own ONLY the files listed in your task. Do not edit `index.js`, `manifest.json`, `package.json`,
  `README.md`, `CHANGELOG.md`, CI files or files owned by another agent: the coordinator wires and versions.
  If you truly need a change there, describe it as a patch in your report.
- No new runtime dependencies. Plain ES modules (no TypeScript, no build). Dev dependencies only if the repo
  already has them.
- Never use `pkill -f` broad patterns (it has killed the controlling shell); kill by PID.
- SP=<SP>

## Quality
- Tests with `node --test` next to the existing ones (`tests/v2/*.test.js`). Cover success paths, every
  rejection, and the invariants the spec names (nothing saved on rejection, replay equals rebuild, swipe and
  delete roll back, re-narration doesn't repeat, claims, byte-identical static prompt where relevant).
- The repo's existing tests must still pass (`npm test`), and `npm run check` if the repo has it.
- Match the repo's style: comment density, naming, plain-words messages for the reader.
- Code is deterministic where the spec says so: no `Math.random`, no `Date.now()` in state or ordering.

## Shipping
- Commit with these trailers (and no model names anywhere in the repo):
  `Co-Authored-By: (the attribution line the session gives)`
  `Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu`
- `git fetch -q origin v2 && git rebase origin/v2`, re-run tests, push your branch
  (`git push -u origin <branch> --force-with-lease=<branch>:<remote sha or empty>`), open a PR **into `v2`**
  (`gh api repos/kohz87/<Repo>/pulls -f base=v2 -f head=<branch> -f title=... -F body=@file`), body ending with:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)` / blank line /
  `https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu`
- The user allows merging into `v2` after green CI. Poll CI (`gh api repos/kohz87/<Repo>/commits/<sha>/check-runs | python3 $SP/cr.py`); when green, squash-merge (if the permission check refuses, stop and report — never work around it)
  (`gh api -X PUT repos/kohz87/<Repo>/pulls/<n>/merge -f merge_method=squash -f commit_title="… (#n)"`).
  If another agent merged first and you conflict, rebase on `origin/v2` and re-run tests; never edit their files
  to resolve it.
- Repo names for gh: Story_block, rpg_battle, Story_director, npc_state_delta.

## Report
PR link, what you built in plain words, the exported interface exactly as implemented (signatures), test
counts, spec questions and the conservative choice you made, and anything not done.

## Current state (wave 3)
- Story Block v2 on origin: store, commands, registry, capture, prompt, turn, sdk, host-ui, testkit, domains (scene,
  inventory, one currency), packs, events, layouts, mounts, widgets. Integrators are wiring index.js on `v2-int`
  branches in every repo right now; do NOT edit index.js, manifest.json, package.json, src/v2/module.js.
- The spec snapshot is /home/user/_main/story_block/docs/v2/ (SPEC.md, MODULES.md incl. §F decisions F1–F19,
  LAYOUTS.md, WIDGETS.md, PACKS.md). Read the §F decisions: they override older text.
- Module repos: write a new part folder exporting `part` (MODULES §A). The integrator's module.js will import it
  (tell the coordinator the import line in your report).
- To test against the real host in a module repo, copy Story Block's runtime from /home/user/_main/story_block
  (`testkit/`, `src/v2/`, `src/id.js`) into your own tests/v2/<part>/vendor/ ONLY if needed; prefer a fake ctx.
