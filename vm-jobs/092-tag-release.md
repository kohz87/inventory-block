# 092: tag the 2.0 release (no model; plain git) — READY
The lead's cloud session cannot push tags. Release PRs are merged; tag these exact merge commits (annotated tags), push the tags,
and, if `gh` is logged in on the VM, create a GitHub release per repo from the tag with the 2.0.0 (NSD 1.3.0) section of
that repo's CHANGELOG.md as the notes (mark it Latest; not a pre-release). Never move or delete an existing tag.
- kohz87/Story_block      v2.0.0  3c2930d7e8ee606be99d6d1c06c0a756bceaff00  "Story Block 2.0.0"
- kohz87/rpg_battle       v2.0.0  6f3a44e785ad418d3213b30a25a3bcd3f13759fe  "RPG Battle 2.0.0"
- kohz87/Story_director   v2.0.0  cc72c39d6549f83c2b6a7421c1bafe8c80da8367  "Story Director 2.0.0"
- kohz87/npc_state_delta  v1.3.0  80a45322d28d73bd55688446f381518e0af070d8  "NPC State Delta 1.3.0"
Steps per repo: `git clone -q https://github.com/kohz87/<repo>.git /tmp/tag-<repo> && cd /tmp/tag-<repo> && git tag -a <tag> <sha> -m "<msg>" && git push origin <tag>`
(then `gh release create <tag> --repo kohz87/<repo> --title "<msg>" --notes-file <section>` if gh works). Report as VM JOB 092 with the
four tag URLs. Delete /tmp/tag-*.
