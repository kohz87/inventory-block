# RM — README refresh + AI-README (USER, 2 Nov). One agent per repo: RM-SB, RM-SD, RM-NSD, RM-ST.
Rules: X-COMMON.md hard rules (exact trailer, push only your branch `docs/readme-2026-11`, never merge/PR/force/tag, no
version bump or CHANGELOG). If any command is denied, stop that step and report it; never re-run it in another form.
Branch from the repo's origin/main (lead gives the SHA). Clone into $S/rm-<repo>/.
1. README.md (for people): refresh to the current release. Plain, short sentences; what it is, install (order and
   requirements: Story Block first, then Story Director, NPC State Delta optional; Studio is a standalone page), what you
   see and do (Game view, Edit button, reply card, World, dossiers, cast, save points, packs/portraits), settings worth
   knowing, how the four fit together (one short section, same wording in all four), limits, troubleshooting (one-line
   items: reply length setting vs. the change lines; a chat that was stuck heals on open), links. Keep accurate facts
   that are still true; remove anything about removed features (the v1 sidebar/tabs, RPG Battle beyond one line).
   Do not invent features: check every claim against the code and docs/ of the release.
2. Screenshots: replace every old image in docs/images/ that shows removed UI with the new shots (lead gives the folders:
   $S/zc/shots/<repo>/ and $S/zs/shots/<repo>/; prefer the zs one where both exist). Copy into docs/images/ with plain
   names; delete old images no README links any more (git rm in your branch is fine — they live in history). Each image
   with alt text and a one-line caption. Keep the README's total images ≤ 8 and each ≤ 300 KB.
3. AI-README.md (for AI assistants that read the repo): dense, structured, plain facts, no marketing. Sections:
   Purpose (2 lines) · Suite map (the four repos, who owns what, one-way data flow) · Install & requirements · Concepts
   (glossary of the repo's own terms) · Reader features (bullets, each with where it lives in the UI) · Settings (name →
   what it does, default) · Data the model sees (what is injected, when; what is never sent) · Reply format the model
   writes (the line grammar this repo reads, with 3–6 real examples) · Pack format pointers (fields this repo reads,
   limits) · Commands/queries (sdk names → one line each, for module authors) · Storage (where state lives, per chat) ·
   File map (top folders/files → purpose) · Limits & known follow-ups · Version. Keep it under ~600 lines; link to
   docs/ for depth instead of copying. Link AI-README.md from README.md in one line.
4. Checks: the repo's check + full tests + diff --check stay green (tests may pin README text or images — update those
   pins only and say so). Report: branch, head, files changed, image list, line counts, pins changed.
